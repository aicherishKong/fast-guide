# 后端开发任务拆解 — sprint_plan.md

> 阶段：10_backend_plan | 状态：有效
>
> ## 变更记录
> | 日期 | 变更内容 | Agent |
> |------|---------|-------|
> | 2026-04-01 | 初始版本 | backend-plan-agent |

---

## 一、总体优先级

```
Sprint 1 (P0): 基础设施 — 让后端能跑起来
Sprint 2 (P1): 简历优化 — 第一个完整功能闭环
Sprint 3 (P1): 模拟面试（文字模式）— 核心功能
Sprint 4 (P2): 知识缺口训练 — 三大功能闭环
Sprint 5 (P2): 语音面试 + 优化 — 高级功能
```

---

## 二、Sprint 1：基础设施（P0）

> 目标：`docker compose up` 后后端能正常启动，JWT 认证可用。

### 任务清单

| # | 任务 | 文件 | 依赖 | 验收标准 |
|---|------|------|------|---------|
| 1.1 | Docker Compose 编排 | `docker-compose.yml` | 无 | `docker compose up -d` 启动 PG + Redis + MinIO |
| 1.2 | MinIO 初始化脚本 | `docker/init-minio.sh` | 1.1 | 自动创建 3 个 bucket |
| 1.3 | pyproject.toml + 依赖声明 | `backend/pyproject.toml` | 无 | `uv pip install -e ".[dev]"` 成功 |
| 1.4 | Pydantic Settings 配置 | `backend/app/config.py` | 1.3 | 从 .env 加载所有变量，缺失时报错 |
| 1.5 | SQLAlchemy async engine | `backend/app/db/session.py` | 1.3, 1.4 | 连接 PG 成功 |
| 1.6 | ORM Base + 全部 Model | `backend/app/models/*.py` | 1.5 | 所有 11 个 Model 定义完成 |
| 1.7 | Alembic 初始化 + 首次迁移 | `backend/app/db/migrations/` | 1.6 | `alembic upgrade head` 建表成功 |
| 1.8 | FastAPI app factory | `backend/app/main.py` | 1.4, 1.5 | lifespan 管理 DB/Redis 连接 |
| 1.9 | 共享 Dependencies | `backend/app/dependencies.py` | 1.5, 1.8 | `get_db`, `get_redis`, `get_current_user` |
| 1.10 | JWT Auth 服务 | `backend/app/services/auth.py` | 1.4 | Token 签发/验证/续期 |
| 1.11 | Auth API 端点 | `backend/app/api/v1/auth.py` | 1.9, 1.10 | register/login/refresh/logout 可用 |
| 1.12 | Users API 端点 | `backend/app/api/v1/users.py` | 1.9 | GET/PUT /users/me 可用 |
| 1.13 | CORS 配置 | `backend/app/main.py` | 1.8 | 允许 localhost:5173 |
| 1.14 | Dockerfile | `backend/Dockerfile` | 1.3 | 构建镜像成功 |

**Sprint 1 验收：**
```bash
docker compose up -d
cd backend && uv pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --port 8000
# 验证：POST /api/v1/auth/register → 201
# 验证：POST /api/v1/auth/login → 200 + access_token
# 验证：GET /api/v1/users/me → 200
```

---

## 三、Sprint 2：简历优化（P1）

> 目标：简历上传 → 后台分析 → 评分报告 → 一键改写完整闭环。

### 任务清单

| # | 任务 | 文件 | 依赖 | 验收标准 |
|---|------|------|------|---------|
| 2.1 | MinIO Storage 服务 | `backend/app/services/storage.py` | S1 | 上传/下载/预签名 URL 可用 |
| 2.2 | LLM Factory | `backend/app/chains/llm_factory.py` | S1 | 三档 LLM 实例化成功 |
| 2.3 | SSE Streaming 辅助 | `backend/app/chains/streaming.py` | 2.2 | sse_stream() 返回 StreamingResponse |
| 2.4 | PDF/DOCX Parser | `backend/app/core/resume/parser.py` | 无 | 提取文本正确 |
| 2.5 | Embedder (pgvector) | `backend/app/core/resume/embedder.py` | S1, 2.2 | 分块嵌入写入 resume_chunks |
| 2.6 | KeywordExtractChain | `backend/app/core/resume/scorer.py` | 2.2 | 结构化输出 KeywordExtractionOutput |
| 2.7 | ResumeScoreChain | `backend/app/core/resume/scorer.py` | 2.6 | 输出 ResumeScoreOutput |
| 2.8 | ResumeRewriteChain | `backend/app/core/resume/rewriter.py` | 2.2, 2.3 | SSE 流式输出改写文本 |
| 2.9 | arq Worker 框架 | `backend/app/workers/tasks.py` | S1 | Worker 能启动并轮询 |
| 2.10 | analyze_resume_task | `backend/app/workers/tasks.py` | 2.4, 2.5, 2.7 | 后台完成全流程 |
| 2.11 | 通知推送 (Redis pub/sub) | `backend/app/services/queue.py` | S1 | Worker 完成后 publish |
| 2.12 | WS 通知端点 | `backend/app/api/v1/notifications.py` | 2.11 | 前端 WS 收到通知 |
| 2.13 | Resume API 全部端点 | `backend/app/api/v1/resume.py` | 2.1-2.10 | 6 个端点全部可用 |
| 2.14 | Resume Pydantic Schemas | `backend/app/schemas/resume.py` | 无 | 请求/响应 Schema |
| 2.15 | 单元测试（FakeLLM）| `backend/tests/unit/test_resume_chains.py` | 2.6, 2.7, 2.8 | Chain I/O 验证 |

