# arq 任务队列设计 — task_queue_design.md

> 阶段：10_backend_plan | 状态：有效
>
> ## 变更记录
> | 日期 | 变更内容 | Agent |
> |------|---------|-------|
> | 2026-04-01 | 初始版本 | backend-plan-agent |

---

## 一、架构概览

```
FastAPI API Handler
    │
    │ await redis.enqueue_job("task_name", arg1, arg2)
    ▼
Redis (DB=2, arq 专用)
    │
    │ arq worker 轮询
    ▼
arq Worker Process（独立进程，同 backend 镜像）
    ├── analyze_resume_task
    ├── generate_interview_report_task
    └── generate_training_plan_task
    │
    │ 任务完成后
    ▼
Redis PUBLISH → FastAPI WS Handler → 前端通知
```

---

## 二、任务清单

### 2.1 analyze_resume_task

| 项 | 值 |
|----|----|
| 触发端点 | `POST /api/v1/resumes/upload` |
| 输入 | `resume_id: str` |
| 超时 | 300 秒 |
| 前置条件 | `resumes.status = 'pending'` |
| 状态变更 | `pending → analyzing → analyzed / failed` |

**执行步骤：**

1. 从 DB 读取 `resumes` 记录，验证 status=pending
2. 更新 status = `analyzing`
3. 从 MinIO 下载文件（storage_key）
4. 调用 `parser.py` 提取文本（PDF: PyMuPDF / DOCX: python-docx）
5. 更新 `resumes.raw_text`
6. 调用 `embedder.py` 分块 + pgvector 写入（RecursiveCharacterTextSplitter, chunk_size=512）
7. 如果有 `jd_text`：调用 `ResumeScoreChain` 生成评分 → 写入 `resume_analyses`
8. 更新 status = `analyzed`
9. Redis PUBLISH 通知前端

**错误处理：**

| 错误类型 | 处理 |
|---------|------|
| 文件下载失败 | status → failed，记录错误原因 |
| 文本提取失败（PDF损坏）| status → failed，提示用户重新上传 |
| LLM 调用失败 | status → failed，保留 raw_text，用户可重试评分 |
| 嵌入写入失败 | 重试 1 次，仍失败则 status → failed |

---

### 2.2 generate_interview_report_task

| 项 | 值 |
|----|----|
| 触发端点 | `POST /api/v1/interviews/sessions/{id}/complete` |
| 输入 | `session_id: str` |
| 超时 | 300 秒 |
| 前置条件 | `interview_sessions.status = 'completed'` |
| 状态变更 | `completed → report_generating → report_ready / report_failed` |

**执行步骤：**

1. 从 DB 读取 session + 所有 questions + answers
2. 更新 session status = `report_generating`
3. 创建 `interview_reports` 记录（status=generating）
4. 组装 `interview_records`（题目+回答+单题评分列表）
5. 调用 `InterviewSummaryChain.ainvoke()`
6. 写入报告字段（overall_score, dimension_scores 等）
7. 更新 report status = `completed`，session status = `report_ready`
8. Redis PUBLISH 通知前端

**错误处理：**

| 错误类型 | 处理 |
|---------|------|
| LLM 调用失败 | report status → failed，session status → report_failed |
| 数据不完整（无 answers）| report status → failed |

---

### 2.3 generate_training_plan_task

| 项 | 值 |
|----|----|
| 触发端点 | `POST /api/v1/training/plans` |
| 输入 | `plan_id: str` |
| 超时 | 300 秒 |
| 前置条件 | `training_plans.status = 'generating'` |
| 状态变更 | `generating → active / failed` |

**执行步骤：**

1. 从 DB 读取 plan 记录，获取 source_type + source_id
2. 根据 source_type 获取数据：
   - `interview_report`：读取 interview_report + session 的 jd_text + 简历 raw_text
   - `jd_only`：使用 plan 中存储的 jd_text
