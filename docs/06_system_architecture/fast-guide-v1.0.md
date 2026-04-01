# fast-guide 求职增效平台 — 工程化架构规范 + LangChain Chain I/O 接口规范

## Context

从零搭建求职增效平台，围绕"简历通过率 + 面试通过率"两个核心结果指标，提供三大闭环功能：简历优化、模拟面试、知识缺口训练。纯绿地项目，目录 `E:\fuyao\project\fast-guide` 当前为空。

---

## 整体架构

**Monorepo，两个 App，一套 docker-compose**

```
fast-guide/
  backend/          # FastAPI 应用
  frontend/         # React + Vite 应用
  docker/           # Nginx 配置、MinIO 初始化脚本
  docker-compose.yml
  .env.example
  README.md
```

**服务拓扑**

```
Browser
  │  REST / SSE / WebSocket
  ▼
Frontend (React SPA → Nginx 静态托管)
  │  /api/*  →  backend:8000
  ▼
Backend (FastAPI + uvicorn)
  ├── PostgreSQL 16 + pgvector   (关系数据 + 向量检索，同一个库)
  ├── Redis                      (arq 任务队列 + 缓存 + SSE pub/sub)
  ├── MinIO                      (简历 PDF、音频录音、导出报告)
  └── LLM Provider               (DashScope / OpenAI 兼容接口)
```

---

## 技术选型

| 层级 | 选型 | 理由 |
|------|------|------|
| Web 框架 | FastAPI 0.115 | async-first，原生 SSE/WebSocket |
| ORM | SQLAlchemy[asyncio] + asyncpg | 全异步，Alembic 做迁移 |
| LLM | LangChain + ChatOpenAI (DashScope 兼容) | qwen-turbo/plus/max 三档 |
| Embedding | text-embedding-v3 (1024 dims) | 同 DashScope 端点，无额外服务 |
| 向量存储 | pgvector HNSW (cosine) | 避免引入额外向量 DB |
| 任务队列 | arq (async Redis) | 比 Celery 更适合 asyncio |
| 文件存储 | MinIO (S3 兼容) | 本地开发，生产换 OSS/S3 同接口 |
| Auth | JWT (access 15min + refresh 7d HttpOnly cookie) | 无状态，适合 FastAPI async |
| 前端框架 | React 18 + Vite + TypeScript | SPA，无 SSR 需求 |
| 样式 | Tailwind CSS + shadcn/ui | 快速搭建，组件质量高 |
| 状态管理 | Zustand | 三个独立 store，无 Redux 开销 |
| 实时通信 | SSE（文本模式）+ WebSocket（语音模式）| SSE 单向流更简单，WS 仅语音需要双向 |
| 语音转写 | Whisper API | 可换 faster-whisper 本地降成本 |

---

## 目录结构

### Backend

```
backend/
  app/
    main.py               # FastAPI app factory，lifespan，router 注册
    config.py             # Pydantic Settings，读 .env
    dependencies.py       # 共享 Depends（db session, redis, current_user）

    api/v1/
      auth.py             # POST /auth/register|login|refresh|logout
      resume.py           # 简历上传、评分、改写
      interview.py        # 面试会话、答题 SSE、语音 WS、报告
      training.py         # 训练计划、学习内容 SSE、复测
      users.py            # 个人资料

    core/
      resume/
        parser.py         # PDF/DOCX 文本提取
        embedder.py       # 分块 + pgvector 写入
        scorer.py         # 关键词提取 + 差距分析 + 评分 chain
        rewriter.py       # 一键改写 streaming chain
      interview/
        session.py        # 会话状态机
        question_gen.py   # JD-aware 出题 chain
        evaluator.py      # 单题 + 汇总 rubric chain
        voice.py          # Whisper 转写封装
      training/
        gap_detector.py   # 面试报告 → 知识缺口提取 chain
        plan_generator.py # 个性化学习计划生成 chain
        retester.py       # 复测出题 + 评分 chain

    chains/
      llm_factory.py      # 三档 LLM (fast/default/quality) + streaming
      prompt_loader.py    # 从 prompts/ 目录加载 Jinja2 模板
      streaming.py        # SSE StreamingResponse 辅助函数

    models/               # SQLAlchemy ORM
    schemas/              # Pydantic 请求/响应
    db/session.py         # async engine + session factory
    db/migrations/        # Alembic
    services/             # storage.py, cache.py, auth.py, queue.py
    workers/tasks.py      # arq 后台任务
    prompts/              # *.txt Jinja2 prompt 模板（版本控制）

  tests/unit/ tests/integration/
  pyproject.toml
  Dockerfile
  alembic.ini
```

### Frontend

```
frontend/src/
  pages/
    auth/         LoginPage, RegisterPage
    resume/       UploadPage, LibraryPage, DetailPage, OptimizePage
    interview/    ConfigPage, SessionPage, ReportPage, HistoryPage
    training/     PlanPage, ItemPage, RetestPage
    dashboard/    DashboardPage

  components/
    layout/       Layout, Sidebar, Header
    common/       StreamingText, ScoreRing, RadarChart, FileUploadCard, DiffViewer
    resume/       KeywordBadge, ScorePanel
    interview/    VoiceRecorder, ChatBubble, RubricScore, QuestionCard
    training/     PlanTimeline, GapCard

  hooks/          useAuth, useSSE, useVoiceRecorder, useResumeOptimize, useInterviewSession
  api/            client.ts (axios + token refresh), resume.ts, interview.ts, training.ts
  store/          authStore, resumeStore, interviewStore, trainingStore
  types/
```

---

## API 设计（关键端点）

### 简历优化
```
POST   /api/v1/resumes/upload              上传 PDF/DOCX，触发后台分析
GET    /api/v1/resumes/{id}/analysis       评分报告（关键词差距、分项分数）
POST   /api/v1/resumes/{id}/score          针对新 JD 重新评分
GET    /api/v1/resumes/{id}/rewrite        SSE 流式改写
POST   /api/v1/resumes/{id}/rewrite/accept 保存改写版本
```

### 模拟面试
```
POST   /api/v1/interviews/sessions              创建会话（含模式+难度配置），返回第一题
POST   /api/v1/interviews/sessions/{id}/answers SSE 流式评分 + 下一题
WS     /api/v1/interviews/sessions/{id}/voice   语音双向通道
POST   /api/v1/interviews/sessions/{id}/complete
GET    /api/v1/interviews/sessions/{id}/report  SSE 生成汇总报告
```

**面试会话支持四种输入模式（mode 字段）：**

| mode | resume_id | jd_text | 适用场景 |
|------|-----------|---------|---------|
| `resume_jd` | 必填 | 必填 | 最精准，同时对齐背景与岗位要求 |
| `jd_only` | 可选 | 必填 | 探索新领域，尚无匹配简历 |
| `resume_only` | 必填 | 可选 | 通用能力评估，不限定岗位 |
| `free` | 可选 | 可选 | 指定主题练习（free_topic 字段） |

**难度配置（difficulty 字段）：**

| 难度 | 题型分布 | 深度 |
|------|---------|------|
| `easy` | 80% 行为题 + 20% 基础技术题 | 知识点表面层 |
| `medium` | 50% 行为题 + 50% 技术题 | 原理+应用 |
| `hard` | 30% 行为题 + 70% 技术/系统设计 | 边界情况+方案权衡 |
| `adaptive` | 动态调整 | 根据实时得分自动升降级 |

> `adaptive` 规则：连续2题均分 > 80 → 升一档；连续2题均分 < 55 → 降一档；始终保持在 easy↔hard 范围内。