**Sprint 2 验收：**
```bash
# 上传简历
curl -X POST /api/v1/resumes/upload -F file=@resume.pdf -F jd_text="..."
# 等待分析完成（轮询 status 或 WS 通知）
# 查看评分
curl /api/v1/resumes/{id}/analysis
# SSE 改写
curl -N "/api/v1/resumes/{id}/rewrite?token=xxx&analysis_id=yyy"
```

---

## 四、Sprint 3：模拟面试 — 文字模式（P1）

> 目标：面试配置 → 文字问答循环（含自适应难度）→ 汇总报告。

### 任务清单

| # | 任务 | 文件 | 依赖 | 验收标准 |
|---|------|------|------|---------|
| 3.1 | SessionContextChain（4 模式）| `backend/app/core/interview/session.py` | 2.2 | 各模式生成候选人画像 |
| 3.2 | QuestionGenerateChain | `backend/app/core/interview/question_gen.py` | 2.2, 3.1 | 结构化输出 InterviewQuestion |
| 3.3 | 自适应难度算法 | `backend/app/core/interview/session.py` | 无 | 纯 Python 升降档正确 |
| 3.4 | AnswerEvaluationChain | `backend/app/core/interview/evaluator.py` | 2.2, 2.3 | 流式+结构化双版本 |
| 3.5 | InterviewSummaryChain | `backend/app/core/interview/evaluator.py` | 2.2 | 结构化输出 InterviewSummaryOutput |
| 3.6 | generate_interview_report_task | `backend/app/workers/tasks.py` | 3.5, 2.9 | arq 后台生成报告 |
| 3.7 | Interview Pydantic Schemas | `backend/app/schemas/interview.py` | 无 | 请求/响应 Schema |
| 3.8 | Interview API 全部端点 | `backend/app/api/v1/interview.py` | 3.1-3.6, 3.7 | 5 个 REST 端点可用 |
| 3.9 | Redis Session State 管理 | `backend/app/services/cache.py` | S1 | 会话状态 Redis 读写 |
| 3.10 | 单元测试 | `backend/tests/unit/test_interview_chains.py` | 3.1-3.5 | Chain I/O + 自适应算法 |

**Sprint 3 验收：**
```bash
# 创建面试（resume_jd 模式，adaptive 难度）
curl -X POST /api/v1/interviews/sessions -d '{"mode":"resume_jd","resume_id":"...","jd_text":"...","difficulty":"adaptive"}'
# 提交答案（SSE 评分）
curl -X POST /api/v1/interviews/sessions/{id}/answers -d '{"answer_text":"..."}'
# 结束 → 查看报告
curl -X POST /api/v1/interviews/sessions/{id}/complete
curl /api/v1/interviews/sessions/{id}/report
```

---

## 五、Sprint 4：知识缺口训练（P2）

> 目标：面试报告 → 训练计划 → 蓝图 → 学习 → 费曼 → 复测完整闭环。

### 任务清单

