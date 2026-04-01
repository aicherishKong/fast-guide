# 10 后端实现计划

> 阶段目标：将架构设计拆解为可执行的后端开发任务，明确 Chain 实现顺序和测试策略。

## 输出文件清单

| 文件 | 内容 | 状态 |
|------|------|------|
| `chain_design.md` | 各 Chain 的详细实现规范（Prompt 设计、输入输出）| 已完成 |
| `task_queue_design.md` | arq 任务设计、重试策略、监控 | 已完成 |
| `db_access_patterns.md` | 常用查询模式、索引使用、N+1 预防 | 已完成 |
| `sprint_plan.md` | 开发任务拆解、优先级、估时 | 已完成 |

## 开发优先级

### P0（基础设施）
- `main.py`：FastAPI app factory + lifespan
- `config.py`：pydantic-settings
- `db/session.py`：async SQLAlchemy
- Alembic 初始迁移（含 pgvector extension）
- JWT auth 端点

### P1（核心功能 Chain）
- `chains/llm_factory.py`：三档 LLM
- `core/resume/scorer.py`：ResumeScoreChain
- `core/resume/rewriter.py`：ResumeRewriteChain（SSE）
- `core/interview/question_gen.py`：QuestionGenerateChain
- `core/interview/evaluator.py`：AnswerEvaluationChain（SSE）
- `workers/tasks.py`：arq 三个核心任务

### P2（高级功能）
- `core/interview/voice.py`：Whisper 转写 + WebSocket
- `core/training/`：BlueprintChain + DeepDiveChain + FeynmanChain
- `core/resume/embedder.py`：pgvector 写入/检索

## 完成标准

- [ ] P0 基础设施全部可运行（`docker compose up` 后后端启动正常）
- [ ] P1 所有 Chain 有对应单元测试（使用 FakeLLM）
- [ ] 所有 API 端点有集成测试覆盖
- [ ] arq worker 可独立启动并处理任务