### 知识缺口训练
```
POST   /api/v1/training/plans                              从面试报告或 JD 生成计划（含全局知识图谱）
GET    /api/v1/training/plans/{id}/blueprint               全局蓝图（知识点关联图 + 学习路径）
GET    /api/v1/training/plans/{id}/items/{item_id}         SSE 流式生成局部学习内容
POST   /api/v1/training/plans/{id}/items/{item_id}/complete
POST   /api/v1/training/plans/{id}/items/{item_id}/summary 提交费曼总结 → SSE 返回反馈
POST   /api/v1/training/plans/{id}/retest                  SSE 复测出题
POST   /api/v1/training/retest/{id}/answers
GET    /api/v1/training/retest/{id}/result                 前后对比分数
```

---

## LangChain Chain 设计

### Feature 1: 简历优化
```
ScoreChain:
  RunnableParallel(
    resume_keywords = KeywordExtractChain(fast LLM),
    jd_keywords     = KeywordExtractChain(fast LLM),
  )
  → GapAnalysisChain
  → ScoringChain (quality LLM, structured output)

RewriteChain: RewritePrompt | llm("quality").astream()
```

### Feature 2: 模拟面试（多模式 + 自适应难度）

```
SessionContextChain（会话初始化，按 mode 路由）:
  mode=resume_jd   → RunnableParallel(简历摘要, JD关键要求提取) → 合并候选人画像
  mode=jd_only     → JD关键要求提取 → 虚拟候选人画像（通用背景假设）
  mode=resume_only → 简历摘要 → 通用能力评估画像（不绑定岗位）
  mode=free        → free_topic → 主题知识图谱提取

QuestionGenChain（支持自适应难度）:
  输入: candidate_profile, difficulty(当前档), asked_types[], weak_areas[], running_avg_score
  → difficulty=adaptive 时: AdaptiveDifficultyRouter(running_avg_score) → 实际难度档
  → QuestionGenerateChain(profile, effective_difficulty, asked_types, weak_areas)
  → 输出: InterviewQuestion + effective_difficulty（记录实际使用难度）

EvalChain (streaming):
  EvaluationPrompt | llm("quality").astream()
  输出: { score, dimensions{}, strengths[], improvements[], next_question_direction }
  副作用: 更新 running_avg_score → 触发 adaptive 难度重算

SummaryChain (后台 arq 任务):
  RunnableParallel(各维度汇总) → OverallAssessmentChain
  附加: 生成 mode_specific_insights（不同 mode 的报告侧重不同）
```

**AdaptiveDifficultyRouter 规则（纯 Python，无需 LLM）：**
```python
def adaptive_next_difficulty(history: list[int], current: str) -> str:
    # history: 最近 N 题得分列表
    if len(history) < 2: return current
    recent_avg = sum(history[-2:]) / 2
    order = ["easy", "medium", "hard"]
    idx = order.index(current)
    if recent_avg > 80 and idx < 2: return order[idx + 1]  # 升档
    if recent_avg < 55 and idx > 0: return order[idx - 1]  # 降档
    return current
```

### Feature 3: 知识缺口训练（三阶段费曼学习法）

**设计原则：** 全局蓝图 → 局部细挖 → 费曼概括，贯穿知识关联性

```
阶段1: BlueprintChain（全局规划，arq 后台生成）
  GapDetectChain(gaps, candidate_profile)
  → KnowledgeGraphChain: 构建知识点关联图
    - 每个 topic 的 prerequisites[]（前置依赖）
    - related_topics[]（横向关联，同层知识点）
    - leads_to[]（学完后可延伸的方向）
  → LearningPathChain: 拓扑排序生成最优学习序列
  → 输出: Blueprint（含关联图 + 路径 + 总时长估算）

阶段2: DeepDiveChain（局部细挖，SSE 按需触发）
  输入: topic + candidate_background + related_topics_already_learned[]
  → LearningContentChain（分层输出）:
    Layer1: 核心概念（是什么）
    Layer2: 原理与机制（为什么）
    Layer3: 实战应用（怎么用）+ 代码示例
    Layer4: 关联延伸（"你在 X 中学过的 Y，在这里体现为..."）
  → 每个 Layer 末尾附 connection_prompt: 主动提示与其他知识点的关联

阶段3: FeynmanChain（费曼总结，用户主动触发）
  用户用自己的语言提交总结文本
  → FeynmanEvalChain:
    评估维度: 准确性、完整性、用自己语言的程度（非照抄）、是否提到关联点
    输出: { clarity_score, accuracy_score, missing_concepts[], connection_awareness, encouragement }
  → 若 clarity_score < 70: 返回追问提示，引导用户补充
  → 若 accuracy_score < 60: 指出具体偏差，不直接给答案，而是给提示
```

**知识关联性实现：** 每个 `TrainingItem` 存储 `related_to: list[str]`，前端以有向图形式渲染，点击节点可跳转，已完成节点高亮。

---

## 数据模型（关键实体）

```
User          id, email, password_hash, name, created_at
Resume        id, user_id, storage_key, raw_text, status
ResumeAnalysis id, resume_id, jd_hash, overall_score, dimension_scores(JSONB),
               missing_keywords[], suggestions(JSONB), rewritten_text
ResumeChunk   id, resume_id, content, embedding(vector 1024)

InterviewSession  id, user_id, resume_id, jd_text, mode, difficulty, status
InterviewQuestion id, session_id, question_index, question_text, expected_points(JSONB)
InterviewAnswer   id, question_id, answer_text, audio_key, score, evaluation(JSONB)
InterviewReport   id, session_id, overall_score, dimension_scores(JSONB), summary, strengths[], improvement_areas[]

TrainingPlan  id, user_id, source_type, source_id, status, completed_items/total_items
TrainingItem  id, plan_id, topic, severity, learning_content, status, sequence_order
RetestSession id, plan_id, before_scores(JSONB), after_scores(JSONB), improvement_rate
```

---

## 前端路由

```
/dashboard
/resumes                 → /resumes/upload, /resumes/:id, /resumes/:id/optimize
/interviews              → /interviews/new, /interviews/:id/session, /interviews/:id/report
/training                → /training/:id, /training/:id/retest
```

StreamingText 组件：监听 SSE `data: {chunk}` 追加渲染，`data: {done: true}` 关闭连接。
VoiceRecorder 组件：MediaRecorder API，VAD 检测，PCM chunks 发往 WebSocket。

---

## 部署拓扑

### 本地开发（Docker Compose）

```yaml
services:
  postgres:     pgvector/pgvector:pg16  :5432
  redis:        redis:7                 :6379
  minio:        minio/minio             :9000/:9001
  backend:      ./backend               :8000  (volume hot reload)
  worker:       ./backend (arq worker)  # 同镜像，不同 command
  frontend:     ./frontend              :5173  (Vite HMR)
```

Vite 代理：`/api → localhost:8000`，`/api/v1/interviews WS → ws://localhost:8000`

### 生产（单台云主机 v1）

```
Internet → Nginx (SSL) → /api/* → uvicorn:8000 (4 workers)
                       → /*     → Nginx 静态文件
PostgreSQL/Redis/MinIO → 托管服务 (RDS/ElastiCache/OSS)
```

---

## 开发启动流程

```bash
# 1. 启动基础设施
docker compose up postgres redis minio createbuckets -d

# 2. 后端
cd backend && python -m venv .venv && source .venv/Scripts/activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 3. arq worker（独立终端）
arq app.workers.tasks.WorkerSettings

# 4. 前端
cd frontend && pnpm install && pnpm dev
```

### 核心环境变量（.env.example）
```
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_API_KEY=sk-xxx
LLM_MODEL_FAST=qwen-turbo
LLM_MODEL_DEFAULT=qwen-plus
LLM_MODEL_QUALITY=qwen-max
EMBEDDING_MODEL=text-embedding-v3
EMBEDDING_DIMS=1024
POSTGRES_*/REDIS_*/MINIO_*/JWT_SECRET_KEY/...
```