| # | 任务 | 文件 | 依赖 | 验收标准 |
|---|------|------|------|---------|
| 4.1 | BlueprintChain | `backend/app/core/training/gap_detector.py` | 2.2 | 输出 GapDetectionOutput |
| 4.2 | generate_training_plan_task | `backend/app/workers/tasks.py` | 4.1, 2.9 | 后台生成蓝图 + items |
| 4.3 | 知识点解锁逻辑 | `backend/app/core/training/plan_generator.py` | S1 | 前置依赖检查 + status 更新 |
| 4.4 | DeepDiveChain（分层 SSE）| `backend/app/core/training/plan_generator.py` | 2.2, 2.3 | 4 层 SSE 输出 |
| 4.5 | FeynmanChain | `backend/app/core/training/retester.py` | 2.2 | 评估输出 FeynmanEvalOutput |
| 4.6 | RetestQuestionChain | `backend/app/core/training/retester.py` | 2.2 | 生成复测题 |
| 4.7 | RetestEvalChain | `backend/app/core/training/retester.py` | 2.2 | 评分复测答案 |
| 4.8 | Training Pydantic Schemas | `backend/app/schemas/training.py` | 无 | 请求/响应 Schema |
| 4.9 | Training API 全部端点 | `backend/app/api/v1/training.py` | 4.1-4.7, 4.8 | 7 个端点可用 |
| 4.10 | 单元测试 | `backend/tests/unit/test_training_chains.py` | 4.1, 4.4-4.7 | Chain I/O 验证 |

**Sprint 4 验收：**
```bash
# 创建训练计划
curl -X POST /api/v1/training/plans -d '{"source_type":"interview_report","session_id":"..."}'
# 查看蓝图
curl /api/v1/training/plans/{id}/blueprint
# SSE 学习内容
curl -N "/api/v1/training/plans/{id}/items/{item_id}?token=xxx"
# 费曼总结
curl -X POST /api/v1/training/plans/{id}/items/{item_id}/summary -d '{"user_summary":"..."}'
# 复测
curl -X POST /api/v1/training/plans/{id}/retest
```

---

## 六、Sprint 5：语音面试 + 优化（P2）

> 目标：语音面试 WebSocket 通道可用，整体优化。

### 任务清单

| # | 任务 | 文件 | 依赖 | 验收标准 |
|---|------|------|------|---------|
| 5.1 | Whisper 转写封装 | `backend/app/core/interview/voice.py` | 无 | base64 PCM → 文本 |
| 5.2 | 语音面试 WS 端点 | `backend/app/api/v1/interview.py` | 5.1, S3 | WS 建连、收音、转写、评分、发题 |
| 5.3 | 音频存储（MinIO）| `backend/app/services/storage.py` | 2.1 | 录音保存 + audio_key 写入 answer |
| 5.4 | 集成测试 | `backend/tests/integration/` | 全部 | 端到端流程测试 |
| 5.5 | 错误处理完善 | 全局 | 全部 | 统一错误码、边界情况处理 |
| 5.6 | 性能优化 | 全局 | 全部 | 连接池调优、缓存策略 |

**Sprint 5 验收：**
```bash
# WebSocket 语音面试
wscat -c "ws://localhost:8000/api/v1/interviews/sessions/{id}/voice?token=xxx"
# 发送音频 → 收到转写 + 评分 + 下一题
```

---

## 七、测试策略

### 7.1 单元测试

| 测试对象 | 方法 | 工具 |
|---------|------|------|
| Chain I/O 验证 | FakeLLM 替换真实 LLM | `langchain_core.language_models.FakeListChatModel` |
| 自适应难度算法 | 输入不同 score_history 验证档位 | pytest |
| Pydantic Schema | 构造合法/非法输入验证 | pytest |
| Parser（PDF/DOCX）| 使用测试文件验证提取结果 | pytest + 固定测试文件 |

### 7.2 集成测试

| 测试范围 | 方法 | 依赖 |
|---------|------|------|
| API 端点 | httpx AsyncClient + TestClient | PostgreSQL（测试 DB）|
| arq 任务 | 直接调用 task 函数（不经队列）| PostgreSQL + Redis |
| 数据库操作 | fixture 创建/清理测试数据 | PostgreSQL（事务回滚）|

### 7.3 测试数据库

```python
# conftest.py
@pytest_asyncio.fixture
async def db_session():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_session() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
```

---

## 八、依赖包清单

```toml
# backend/pyproject.toml [project.dependencies]
[project]
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.32",
    "sqlalchemy[asyncio]>=2.0",
    "asyncpg>=0.30",
    "alembic>=1.13",
    "pgvector>=0.3",
    "langchain-core>=0.3",
    "langchain-openai>=0.2",
    "langchain-postgres>=0.0.12",
    "langchain-text-splitters>=0.3",
    "pydantic>=2.9",
    "pydantic-settings>=2.6",
    "arq>=0.26",
    "redis>=5.2",
    "minio>=7.2",
    "python-jose[cryptography]>=3.3",
    "passlib[bcrypt]>=1.7",
    "python-multipart>=0.0.12",
    "pymupdf>=1.24",
    "python-docx>=1.1",
    "httpx>=0.27",
    "jinja2>=3.1",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.24",
    "ruff>=0.8",
    "mypy>=1.13",
]
```