3. 调用 `BlueprintChain.ainvoke()` 生成 GapDetectionOutput
4. 创建 `training_items` 记录（按 suggested_learning_order 写入 sequence_order）
5. 根据 prerequisite_topics 设置初始 status：
   - 无前置依赖 → `pending`
   - 有前置依赖 → `locked`
6. 更新 plan 字段（total_items, total_estimated_minutes 等）
7. 更新 plan status = `active`
8. Redis PUBLISH 通知前端

**错误处理：**

| 错误类型 | 处理 |
|---------|------|
| LLM 调用失败 | plan status → failed |
| 面试报告不存在 | plan status → failed |

---

## 三、Worker 配置

```python
# backend/app/workers/tasks.py

class WorkerSettings:
    functions = [
        analyze_resume_task,
        generate_interview_report_task,
        generate_training_plan_task,
    ]
    redis_settings = arq.connections.RedisSettings(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        database=settings.REDIS_DB_QUEUE,  # DB=2
    )
    max_jobs = 10          # 并发任务上限
    job_timeout = 300      # 单任务超时 5 分钟
    keep_result = 3600     # 结果保留 1 小时
    poll_delay = 0.5       # 轮询间隔 0.5 秒
    max_tries = 1          # 不自动重试（业务层已有重试逻辑）
```

**启动命令：**

```bash
arq app.workers.tasks.WorkerSettings
```

---

## 四、任务入队约定

```python
# backend/app/services/queue.py
from arq import ArqRedis

async def enqueue_task(redis: ArqRedis, task_name: str, *args, **kwargs):
    """统一入队方法，所有 API handler 通过此函数入队"""
    job = await redis.enqueue_job(task_name, *args, **kwargs)
    return job.job_id
```

**API handler 中调用示例：**

```python
@router.post("/resumes/upload", status_code=201)
async def upload_resume(
    file: UploadFile,
    jd_text: str | None = Form(None),
    redis: ArqRedis = Depends(get_redis),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. 保存文件到 MinIO
    # 2. 创建 resumes 记录（status=pending）
    # 3. 入队分析任务
    await enqueue_task(redis, "analyze_resume_task", str(resume.id))
    # 4. 返回 resume 信息
```

---

## 五、通知推送

### 5.1 Redis Pub/Sub Channel 命名

```
task_complete:{user_id}
```

### 5.2 消息格式

```json
{
  "task_type": "resume_analysis",
  "entity_id": "uuid-xxx",
  "status": "completed"
}
```

### 5.3 Worker 端发布

```python
async def publish_task_complete(redis, user_id: str, task_type: str, entity_id: str, status: str):
    await redis.publish(
        f"task_complete:{user_id}",
        json.dumps({
            "task_type": task_type,
            "entity_id": entity_id,
            "status": status,
        })
    )
```

### 5.4 FastAPI WS Handler 订阅

```python
@router.websocket("/ws/notifications")
async def ws_notifications(ws: WebSocket, token: str = Query(...)):
    user = verify_token(token)
    await ws.accept()
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"task_complete:{user.id}")
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                await ws.send_text(message["data"])
    finally:
        await pubsub.unsubscribe()
```

---

## 六、监控与可观测性

| 指标 | 来源 | 监控方式 |
|------|------|---------|
| 队列积压数 | `arq:queue` Redis key 长度 | Redis LLEN 定期查询 |
| 任务执行时长 | Worker 日志 | 结构化日志（JSON）|
| 任务成功/失败率 | `arq:result:*` Redis keys | 按 status 字段统计 |
| Worker 进程存活 | Docker healthcheck | arq 提供 `--check` 命令 |

**日志格式约定：**

```json
{
  "timestamp": "2026-04-01T12:00:00Z",
  "level": "INFO",
  "task": "analyze_resume_task",
  "job_id": "xxx",
  "resume_id": "yyy",
  "duration_ms": 12500,
  "status": "completed"
}
```