---

## 验收标准

| 场景 | 验证方式 |
|------|---------|
| 简历上传 → 评分 | POST /resumes/upload → 轮询 status=analyzed → GET /analysis 返回 JSON |
| SSE 改写流 | curl -N GET /resumes/{id}/rewrite?jd_text=... 看到 chunk 事件 |
| 面试会话 | POST /sessions → POST /answers → SSE 逐字输出评分 → POST /complete |
| 语音面试 | wscat 连接 WS，发送 PCM bytes，收到转写 + 评分文本 |
| 训练计划生成 | POST /training/plans (source=interview_report) → arq 任务完成 → GET plan items |
| pgvector 检索 | 上传简历后查询 resume_chunks 表，embedding 列非空 |
| 前端 SSE | 打开 ResumeOptimizePage，粘贴 JD，点击"一键改写"，文字逐字出现 |

---

## 关键文件清单

- `backend/app/main.py` — FastAPI factory，lifespan，CORS，路由注册
- `backend/app/chains/llm_factory.py` — 三档 LLM 选择 + streaming 配置
- `backend/app/core/resume/scorer.py` — 评分 chain（RunnableParallel）
- `backend/app/core/interview/evaluator.py` — 面试评分 + 汇总 chain
- `backend/app/workers/tasks.py` — arq 异步任务（分析、报告、计划生成）
- `backend/app/db/migrations/` — Alembic，pgvector extension 必须在首次迁移创建
- `frontend/src/hooks/useSSE.ts` — EventSource 封装，驱动所有流式 UI
- `frontend/src/hooks/useVoiceRecorder.ts` — MediaRecorder + VAD + WS 发送
- `frontend/src/components/common/StreamingText.tsx` — chunk 追加渲染组件
- `docker-compose.yml` — 一键启动全部基础设施

---

# LangChain Chain I/O 接口规范

> 基于 LangChain 最新文档（langchain-core ≥ 0.3，langchain-openai ≥ 0.2）整理。
> 所有 Chain 遵循 LCEL（LangChain Expression Language）规范，使用 `|` pipe 组合。

---

## 一、LCEL 核心原语速查

### 1.1 Runnable 通用接口

所有 LCEL 组件均实现以下方法：

```python
# 同步
def invoke(input: Input, config: RunnableConfig | None = None) -> Output
def stream(input: Input, config: RunnableConfig | None = None) -> Iterator[Output]
def batch(inputs: list[Input], config: ...) -> list[Output]

# 异步（生产环境使用）
async def ainvoke(input: Input, config: RunnableConfig | None = None) -> Output
async def astream(input: Input, config: RunnableConfig | None = None) -> AsyncIterator[Output]
async def astream_events(input: Input, version: str = "v2", ...) -> AsyncIterator[StandardStreamEvent]
async def abatch(inputs: list[Input], config: ...) -> list[Output]
```

### 1.2 RunnableParallel — 并行执行

```python
from langchain_core.runnables import RunnableParallel

# 构造方式（两种等价写法）
parallel = RunnableParallel(key1=runnable1, key2=runnable2)
parallel = RunnableParallel({"key1": runnable1, "key2": runnable2})

# 类型签名
# Input:  单个值，同时传给所有子 runnable
# Output: dict[str, Any]，key 与构造时一致

result: dict = await parallel.ainvoke("input string")
# → {"key1": runnable1的输出, "key2": runnable2的输出}
```

### 1.3 RunnablePassthrough — 透传输入

```python
from langchain_core.runnables import RunnablePassthrough

# 常用于在 parallel 中保留原始输入
chain = RunnableParallel(
    original=RunnablePassthrough(),
    processed=some_chain,
)
```

### 1.4 with_structured_output — 结构化输出绑定

```python
# 绑定 Pydantic 模型（推荐）→ 返回 Pydantic 实例
structured_llm = llm.with_structured_output(MyPydanticModel, method="json_schema")

# 绑定 TypedDict → 返回 dict
structured_llm = llm.with_structured_output(MyTypedDict)

# 绑定 JSON Schema → 返回 dict
structured_llm = llm.with_structured_output({
    "type": "object",
    "properties": {...},
    "required": [...]
})

# 调用签名（与普通 llm 相同）
result: MyPydanticModel = await structured_llm.ainvoke(messages)
```

### 1.5 ChatPromptTemplate

```python
from langchain_core.prompts import ChatPromptTemplate

template = ChatPromptTemplate.from_messages([
    ("system", "你是一个 HR 专家，{persona}"),
    ("human", "{user_input}"),
])

# Input:  dict，key 与模板变量对应
# Output: list[BaseMessage]（传入 llm）
messages = await template.ainvoke({"persona": "...", "user_input": "..."})
```

### 1.6 ChatOpenAI 配置（DashScope 兼容）

```python
from langchain_openai import ChatOpenAI

def get_llm(tier: Literal["fast", "default", "quality"] = "default") -> ChatOpenAI:
    model_map = {
        "fast":    "qwen-turbo",   # 关键词提取、快速分类
        "default": "qwen-plus",    # 大多数任务
        "quality": "qwen-max",     # 改写、面试汇总、评分
    }
    return ChatOpenAI(
        model=model_map[tier],
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        api_key=settings.LLM_API_KEY,
        temperature=0.2,
        max_retries=2,
        streaming=True,           # 启用 token 级流式
        stream_usage=True,        # 流式时附带 token 用量
    )
```

### 1.7 astream_events 事件格式（version="v2"）

```python
async for event in chain.astream_events(input, version="v2"):
    event: StandardStreamEvent = {
        "event":      str,        # "on_chat_model_stream" | "on_chain_end" 等
        "name":       str,        # 组件名称
        "run_id":     str,        # UUID
        "tags":       list[str],
        "metadata":   dict,
        "data": {
            "chunk":  AIMessageChunk,  # on_chat_model_stream 时
            "output": Any,             # on_chain_end 时
        }
    }
```

**FastAPI SSE 推送模式（项目统一约定）：**

```python
# backend/app/chains/streaming.py
from fastapi.responses import StreamingResponse

async def sse_stream(chain, input_data: dict):
    async def generator():
        async for chunk in chain.astream(input_data):
            # AIMessageChunk.content 为增量文本
            if hasattr(chunk, "content") and chunk.content:
                yield f"data: {json.dumps({'chunk': chunk.content}, ensure_ascii=False)}\n\n"
        yield 'data: {"done": true}\n\n'

    return StreamingResponse(generator(), media_type="text/event-stream")
```

---

## 二、Feature 1：简历优化 Chain 规范

### 2.1 Pydantic 数据模型

```python
# backend/app/schemas/resume.py
from pydantic import BaseModel, Field
from typing import Literal

class KeywordExtractionOutput(BaseModel):
    """关键词提取结果"""
    technical_skills: list[str] = Field(description="技术技能关键词，如编程语言、框架、工具")
    soft_skills: list[str] = Field(description="软技能关键词，如沟通、领导力、协作")
    domain_knowledge: list[str] = Field(description="领域知识关键词，如行业术语、业务知识")
    certifications: list[str] = Field(description="证书、学历要求关键词")
    experience_requirements: list[str] = Field(description="经验要求关键词，如年限、项目类型")

class DimensionScore(BaseModel):
    score: int = Field(ge=0, le=100, description="维度得分 0-100")
    reason: str = Field(description="扣分/得分原因，不超过50字")
    suggestions: list[str] = Field(description="改进建议，最多3条")

class ResumeScoreOutput(BaseModel):
    """简历评分结果（with_structured_output 绑定此模型）"""
    overall_score: int = Field(ge=0, le=100, description="综合得分")
    dimensions: dict[Literal["relevance","keywords","structure","quantification"], DimensionScore]
    missing_keywords: list[str] = Field(description="JD 有但简历缺失的关键词")
    matched_keywords: list[str] = Field(description="简历与 JD 共同命中的关键词")
    top_suggestions: list[str] = Field(description="最重要的3条改进建议，按优先级排序", max_length=3)
    rewrite_hints: list[str] = Field(description="改写时需重点突出的方向，供 RewriteChain 使用")
```

