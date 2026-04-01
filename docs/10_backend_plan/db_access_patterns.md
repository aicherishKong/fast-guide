# 数据库访问模式 — db_access_patterns.md

> 阶段：10_backend_plan | 状态：有效
>
> ## 变更记录
> | 日期 | 变更内容 | Agent |
> |------|---------|-------|
> | 2026-04-01 | 初始版本 | backend-plan-agent |

---

## 一、Session 管理

```python
# backend/app/db/session.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

engine = create_async_engine(
    settings.POSTGRES_DSN,        # postgresql+asyncpg://...
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    echo=settings.APP_DEBUG,
)

async_session = async_sessionmaker(engine, expire_on_commit=False)

# Depends 注入
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
```

---

## 二、常用查询模式

### 2.1 简历域

**获取用户简历列表（分页 + 最近评分）：**

```python
# N+1 预防：使用 selectinload 预加载最近分析
stmt = (
    select(Resume)
    .where(Resume.user_id == user_id)
    .options(selectinload(Resume.analyses))
    .order_by(Resume.created_at.desc())
    .offset(offset)
    .limit(limit)
)
```

**根据 resume_id + jd_hash 查找已有分析（去重）：**

```python
stmt = select(ResumeAnalysis).where(
    ResumeAnalysis.resume_id == resume_id,
    ResumeAnalysis.jd_hash == jd_hash,
)
```

**删除简历及级联数据：**

```python
# CASCADE 由数据库外键处理，ORM 只需删除父记录
await session.delete(resume)
await session.commit()
# resume_analyses + resume_chunks 自动级联删除
```

### 2.2 面试域

**获取会话及其全部题目+回答（报告生成用）：**

```python
# 一次查询加载完整数据树，避免 N+1
stmt = (
    select(InterviewSession)
    .where(InterviewSession.id == session_id)
    .options(
        selectinload(InterviewSession.questions)
        .selectinload(InterviewQuestion.answer)
    )
)
```

**获取用户面试历史（列表页，含报告评分）：**

```python
stmt = (
    select(InterviewSession)
    .where(InterviewSession.user_id == user_id)
    .options(selectinload(InterviewSession.report))
    .order_by(InterviewSession.created_at.desc())
    .offset(offset)
    .limit(limit)
)
```

**更新会话状态 + score_history（原子操作）：**

```python
# 使用 update() 避免 ORM 加载整个对象
stmt = (
    update(InterviewSession)
    .where(InterviewSession.id == session_id)
    .values(
        status="in_progress",
        score_history=func.jsonb_concat(
            InterviewSession.score_history,
            cast([new_score], JSONB)
        ),
    )
)
await session.execute(stmt)
```

### 2.3 训练域

**获取蓝图（计划 + 全部知识点）：**

```python
stmt = (
    select(TrainingPlan)
    .where(TrainingPlan.id == plan_id)
    .options(
        selectinload(TrainingPlan.items)
    )
)
# items 按 sequence_order 排序（Python 侧排序，或加 order_by）
plan = result.scalar_one()
items = sorted(plan.items, key=lambda x: x.sequence_order)
```

**解锁依赖知识点（完成一个 item 后检查并解锁后续）：**

```python
# 1. 获取刚完成 item 的 topic
completed_topic = item.topic

# 2. 查找本 plan 中 prerequisite_topics 包含该 topic 的 locked items
stmt = (
    select(TrainingItem)
    .where(
        TrainingItem.plan_id == plan_id,
        TrainingItem.status == "locked",
        TrainingItem.prerequisite_topics.contains([completed_topic]),  # JSONB @> 操作
    )
)
locked_items = (await session.execute(stmt)).scalars().all()

# 3. 对每个 locked item，检查其所有 prerequisite_topics 是否都已 completed
for locked_item in locked_items:
    all_prereqs_done = all(
        prereq in completed_topics_set
        for prereq in locked_item.prerequisite_topics
    )
    if all_prereqs_done:
        locked_item.status = "pending"
```

**更新训练计划进度：**

```python
# 使用子查询计算已完成数
completed_count_stmt = (
    select(func.count())
    .where(
        TrainingItem.plan_id == plan_id,
        TrainingItem.status == "completed",
    )
)
count = (await session.execute(completed_count_stmt)).scalar()

stmt = (
    update(TrainingPlan)
    .where(TrainingPlan.id == plan_id)
    .values(completed_items=count)
)
```

### 2.4 向量检索

**简历分块相似度检索：**

```python
# 使用 pgvector cosine 距离
from pgvector.sqlalchemy import Vector

stmt = (
    select(ResumeChunk)
    .where(ResumeChunk.resume_id == resume_id)
    .order_by(ResumeChunk.embedding.cosine_distance(query_embedding))
    .limit(k)
)
```

---

## 三、N+1 预防清单

| 场景 | 关联路径 | 预加载方式 |
|------|---------|-----------|
| 简历列表展示评分 | `Resume → ResumeAnalysis` | `selectinload(Resume.analyses)` |
| 面试历史展示评分 | `InterviewSession → InterviewReport` | `selectinload(InterviewSession.report)` |
| 报告生成加载问答 | `Session → Questions → Answers` | 链式 `selectinload` |
| 蓝图展示知识点 | `TrainingPlan → TrainingItems` | `selectinload(TrainingPlan.items)` |

---

## 四、事务边界

| 操作 | 事务范围 | 说明 |
|------|---------|------|
| 简历上传 | 单事务 | 创建 resumes 记录 + 入队任务 |
| arq 分析任务 | 分段事务 | 每步独立 commit（文本提取、嵌入写入、评分写入）|
| 提交答案 | 单事务 | 创建 answer + 更新 session score_history |
| 结束面试 | 单事务 | 更新 session status + 创建 report 记录 + 入队 |
| 完成知识点 | 单事务 | 更新 item status + 解锁后续 items + 更新 plan 进度 |

---

## 五、索引使用验证

开发阶段用 `EXPLAIN ANALYZE` 验证关键查询是否命中索引：

```sql
-- 验证用户简历列表查询
EXPLAIN ANALYZE
SELECT * FROM resumes WHERE user_id = 'uuid' ORDER BY created_at DESC LIMIT 20;

-- 验证向量相似度检索使用 HNSW
EXPLAIN ANALYZE
SELECT * FROM resume_chunks
WHERE resume_id = 'uuid'
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 4;

-- 验证分析去重索引
EXPLAIN ANALYZE
SELECT * FROM resume_analyses WHERE resume_id = 'uuid' AND jd_hash = 'sha256';
```