### 2.2 KeywordExtractChain

```python
# 文件: backend/app/core/resume/scorer.py

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda

keyword_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一位资深 HR，擅长从职位描述或简历中提取结构化关键词。"),
    ("human", "请从以下文本中提取关键词，严格按 JSON 格式返回。\n\n文本：\n{text}"),
])

# Input:  {"text": str}
# Output: KeywordExtractionOutput（Pydantic 实例）
KeywordExtractChain = (
    keyword_prompt
    | get_llm("fast").with_structured_output(KeywordExtractionOutput, method="json_schema")
)
```

**调用示例：**
```python
result: KeywordExtractionOutput = await KeywordExtractChain.ainvoke({"text": jd_text})
```

**输入 JSON：**
```json
{"text": "负责后端微服务开发，要求熟悉 Python/FastAPI，3年以上工作经验..."}
```

**输出 JSON：**
```json
{
  "technical_skills": ["Python", "FastAPI", "微服务"],
  "soft_skills": ["沟通协作"],
  "domain_knowledge": ["后端开发"],
  "certifications": [],
  "experience_requirements": ["3年以上"]
}
```

### 2.3 ResumeScoreChain（完整评分链）

```python
from langchain_core.runnables import RunnableParallel, RunnablePassthrough

# Step 1: 并行提取双方关键词
extract_parallel = RunnableParallel(
    resume_keywords=KeywordExtractChain,           # Input: {"text": resume_text}
    jd_keywords=KeywordExtractChain,               # Input: {"text": jd_text}
    original=RunnablePassthrough(),                # 透传原始输入
)

# Step 2: 合并结果注入评分 prompt
score_prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "你是资深 HR 评估专家。请对候选人简历与目标 JD 的匹配度进行全面评分。\n"
        "评分维度：relevance（岗位相关性）、keywords（关键词覆盖率）、"
        "structure（结构清晰度）、quantification（量化表达度）。"
    )),
    ("human", (
        "## 目标 JD\n{jd_text}\n\n"
        "## 候选人简历\n{resume_text}\n\n"
        "## JD 关键词\n{jd_keywords}\n\n"
        "## 简历关键词\n{resume_keywords}\n\n"
        "请输出结构化评分结果。"
    )),
])

# Input:  {"resume_text": str, "jd_text": str}
# Output: ResumeScoreOutput
ResumeScoreChain = (
    RunnableParallel(
        resume_keywords=(RunnableLambda(lambda x: {"text": x["resume_text"]}) | KeywordExtractChain),
        jd_keywords=(RunnableLambda(lambda x: {"text": x["jd_text"]}) | KeywordExtractChain),
        resume_text=RunnableLambda(lambda x: x["resume_text"]),
        jd_text=RunnableLambda(lambda x: x["jd_text"]),
    )
    | score_prompt
    | get_llm("quality").with_structured_output(ResumeScoreOutput, method="json_schema")
)
```

**调用签名：**
```python
# 输入
input_data = {
    "resume_text": "张三，5年后端开发经验，熟悉 Python/Django...",
    "jd_text": "要求 Python/FastAPI，3年以上，熟悉 Docker..."
}
# 输出
result: ResumeScoreOutput = await ResumeScoreChain.ainvoke(input_data)
```

**输出 JSON 示例：**
```json
{
  "overall_score": 72,
  "dimensions": {
    "relevance":        {"score": 80, "reason": "岗位方向吻合", "suggestions": ["突出 API 设计经验"]},
    "keywords":         {"score": 65, "reason": "缺失 FastAPI、Docker", "suggestions": ["补充框架使用经历"]},
    "structure":        {"score": 75, "reason": "结构清晰但缺少量化", "suggestions": ["添加项目数据指标"]},
    "quantification":   {"score": 60, "reason": "缺少数字佐证", "suggestions": ["用具体数据描述成果"]}
  },
  "missing_keywords": ["FastAPI", "Docker", "CI/CD"],
  "matched_keywords": ["Python", "后端开发", "MySQL"],
  "top_suggestions": [
    "在技能栏补充 FastAPI 实战经验",
    "每段项目经历补充量化指标（如QPS、用户量）",
    "添加 Docker 容器化部署相关描述"
  ],
  "rewrite_hints": ["强调 API 设计", "补充容器化经验", "量化项目成果"]
}
```

### 2.4 ResumeRewriteChain（流式）

```python
rewrite_prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "你是专业的简历优化顾问。根据目标 JD 和改写建议，"
        "对候选人简历进行针对性改写。保持真实性，禁止捏造经历。"
        "输出完整的改写后简历文本，使用 Markdown 格式。"
    )),
    ("human", (
        "## 原始简历\n{resume_text}\n\n"
        "## 目标 JD\n{jd_text}\n\n"
        "## 改写重点\n{rewrite_hints}\n\n"
        "## 缺失关键词（需自然融入）\n{missing_keywords}\n\n"
        "请输出改写后的完整简历："
    )),
])

# Input:  {"resume_text": str, "jd_text": str, "rewrite_hints": list[str], "missing_keywords": list[str]}
# Output: AsyncIterator[AIMessageChunk]（流式文本）
ResumeRewriteChain = rewrite_prompt | get_llm("quality")

# FastAPI 端点调用方式
async def rewrite_stream(data: RewriteRequest):
    return sse_stream(ResumeRewriteChain, data.model_dump())
```

**SSE 输出事件序列：**
```
data: {"chunk": "# 张三\n"}
data: {"chunk": "## 个人简介\n"}
data: {"chunk": "5年后端开发经验，熟悉 FastAPI..."}
...
data: {"done": true, "total_tokens": 1240}
```

---

## 三、Feature 2：模拟面试 Chain 规范

### 3.1 Pydantic 数据模型

```python
# backend/app/schemas/interview.py
from pydantic import BaseModel, Field
from typing import Literal

# ---- 会话配置（创建时传入）----
class SessionConfig(BaseModel):
    mode: Literal["resume_jd", "jd_only", "resume_only", "free"]
    resume_id: str | None = None       # resume_jd / resume_only 必填
    jd_text: str | None = None         # resume_jd / jd_only 必填
    free_topic: str | None = None      # free 模式必填，如"系统设计"
    difficulty: Literal["easy", "medium", "hard", "adaptive"] = "medium"
    question_count: int = Field(default=5, ge=3, le=15)

# ---- 会话运行时状态（存 Redis，会话期间维护）----
class SessionState(BaseModel):
    session_id: str
    mode: str
    candidate_profile: str            # 由 SessionContextChain 生成，后续题目复用
    effective_difficulty: Literal["easy", "medium", "hard"]
    score_history: list[int] = []     # 每题得分，adaptive 模式用于调档
    asked_types: list[str] = []
    current_index: int = 0

class InterviewQuestion(BaseModel):
    """出题 Chain 输出"""
    question_text: str = Field(description="面试题目正文")
    question_type: Literal["behavioral", "technical", "situational", "case"]
    difficulty: Literal["easy", "medium", "hard"]
    expected_points: list[str] = Field(description="评分要点，3-5条", max_length=5)
    follow_up_hints: list[str] = Field(description="追问方向，供面试官参考", max_length=3)
    time_suggestion_seconds: int = Field(description="建议作答时长（秒）", ge=30, le=300)

class RubricDimension(BaseModel):
    score: int = Field(ge=0, le=25, description="该维度得分，满分25")
    feedback: str = Field(description="具体反馈，不超过100字")

class AnswerEvaluationOutput(BaseModel):
    """单题评分 Chain 输出"""
    total_score: int = Field(ge=0, le=100)
    dimensions: dict[
        Literal["content_accuracy", "structure_clarity", "star_adherence", "communication"],
        RubricDimension
    ]
    strengths: list[str] = Field(description="回答亮点，1-3条", max_length=3)
    improvements: list[str] = Field(description="改进建议，1-3条", max_length=3)
    model_answer_hints: list[str] = Field(description="参考答案要点，帮助学习")
    next_question_direction: str = Field(description="下一题方向建议（传给出题 Chain）")

class InterviewSummaryOutput(BaseModel):
    """面试汇总 Chain 输出（arq 后台任务）"""
    overall_score: int = Field(ge=0, le=100)
    dimension_scores: dict[
        Literal["technical", "communication", "structure", "problem_solving"],
        int
    ] = Field(description="各维度平均分，用于前端雷达图")
    overall_assessment: str = Field(description="整体评价，200字以内")
    top_strengths: list[str] = Field(description="突出优势，3条", max_length=3)
    critical_gaps: list[str] = Field(description="关键短板，3条", max_length=3)
    hiring_recommendation: Literal["strong_yes", "yes", "borderline", "no"]
    learning_priorities: list[str] = Field(description="优先学习方向，供训练计划使用")
    # mode-specific 附加字段
    mode_insights: str = Field(description="针对本次面试模式的专项洞察")
```

### 3.2 SessionContextChain（会话初始化，按 mode 路由）

```python
# backend/app/core/interview/session.py

from langchain_core.runnables import RunnableLambda, RunnableParallel

profile_from_resume_jd_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是 HR，生成一段 300 字以内的候选人画像摘要，供后续出题使用。"),
    ("human", "## 简历\n{resume_text}\n\n## 目标 JD\n{jd_text}\n\n请生成候选人画像："),
])

profile_from_jd_only_prompt = ChatPromptTemplate.from_messages([
    ("system", "基于 JD，生成一个通用候选人假设画像，用于针对岗位要求出题。"),
    ("human", "## 目标 JD\n{jd_text}\n\n请生成岗位能力要求摘要："),
])

profile_from_resume_only_prompt = ChatPromptTemplate.from_messages([
    ("system", "基于候选人简历，生成通用能力画像，用于综合评估面试出题。"),
    ("human", "## 简历\n{resume_text}\n\n请生成候选人能力摘要："),
])

# mode 路由器（纯 Python，无 LLM 消耗）
def build_context_chain(mode: str):
    if mode == "resume_jd":
        return profile_from_resume_jd_prompt | get_llm("fast") | StrOutputParser()
    elif mode == "jd_only":
        return profile_from_jd_only_prompt | get_llm("fast") | StrOutputParser()
    elif mode == "resume_only":
        return profile_from_resume_only_prompt | get_llm("fast") | StrOutputParser()
    else:  # free
        return RunnableLambda(lambda x: f"自由练习主题：{x['free_topic']}")

# Input:  SessionConfig + 对应的 resume_text / jd_text
# Output: str（candidate_profile，存入 SessionState.candidate_profile）
```

### 3.3 QuestionGenerateChain（支持自适应难度）

```python
# backend/app/core/interview/question_gen.py

question_prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "你是经验丰富的技术面试官。根据候选人背景和目标岗位，"
        "出一道有针对性的面试题。避免重复已问过的题目类型。\n"
        "当前难度档位：{effective_difficulty}。"
        "easy=基础概念和行为题；medium=原理应用和技术实践；hard=系统设计和边界权衡。"
    )),
    ("human", (
        "## 候选人画像\n{candidate_profile}\n\n"
        "## 目标信息\n{context_info}\n\n"       # resume_jd=JD摘要; jd_only=JD; resume_only=空; free=主题
        "## 已问过的题型\n{asked_types}\n\n"
        "## 上一题薄弱点（针对性追问）\n{weak_areas}\n\n"
        "请出一道面试题："
    )),
])

# Input 类型
class QuestionGenInput(BaseModel):
    candidate_profile: str
    context_info: str                              # 由 mode 决定内容
    effective_difficulty: Literal["easy", "medium", "hard"]
    asked_types: list[str]
    weak_areas: list[str] = []

# Output: InterviewQuestion
QuestionGenerateChain = (
    question_prompt
    | get_llm("default").with_structured_output(InterviewQuestion, method="json_schema")
)

# 自适应难度计算（在 session.py 调用，无需 LLM）
def next_effective_difficulty(state: SessionState) -> Literal["easy", "medium", "hard"]:
    if len(state.score_history) < 2:
        return state.effective_difficulty
    recent_avg = sum(state.score_history[-2:]) / 2
    order = ["easy", "medium", "hard"]
    idx = order.index(state.effective_difficulty)
    if recent_avg > 80 and idx < 2:
        return order[idx + 1]   # 升档
    if recent_avg < 55 and idx > 0:
        return order[idx - 1]   # 降档
    return state.effective_difficulty
```

**POST /sessions 请求/响应示例：**

```json
// 请求（resume_jd 模式，adaptive 难度）
{
  "mode": "resume_jd",
  "resume_id": "uuid-xxx",
  "jd_text": "负责微服务架构设计，要求 FastAPI + Docker...",
  "difficulty": "adaptive",
  "question_count": 6
}

// 响应
{
  "session_id": "sess-yyy",
  "first_question": {
    "question_text": "请描述一次你主导的系统架构设计经历...",
    "question_type": "technical",
    "difficulty": "medium",
    "expected_points": ["..."],
    "time_suggestion_seconds": 150
  },
  "effective_difficulty": "medium",
  "question_index": 0
}
```

**输入 JSON：**
```json
{
  "candidate_profile": "3年 Python 后端开发，熟悉 Django，有电商项目经验",
  "jd_text": "负责微服务架构设计，要求 FastAPI + Docker...",
  "difficulty": "medium",
  "asked_types": ["behavioral"],
  "weak_areas": []
}
```

**输出 JSON：**
```json
{
  "question_text": "请描述一次你在项目中优化 API 性能的经历，遇到了什么瓶颈，如何解决的？",
  "question_type": "technical",
  "difficulty": "medium",
  "expected_points": [
    "识别出具体性能瓶颈（数据库、缓存、网络等）",
    "有量化的优化效果数据",
    "使用了合适的工具或方法论",
    "考虑了系统稳定性"
  ],
  "follow_up_hints": ["追问监控工具选型", "追问方案对比过程"],
  "time_suggestion_seconds": 120
}
```

### 3.3 AnswerEvaluationChain（流式）

```python
eval_prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "你是专业面试评分官。按照 rubric 对候选人的回答进行客观评分，"
        "给出建设性反馈。评分要公正、具体、有依据。"
    )),
    ("human", (
        "## 面试题目\n{question_text}\n\n"
        "## 评分要点\n{expected_points}\n\n"
        "## 候选人回答\n{answer_text}\n\n"
        "请按 rubric 评分并给出详细反馈："
    )),
])

# Input 类型
class EvalInput(BaseModel):
    question_text: str
    expected_points: list[str]
    answer_text: str              # 文字输入，或语音转写后的文本

# 结构化输出版本（arq 后台保存）
AnswerEvaluationChain = (
    eval_prompt
    | get_llm("quality").with_structured_output(AnswerEvaluationOutput, method="json_schema")
)

# 流式版本（SSE 实时推送给用户）
AnswerEvaluationStreamChain = eval_prompt | get_llm("quality")
```

**输出 JSON 示例：**
```json
{
  "total_score": 68,
  "dimensions": {
    "content_accuracy":  {"score": 18, "feedback": "提到了缓存优化方向正确，但缺乏具体技术细节"},
    "structure_clarity": {"score": 15, "feedback": "回答结构松散，STAR 结构不完整"},
    "star_adherence":    {"score": 17, "feedback": "有情境描述，但缺少量化结果"},
    "communication":     {"score": 18, "feedback": "表达流畅，逻辑基本清晰"}
  },
  "strengths": ["识别了性能瓶颈方向", "提到了监控手段"],
  "improvements": ["补充量化优化数据（如响应时间从Xms降至Yms）", "说明方案选型的对比过程"],
  "model_answer_hints": ["使用 APM 工具定位瓶颈", "Redis 缓存热点数据", "DB 慢查询优化"],
  "next_question_direction": "深入考察系统设计能力"
}
```

### 3.4 InterviewSummaryChain（arq 后台任务）

```python
summary_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是面试总评官，基于完整的面试记录给出综合评估报告。"),
    ("human", (
        "## 岗位 JD\n{jd_text}\n\n"
        "## 完整面试记录（含题目、回答、单题评分）\n{interview_records}\n\n"
        "共 {question_count} 道题，请给出综合评估："
    )),
])

# Input 类型
class SummaryInput(BaseModel):
    jd_text: str
    question_count: int
    interview_records: list[dict]  # [{"question": ..., "answer": ..., "evaluation": AnswerEvaluationOutput}]

# Output: InterviewSummaryOutput
InterviewSummaryChain = (
    summary_prompt
    | get_llm("quality").with_structured_output(InterviewSummaryOutput, method="json_schema")
)
```

**输出 JSON 示例：**
```json
{
  "overall_score": 71,
  "dimension_scores": {
    "technical": 68, "communication": 75, "structure": 65, "problem_solving": 72
  },
  "overall_assessment": "候选人具备扎实的 Python 基础，能独立完成功能开发。系统设计能力偏弱，回答缺乏量化数据支撑，建议加强微服务架构和性能优化方向的学习。",
  "top_strengths": ["Python 基础扎实", "沟通表达流畅", "有电商业务理解"],
  "critical_gaps": ["系统设计深度不足", "回答缺乏量化数据", "容器化经验空白"],
  "hiring_recommendation": "borderline",
  "learning_priorities": ["微服务架构设计", "FastAPI 生产实践", "Docker/K8s 容器化"]
}
```

### 3.5 语音面试 WebSocket 数据流

```
Client                          Server
  |                               |
  |-- WS Connect ---------------→ |  建立连接，返回第一题
  |← {"type":"question", "data": InterviewQuestion} -----|
  |                               |
  |-- {"type":"audio_chunk",      |  发送 PCM 音频块
  |    "data": base64_pcm,        |
  |    "is_final": false} ------→ |  累积缓冲
  |                               |
  |-- {"type":"audio_chunk",      |
  |    "data": base64_pcm,        |
  |    "is_final": true} -------→ |  触发 Whisper 转写
  |                               |
  |← {"type":"transcript",        |  返回转写文本
  |   "data": {"text": "..."}} ---|
  |                               |
  |← {"type":"eval_chunk",        |  流式推送评分
  |   "data": {"chunk": "..."}} --|
  |← {"type":"eval_done",         |
  |   "data": AnswerEvaluationOutput} |
  |                               |
  |← {"type":"question",          |  推送下一题
  |   "data": InterviewQuestion} -|
```

**音频规格：** 16kHz, 16-bit, mono PCM，chunks ≤ 4096 bytes，base64 编码

---

## 四、Feature 3：知识缺口训练 Chain 规范（三阶段费曼学习法）

**学习流程：全局蓝图 → 局部细挖（分层） → 费曼概括，贯穿知识关联性**

### 4.1 Pydantic 数据模型

```python
# backend/app/schemas/training.py
from pydantic import BaseModel, Field
from typing import Literal

class KnowledgeGap(BaseModel):
    topic: str = Field(description="知识缺口主题，如'微服务熔断设计'")
    category: Literal["technical_skill", "domain_knowledge", "soft_skill", "tool_proficiency"]
    severity: Literal["high", "medium", "low"]
    evidence: str = Field(description="来自面试或JD的证据，说明为何判断为缺口")
    prerequisite_topics: list[str] = Field(description="学习本主题前需掌握的前置知识", default=[])
    related_topics: list[str] = Field(description="横向关联的知识点（同层，可相互印证）", default=[])
    leads_to: list[str] = Field(description="学完后可延伸的进阶方向", default=[])

# ---- 阶段1: 全局蓝图 ----
class GapDetectionOutput(BaseModel):
    """BlueprintChain 输出：缺口 + 关联图 + 最优学习路径"""
    gaps: list[KnowledgeGap]
    candidate_strengths: list[str] = Field(description="候选人已有优势，学习计划中可跳过或快过")
    suggested_learning_order: list[str] = Field(description="拓扑排序后的最优学习序列（topic 列表）")
    total_estimated_minutes: int = Field(description="全部 gap 的预估总学习时长（分钟）")
    knowledge_graph_summary: str = Field(description="用一段话描述所有 gap 之间的关联脉络，供前端展示")

# ---- 阶段2: 局部细挖 ----
class LearningLayer(BaseModel):
    """深挖内容的单层，每个 topic 共4层"""
    layer: Literal["concept", "principle", "application", "connection"]
    title: str = Field(description="该层标题，如'是什么'/'为什么'/'怎么用'/'和其他知识的关系'")
    content: str = Field(description="该层内容，Markdown 格式，200-400字")
    connection_prompt: str = Field(description="该层末尾的关联提示语，主动引导用户联想其他知识点")

class LearningItem(BaseModel):
    topic: str
    core_concepts: list[str] = Field(description="核心知识点，3-5条")
    why_important: str = Field(description="为什么该岗位需要此知识，结合 JD 说明")
    layers: list[LearningLayer] = Field(description="4层递进内容：concept→principle→application→connection")
    practice_questions: list[str] = Field(description="2-3道自测题", max_length=3)
    external_resources: list[str] = Field(description="推荐学习资源名称（不生成URL）", max_length=3)
    estimated_minutes: int = Field(description="预计学习时间（分钟）", ge=15, le=120)

# ---- 阶段3: 费曼概括 ----
class FeynmanSummaryInput(BaseModel):
    topic: str
    user_summary: str = Field(description="用户用自己语言写的总结，100-500字")
    core_concepts: list[str]          # 从 LearningItem 传入，用于评估完整性
    related_topics: list[str]         # 评估用户是否提到了关联性

class FeynmanEvalOutput(BaseModel):
    """费曼评估 Chain 输出"""
    clarity_score: int = Field(ge=0, le=100, description="表达清晰度：是否用自己的语言而非照抄")
    accuracy_score: int = Field(ge=0, le=100, description="内容准确性")
    completeness_score: int = Field(ge=0, le=100, description="概念覆盖完整性")
    connection_awareness: bool = Field(description="是否提到了与其他知识点的关联")
    missing_concepts: list[str] = Field(description="总结中遗漏的核心概念")
    encouragement: str = Field(description="鼓励性反馈，100字以内，积极引导而非批评")
    follow_up_prompt: str | None = Field(
        description="若 clarity_score<70 或 accuracy_score<60，给出追问提示引导补充；否则为 null",
        default=None
    )
    passed: bool = Field(description="是否通过费曼检验（clarity≥70 且 accuracy≥60）")

# ---- 复测 ----
class RetestQuestion(BaseModel):
    question: str
    question_type: Literal["concept", "application", "diagnosis"]
    reference_answer_points: list[str] = Field(description="参考答案要点，3-5条")

class RetestEvaluationOutput(BaseModel):
    topic: str
    score: int = Field(ge=0, le=100)
    mastery_level: Literal["mastered", "partial", "not_mastered"]
    correct_points: list[str]
    missing_points: list[str]
    improvement_from_before: int = Field(description="与学习前评估相比的提升分数（首次为0）")
```

### 4.2 GapDetectionChain

```python
gap_prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "你是职业发展顾问，擅长分析候选人与目标岗位的知识缺口。"
        "基于提供的信息，识别出需要补强的具体知识点。"
        "注意：只列出真正的缺口，已掌握的知识不要重复列出。"
    )),
    ("human", (
        "## 数据来源：{source_type}\n\n"
        "## 目标 JD\n{jd_text}\n\n"
        "## 候选人简历/已有技能\n{candidate_profile}\n\n"
        "## 面试表现记录（如有）\n{interview_summary}\n\n"
        "请识别知识缺口并给出学习顺序建议："
    )),
])

# Input 类型
class GapDetectionInput(BaseModel):
    source_type: Literal["interview_report", "jd_only"]
    jd_text: str
    candidate_profile: str           # 来自简历解析
    interview_summary: str = ""      # InterviewSummaryOutput 序列化后的文本，可为空

# Output: GapDetectionOutput
GapDetectionChain = (
    gap_prompt
    | get_llm("quality").with_structured_output(GapDetectionOutput, method="json_schema")
)
```

**输出 JSON 示例：**
```json
{
  "gaps": [
    {
      "topic": "FastAPI 异步编程模型",
      "category": "technical_skill",
      "severity": "high",
      "evidence": "JD 要求 FastAPI 生产经验，面试中候选人未能说明 async/await 工作原理",
      "prerequisite_topics": ["Python asyncio 基础"]
    },
    {
      "topic": "Docker 容器化部署",
      "category": "tool_proficiency",
      "severity": "medium",
      "evidence": "简历无 Docker 相关描述，JD 明确要求容器化经验",
      "prerequisite_topics": []
    }
  ],
  "candidate_strengths": ["Django ORM 熟练", "MySQL 优化有经验", "电商业务理解深"],
  "suggested_learning_order": ["Python asyncio 基础", "FastAPI 异步编程模型", "Docker 容器化部署"],
  "total_estimated_minutes": 180,
  "knowledge_graph_summary": "asyncio 是 FastAPI 的底层基础，需先掌握；FastAPI 异步模型与 Docker 容器化是部署层的上下游关系，三者共同构成现代 Python 微服务的完整链路。"
}
```

### 4.3 BlueprintChain（全局知识图谱，阶段1）

```python
# backend/app/core/training/gap_detector.py

blueprint_prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "你是职业发展顾问，擅长构建个性化知识学习地图。"
        "分析候选人缺口，建立知识点之间的关联图，给出最优学习路径。"
        "重要：prerequisite_topics（前置依赖）、related_topics（横向关联）、leads_to（延伸方向）"
        "必须基于真实的知识体系关联，不能随意填写。"
    )),
    ("human", (
        "## 数据来源：{source_type}\n\n"
        "## 目标 JD\n{jd_text}\n\n"
        "## 候选人已有技能\n{candidate_profile}\n\n"
        "## 面试评估记录（如有）\n{interview_summary}\n\n"
        "请构建知识缺口关联图并给出学习路径："
    )),
])

# Input: GapDetectionInput（同上）
# Output: GapDetectionOutput（含 related_topics, leads_to, knowledge_graph_summary）
BlueprintChain = (
    blueprint_prompt
    | get_llm("quality").with_structured_output(GapDetectionOutput, method="json_schema")
)
```

### 4.4 DeepDiveChain（局部细挖，阶段2，SSE 流式）

```python
# backend/app/core/training/plan_generator.py

deep_dive_prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "你是技术教学专家，采用分层教学法。"
        "将知识点分为4层递进输出：\n"
        "  Layer1 concept:     是什么（定义、核心概念）\n"
        "  Layer2 principle:   为什么（原理、机制、设计动机）\n"
        "  Layer3 application: 怎么用（实战代码、场景示例）\n"
        "  Layer4 connection:  关联什么（与其他知识点的联系，特别是候选人已学的）\n"
        "每层末尾必须有一句引导候选人联想其他知识的 connection_prompt。"
        "内容要结合候选人背景，避免从头讲起。"
    )),
    ("human", (
        "## 学习主题\n{topic}\n\n"
        "## 候选人背景\n{candidate_background}\n\n"
        "## 学习该主题的原因（结合 JD）\n{why_important}\n\n"
        "## 横向关联的知识点\n{related_topics}\n\n"
        "## 候选人已完成学习的知识点（可直接引用）\n{already_learned}\n\n"
        "请按4层结构输出学习内容："
    )),
])

# Input 类型
class DeepDiveInput(BaseModel):
    topic: str
    candidate_background: str
    why_important: str
    related_topics: list[str]
    already_learned: list[str]     # 已完成的 topic 列表，Layer4 可直接引用

# 流式版本（SSE，用户展开卡片时触发）
DeepDiveStreamChain = deep_dive_prompt | get_llm("default")

# 结构化版本（后台保存，生成 LearningItem.layers）
DeepDiveChain = (
    deep_dive_prompt
    | get_llm("default").with_structured_output(LearningItem, method="json_schema")
)
```

**LearningItem 输出 JSON 示例（FastAPI 异步编程模型）：**
```json
{
  "topic": "FastAPI 异步编程模型",
  "core_concepts": ["async/await 关键字", "事件循环", "协程 vs 线程", "异步依赖注入"],
  "why_important": "FastAPI 的高并发性能完全依赖 asyncio，面试中被直接考察",
  "layers": [
    {
      "layer": "concept",
      "title": "是什么：协程与异步函数",
      "content": "async def 定义协程函数，await 挂起当前协程让出控制权...",
      "connection_prompt": "你已经熟悉 Django 的同步视图，想想看：同步和异步的本质区别在哪里？"
    },
    {
      "layer": "principle",
      "title": "为什么：事件循环的工作机制",
      "content": "事件循环是单线程的任务调度器，遇到 I/O 等待时切换到其他协程...",
      "connection_prompt": "这和你熟悉的 MySQL 连接池有什么相似之处？都是为了复用等待中的资源。"
    },
    {
      "layer": "application",
      "title": "怎么用：FastAPI 中的异步端点",
      "content": "```python\nasync def get_user(user_id: int, db: AsyncSession = Depends(get_db)):\n    ...\n```",
      "connection_prompt": "注意这里的 Depends，它和你熟悉的 Django middleware 有相似的职责——统一处理横切关注点。"
    },
    {
      "layer": "connection",
      "title": "关联什么：与 asyncpg、arq 的协同",
      "content": "asyncpg 是异步 PostgreSQL 驱动，arq 是异步任务队列，它们都要求在 async 上下文中调用...",
      "connection_prompt": "现在你已经掌握了 asyncio 基础，你能理解为什么 arq 比 Celery 更适合 FastAPI 了吗？"
    }
  ],
  "practice_questions": [
    "用自己的话解释：为什么 async def 函数中不能直接调用普通阻塞函数？",
    "改写以下同步代码为异步版本：..."
  ],
  "external_resources": ["FastAPI 官方文档 - Async", "Python asyncio 官方文档", "《流畅的Python》第18章"],
  "estimated_minutes": 45
}
```

### 4.5 FeynmanChain（费曼概括评估，阶段3）

```python
# backend/app/core/training/retester.py

feynman_prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "你是苏格拉底式教学教练。评估候选人的费曼总结时：\n"
        "1. 重点看他是否用自己的语言表达，而非照抄原文\n"
        "2. 检查是否覆盖了核心概念\n"
        "3. 检查是否提到了与其他知识点的关联\n"
        "4. 反馈要鼓励为主，不直接给出答案，而是用追问引导补充\n"
        "5. 如果总结有偏差，给提示而不是纠正"
    )),
    ("human", (
        "## 学习主题\n{topic}\n\n"
        "## 该主题的核心概念\n{core_concepts}\n\n"
        "## 相关知识点（评估关联意识）\n{related_topics}\n\n"
        "## 候选人的费曼总结\n{user_summary}\n\n"
        "请评估并给出反馈："
    )),
])

# Input: FeynmanSummaryInput
# Output: FeynmanEvalOutput（流式 SSE，让用户实时看到反馈）
FeynmanStreamChain = feynman_prompt | get_llm("default")
FeynmanChain = (
    feynman_prompt
    | get_llm("default").with_structured_output(FeynmanEvalOutput, method="json_schema")
)
```

**费曼评估输出 JSON 示例：**
```json
{
  "clarity_score": 78,
  "accuracy_score": 82,
  "completeness_score": 65,
  "connection_awareness": true,
  "missing_concepts": ["事件循环的单线程特性", "await 的挂起机制"],
  "encouragement": "你对 async/await 的理解已经建立起来了！特别是能联想到 Django 的对比，思路很清晰。",
  "follow_up_prompt": "你提到了协程可以'切换'，能具体说说：切换的时机是什么？是谁来决定何时切换的？",
  "passed": true
}
```

**前端费曼交互流程：**
```
学习完某个 topic 后
  → 出现"用自己的话总结一下"输入框（强制步骤，不可跳过）
  → 用户输入 100~500字总结
  → POST /training/plans/{id}/items/{item_id}/summary
  → SSE 流式返回 FeynmanEvalOutput
  → passed=true: 解锁下一个知识点 + 显示鼓励
  → passed=false: 显示 follow_up_prompt，用户再次提交（最多3次，3次后允许跳过）
```

### 4.6 RetestChain（复测，学习结束后）

```python
retest_question_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是考官，针对候选人的知识缺口出一道考察题，题目要有区分度。"),
    ("human", (
        "## 考察主题\n{topic}\n\n"
        "## 参考学习内容要点\n{core_concepts}\n\n"
        "## 考题类型\n{question_type}\n\n"
        "请出一道考题："
    )),
])

retest_eval_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是阅卷官，客观评估候选人对知识点的掌握程度。"),
    ("human", (
        "## 考题\n{question}\n\n"
        "## 参考答案要点\n{reference_answer_points}\n\n"
        "## 候选人回答\n{answer}\n\n"
        "## 初始掌握评分（学习前）\n{initial_score}\n\n"
        "请评分并分析进步情况："
    )),
])

# Input/Output
# RetestQuestionChain: {"topic", "core_concepts", "question_type"} → RetestQuestion
# RetestEvalChain: {"question", "reference_answer_points", "answer", "initial_score"} → RetestEvaluationOutput

RetestQuestionChain = (
    retest_question_prompt
    | get_llm("default").with_structured_output(RetestQuestion, method="json_schema")
)

RetestEvalChain = (
    retest_eval_prompt
    | get_llm("default").with_structured_output(RetestEvaluationOutput, method="json_schema")
)
```

---

## 五、PGVector 集成规范

```python
# backend/app/core/resume/embedder.py
from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector
from langchain_core.documents import Document

embeddings = OpenAIEmbeddings(
    model="text-embedding-v3",
    dimensions=1024,
    base_url=settings.LLM_BASE_URL,
    api_key=settings.LLM_API_KEY,
)

def get_vector_store(collection_name: str) -> PGVector:
    return PGVector(
        embeddings=embeddings,
        collection_name=collection_name,
        connection=settings.POSTGRES_DSN,   # postgresql+psycopg://user:pass@host/db
        use_jsonb=True,
    )

# ---- 写入（简历分块上传后）----
async def index_resume(resume_id: str, resume_text: str):
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=64)
    chunks = splitter.split_text(resume_text)
    docs = [
        Document(page_content=chunk, metadata={"resume_id": resume_id, "chunk_index": i})
        for i, chunk in enumerate(chunks)
    ]
    store = get_vector_store("resume_chunks")
    # add_documents(docs: list[Document], ids: list[str]) → list[str]
    await store.aadd_documents(docs, ids=[f"{resume_id}_{i}" for i in range(len(docs))])

# ---- 检索（RAG 用于训练内容生成）----
async def retrieve_relevant_context(query: str, resume_id: str, k: int = 4) -> list[Document]:
    store = get_vector_store("resume_chunks")
    # similarity_search(query, k, filter) → list[Document]
    return await store.asimilarity_search(
        query, k=k,
        filter={"resume_id": resume_id}
    )

# ---- 作为 Retriever 接入 Chain ----
retriever = get_vector_store("resume_chunks").as_retriever(
    search_type="similarity",        # "similarity" | "mmr" | "similarity_score_threshold"
    search_kwargs={"k": 4, "filter": {"resume_id": "xxx"}}
)
# retriever 可直接用 | 接入 LCEL Chain
```

---

## 六、arq 后台任务规范

```python
# backend/app/workers/tasks.py
import arq
from arq import ArqRedis

# 任务函数签名（均为 async def，第一个参数为 ctx）
async def analyze_resume_task(ctx: dict, resume_id: str) -> dict:
    """
    Input:  resume_id (str)
    Steps:  提取文本 → 分块嵌入 → 针对缓存JD评分（如有）
    Output: {"status": "completed", "analysis_id": str}
    触发:   POST /resumes/upload 后通过 arq.enqueue_job() 入队
    """

async def generate_interview_report_task(ctx: dict, session_id: str) -> dict:
    """
    Input:  session_id (str)
    Steps:  读取所有 Q&A → InterviewSummaryChain → 写入 InterviewReport 表
    Output: {"status": "completed", "report_id": str}
    触发:   POST /interviews/sessions/{id}/complete
    """

async def generate_training_plan_task(ctx: dict, plan_id: str) -> dict:
    """
    Input:  plan_id (str)，TrainingPlan 表已有 source_type 和 source_id
    Steps:  读取面试报告/JD → GapDetectionChain → 写入 TrainingItem 列表
    Output: {"status": "completed", "item_count": int}
    触发:   POST /training/plans
    """

class WorkerSettings:
    functions = [analyze_resume_task, generate_interview_report_task, generate_training_plan_task]
    redis_settings = arq.connections.RedisSettings(host=settings.REDIS_HOST, port=settings.REDIS_PORT, database=2)
    max_jobs = 10
    job_timeout = 300       # 5分钟超时
    keep_result = 3600      # 结果保留1小时
```

**任务状态推送（Redis pub/sub → WebSocket）：**
```python
# 任务完成后 publish
await redis.publish(f"task_complete:{user_id}", json.dumps({
    "task_type": "interview_report",
    "entity_id": report_id,
    "status": "completed"
}))

# 前端 WS 订阅 /ws/notifications，收到后刷新对应页面
```

---

## 七、前端 SSE Hook 规范

```typescript
// frontend/src/hooks/useSSE.ts

interface SSEChunk {
  chunk?: string;       // 增量文本
  done?: boolean;       // 流结束标志
  total_tokens?: number;
  error?: string;
}

function useSSE(url: string | null) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    const es = new EventSource(url, { withCredentials: true });

    es.onmessage = (e: MessageEvent) => {
      const data: SSEChunk = JSON.parse(e.data);
      if (data.done) { setDone(true); es.close(); return; }
      if (data.error) { setError(data.error); es.close(); return; }
      if (data.chunk) setText(prev => prev + data.chunk);
    };

    es.onerror = () => { setError("连接中断"); es.close(); };
    return () => es.close();
  }, [url]);

  return { text, done, error, reset: () => { setText(""); setDone(false); } };
}
```
