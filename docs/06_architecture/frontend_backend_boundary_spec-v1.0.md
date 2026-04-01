# 前后端功能边界规范 — frontend_backend_boundary_spec-v1.0.md

> 阶段：06_architecture | 状态：有效  
> 本文件是前后端实现的收口边界文档，定义各端职责、数据提供方、操作发起方。
>
> ## 变更记录
> | 日期 | 变更内容 | Agent |
> |------|---------|-------|
> | 2026-04-01 | 初始版本，覆盖三大功能域的完整边界定义 | architecture-agent |

---

## 一、总体职责划分

### 1.1 后端（Backend）职责范围

| 职责类别 | 具体内容 |
|---------|---------|
| **业务逻辑** | 所有 LangChain Chain 调用、评分计算、知识缺口分析 |
| **数据持久化** | 所有数据读写（PostgreSQL）、向量存储（pgvector）|
| **文件管理** | 文件接收、存储（MinIO）、生成下载链接 |
| **认证授权** | JWT 签发与验证、refresh token 管理 |
| **异步任务** | 所有 arq 后台任务的调度与执行 |
| **SSE 推流** | 所有流式内容的生成与推送 |
| **实时通信** | WebSocket 语音通道的维护与转写调用 |
| **数据校验** | 所有业务规则校验（Pydantic Schema）|

### 1.2 前端（Frontend）职责范围

| 职责类别 | 具体内容 |
|---------|---------|
| **UI 渲染** | 页面组件、布局、样式，完全由前端负责 |
| **路由管理** | 页面跳转、路由守卫、404 处理 |
| **本地状态** | 表单草稿、UI 展开/折叠、当前选中项 |
| **Token 管理** | Access Token 内存存储、Refresh Token 自动续期拦截 |
| **文件校验** | 上传前的格式（PDF/DOCX）+ 大小（≤10MB）校验 |
| **SSE 消费** | EventSource 连接管理、chunk 追加、错误重连 |
| **WebSocket 维护** | 语音 WS 连接建立、PCM 数据发送、消息解析 |
| **MediaRecorder** | 麦克风录音、VAD 静音检测、音频格式编码 |
| **错误展示** | 将后端错误码映射为用户友好提示文案 |
| **输入格式校验** | 前端表单必填项、字数限制等基础校验 |

### 1.3 明确不属于前端的事项

- **不**在前端计算评分（所有分数来自后端）
- **不**在前端进行关键词提取（所有 NLP 分析来自后端）
- **不**在前端管理面试会话状态（会话状态存 Redis，前端只持有 session_id）
- **不**在前端执行难度自适应算法（算法在后端 Python 中执行）
- **不**在前端直接操作 MinIO / 数据库

---

## 二、认证边界

### 2.1 数据提供方

| 数据 | 由谁提供 | 存储位置 |
|------|---------|---------|
| Access Token | 后端登录接口返回 | 前端内存（Zustand authStore）|
| Refresh Token | 后端登录接口设置 HttpOnly Cookie | 浏览器 Cookie（前端无法读取）|
| 用户基本信息（id, name, email）| 后端 `/api/v1/users/me` 返回 | 前端 authStore |

### 2.2 操作发起方与接口

| 操作 | 发起方 | 接口 | 备注 |
|------|--------|------|------|
| 注册 | 前端表单提交 | `POST /api/v1/auth/register` | 前端校验：邮箱格式、密码强度 ≥ 8位 |
| 登录 | 前端表单提交 | `POST /api/v1/auth/login` | 后端返回 access_token + 设置 cookie |
| 静默续期 | 前端 Axios 拦截器（401 触发）| `POST /api/v1/auth/refresh` | 前端自动重试原请求 |
| 登出 | 前端用户操作 | `POST /api/v1/auth/logout` | 后端清除 cookie，前端清除内存 token |

### 2.3 Token 使用约定

- Access Token：前端在所有 API 请求 Header 中携带 `Authorization: Bearer <token>`
- Refresh Token：浏览器自动携带 Cookie，前端代码不处理
- Token 过期（401）：前端拦截器自动调用 refresh，成功后重放原请求；失败则跳转 `/login`

---

## 三、功能1：简历优化边界

### 3.1 数据提供方

| 数据 | 由谁提供 | API 端点 |
|------|---------|---------|
| 简历列表 | 后端 | `GET /api/v1/resumes` |
| 简历详情（元数据）| 后端 | `GET /api/v1/resumes/:id` |
| 分析状态（polling）| 后端 | `GET /api/v1/resumes/:id`（status 字段）|
| 评分报告（综合分、维度分、关键词）| 后端 | `GET /api/v1/resumes/:id/analysis` |
| 改写内容（SSE 流）| 后端推流 | `GET /api/v1/resumes/:id/rewrite` |
| 文件下载链接（预签名 URL）| 后端 | `POST /api/v1/resumes/:id/rewrite/accept`（返回字段中含 download_url）|

### 3.2 操作发起方

| 操作 | 发起方 | 接口 | 前端职责 | 后端职责 |
|------|--------|------|---------|---------|
| 上传简历 | 前端（用户触发）| `POST /api/v1/resumes/upload`（multipart/form-data）| 格式+大小校验、进度条显示 | 文本提取、MinIO 存储、触发 arq 分析任务 |
| 绑定 JD 文本 | 前端（表单字段）| 随上传请求一并发送（`jd_text` 字段）| 字数统计显示、超5000字截断提示 | 与简历一并存储，用于评分 |
| 触发改写 | 前端（用户点击）| `GET /api/v1/resumes/:id/rewrite`（EventSource）| 建立 SSE 连接、追加渲染 chunk | RewriteChain 执行、流式推送 |
| 接受改写 | 前端（用户确认）| `POST /api/v1/resumes/:id/rewrite/accept` | 发送请求、接收成功响应 | 保存改写版本到数据库、返回 download_url |
| 针对新 JD 重新评分 | 前端（用户输入 JD 后触发）| `POST /api/v1/resumes/:id/score` | 提供新 JD 文本、展示新结果 | 重新运行 ScoreChain |
| 下载简历 | 前端（用户点击）| 使用 download_url 直接下载 | 触发浏览器下载（`<a>` 标签）| 提供 MinIO 预签名 URL（有效期15分钟）|

### 3.3 分析状态轮询规则

- 前端在简历上传成功后，每 **3秒** 轮询一次 `GET /api/v1/resumes/:id`
- 后端返回 `status` 字段：`pending` / `analyzing` / `analyzed` / `failed`
- 前端根据 status 决定展示：进度动画 / 失败提示 / 跳转评分报告
- `status=analyzed` 时停止轮询，自动跳转优化页

### 3.4 评分报告数据结构（前端消费格式）

```
GET /api/v1/resumes/:id/analysis 响应字段：
  overall_score: int (0-100)
  dimensions: {
    relevance:       { score, reason, suggestions[] }
    keywords:        { score, reason, suggestions[] }
    structure:       { score, reason, suggestions[] }
    quantification:  { score, reason, suggestions[] }
  }
  missing_keywords: string[]   → 前端渲染红色缺失标签
  matched_keywords: string[]   → 前端渲染绿色命中标签
  top_suggestions: string[]    → 前端渲染 Top3 改进建议
  rewrite_hints: string[]      → 前端无需展示，随改写请求自动带入（后端从 DB 读取）
```

---

## 四、功能2：模拟面试边界

### 4.1 数据提供方

| 数据 | 由谁提供 | API 端点 |
|------|---------|---------|
| 面试历史列表 | 后端 | `GET /api/v1/interviews/sessions` |
| 面试会话详情（题目列表、状态）| 后端 | `GET /api/v1/interviews/sessions/:id` |
| 第一道题目 | 后端（创建会话时同步返回）| `POST /api/v1/interviews/sessions` 响应体 |
| 后续题目 + 流式评分 | 后端推流 | `POST /api/v1/interviews/sessions/:id/answers`（SSE）|
| 语音转写文本 | 后端（Whisper API 调用后）| WS 消息 `{"type": "transcript", "data": {"text": "..."}}` |
| 面试汇总报告 | 后端（arq 任务完成后可读）| `GET /api/v1/interviews/sessions/:id/report` |

### 4.2 操作发起方

| 操作 | 发起方 | 接口 | 前端职责 | 后端职责 |
|------|--------|------|---------|---------|
| 创建面试会话 | 前端（用户点击「开始面试」）| `POST /api/v1/interviews/sessions` | 收集并提交配置（mode/difficulty/question_count/input_mode）| 初始化 SessionState、运行 SessionContextChain、生成第一题 |
| 提交文字答案 | 前端（用户点击「提交答案」）| `POST /api/v1/interviews/sessions/:id/answers`（SSE）| 建立 SSE 连接、渲染流式评分 | EvaluationChain 执行、更新 score_history、adaptive 难度计算、生成下一题 |
| 语音答题建立通道 | 前端（进入语音会话时）| `WS /api/v1/interviews/sessions/:id/voice` | 建立 WS、发送 PCM chunks（base64，≤4096bytes）| 累积音频 buffer，is_final=true 时调 Whisper 转写 |
| 结束面试 | 前端（用户点击「结束面试」）| `POST /api/v1/interviews/sessions/:id/complete` | 确认弹窗后发送请求 | 触发 arq 后台生成汇总报告任务 |
| 查看报告 | 前端（报告页加载）| `GET /api/v1/interviews/sessions/:id/report` | 展示报告数据、雷达图渲染 | 返回已生成的报告（若还未完成，返回 status=generating）|
| 生成训练计划 | 前端（用户点击「生成训练计划」）| `POST /api/v1/training/plans`（body 含 source_type=interview_report, session_id）| 发送请求、跳转训练蓝图页 | 触发 arq 任务运行 GapDetectionChain、BlueprintChain |

### 4.3 会话状态约定

- 会话状态（题目进度、得分历史、难度档位）**完全由后端维护**，存储在 Redis
- 前端仅持有 `session_id`，每次提交答案后从响应中获取下一题数据
- 前端 `interviewStore` 仅存储当前题目展示状态（题目文本、输入内容、流式评分进度）
- 面试过程中前端不做任何分数计算或难度判断

### 4.4 面试报告数据结构（前端消费格式）

```
GET /api/v1/interviews/sessions/:id/report 响应字段：
  status: "generating" | "completed"  → generating 时前端显示加载状态
  overall_score: int (0-100)
  dimension_scores: {
    technical: int, communication: int, structure: int, problem_solving: int
  }   → 前端渲染雷达图（4个维度）
  overall_assessment: string  → 整体评价文本
  top_strengths: string[]     → 前端渲染绿色优势标签
  critical_gaps: string[]     → 前端渲染红色短板标签
  hiring_recommendation: "strong_yes"|"yes"|"borderline"|"no"  → 前端渲染推荐结论
  learning_priorities: string[]  → 前端展示学习方向列表（「生成训练计划」前展示）
  questions: [                   → 逐题回顾列表
    { question_text, answer_text, total_score, dimensions, strengths, improvements }
  ]
```

### 4.5 语音消息协议（WebSocket）

**前端发送：**

| 消息类型 | 结构 | 含义 |
|---------|------|------|
| `audio_chunk` | `{"type":"audio_chunk","data":"<base64_pcm>","is_final":false}` | 音频分块，持续发送 |
| `audio_chunk` (final) | `{"type":"audio_chunk","data":"<base64_pcm>","is_final":true}` | 最后一帧，触发转写 |

**后端推送：**

| 消息类型 | 结构 | 含义 |
|---------|------|------|
| `question` | `{"type":"question","data":{InterviewQuestion}}` | 发题 |
| `transcript` | `{"type":"transcript","data":{"text":"..."}}` | 转写结果 |
| `eval_chunk` | `{"type":"eval_chunk","data":{"chunk":"..."}}` | 流式评分 |
| `eval_done` | `{"type":"eval_done","data":{AnswerEvaluationOutput}}` | 评分完成 |

**音频规格（前端必须遵守）：** 16kHz, 16-bit, mono PCM，chunks ≤ 4096 bytes，base64 编码

---

## 五、功能3：知识缺口训练边界

### 5.1 数据提供方

| 数据 | 由谁提供 | API 端点 |
|------|---------|---------|
| 训练计划（状态、进度）| 后端 | `GET /api/v1/training/plans/:id` |
| 全局蓝图（知识图谱 + 学习路径）| 后端 | `GET /api/v1/training/plans/:id/blueprint` |
| 单知识点学习内容（SSE 流）| 后端推流 | `GET /api/v1/training/plans/:id/items/:item_id`（SSE）|
| 费曼评估结果（SSE 流）| 后端推流 | `POST /api/v1/training/plans/:id/items/:item_id/summary`（SSE）|
| 复测题目 | 后端 | `POST /api/v1/training/plans/:id/retest` 返回 |
| 复测评分结果 | 后端 | `GET /api/v1/training/retest/:id/result` |

### 5.2 操作发起方

| 操作 | 发起方 | 接口 | 前端职责 | 后端职责 |
|------|--------|------|---------|---------|
| 创建训练计划 | 前端（来自面试报告或手动触发）| `POST /api/v1/training/plans` | 提交 source_type + source_id | 触发 arq 后台任务，运行 BlueprintChain |
| 查看全局蓝图 | 前端（PlanPage 加载）| `GET /api/v1/training/plans/:id/blueprint` | 用知识图谱数据渲染有向图 | 返回 gaps + 关联图 + 学习路径 |
| 加载知识点内容 | 前端（用户点击知识点时）| `GET /api/v1/training/plans/:id/items/:item_id`（SSE）| 建立 SSE、逐层渲染 4 层内容 | 运行 DeepDiveChain，按层流式推送 |
| 标记知识点完成 | 前端（费曼通过后自动触发）| `POST /api/v1/training/plans/:id/items/:item_id/complete` | 费曼 passed=true 后自动发送 | 更新 TrainingItem.status = completed |
| 提交费曼总结 | 前端（用户输入后点击提交）| `POST /api/v1/training/plans/:id/items/:item_id/summary`（SSE）| 提交 user_summary 文本、渲染评估反馈 | 运行 FeynmanChain，返回评估结果 |
| 发起复测 | 前端（用户点击「开始复测」）| `POST /api/v1/training/plans/:id/retest` | 跳转复测页 | 运行 RetestQuestionChain，返回题目列表 |
| 提交复测答案 | 前端（用户逐题提交）| `POST /api/v1/training/retest/:id/answers` | 提交 answers 列表 | 运行 RetestEvalChain，返回逐题得分 |

### 5.3 全局蓝图数据结构（前端消费格式）

```
GET /api/v1/training/plans/:id/blueprint 响应字段：
  plan_id: string
  source_type: "interview_report" | "jd_only"
  status: "generating" | "completed"  → generating 时展示加载骨架屏
  gaps: [
    {
      topic: string               → 节点名称（知识图谱节点标签）
      severity: "high"|"medium"|"low"  → 节点颜色权重
      estimated_minutes: int      → 节点 Tooltip 展示
      prerequisite_topics: []     → 渲染为实线有向边（前置依赖）
      related_topics: []          → 渲染为虚线边（横向关联）
      leads_to: []                → 渲染为点线边（延伸方向）
      status: "pending"|"in_progress"|"completed"|"mastered"  → 节点颜色
    }
  ]
  suggested_learning_order: string[]  → PlanTimeline 列表展示顺序
  total_estimated_minutes: int        → 计划总时长展示
  knowledge_graph_summary: string     → 图谱旁边的文字说明
```

### 5.4 学习内容 SSE 分层格式

```
GET /api/v1/training/plans/:id/items/:item_id SSE 事件序列：
  data: {"layer": "concept",     "chunk": "..."}   →  前端追加到 Layer1 区域
  data: {"layer": "concept",     "done": true}      →  Layer1 渲染完毕，解锁 Layer2
  data: {"layer": "principle",   "chunk": "..."}   →  追加到 Layer2 区域
  data: {"layer": "principle",   "done": true}
  data: {"layer": "application", "chunk": "..."}
  data: {"layer": "application", "done": true}
  data: {"layer": "connection",  "chunk": "..."}
  data: {"layer": "connection",  "done": true}
  data: {"all_done": true, "practice_questions": [...], "estimated_minutes": 45}
```

**前端约定：** 每层 `done=true` 后展示 `connection_prompt`，然后解锁下一层（逐层渲染，不一次性展示）

### 5.5 费曼总结边界约定

**前端校验（不依赖后端）：**
- 提交前：字数 ≥ 100 字，否则禁用按钮
- 字数 > 500 字：提示「总结过长，建议精简」，不阻止提交

**后端判断（前端不自行计算）：**
- `passed: bool` — 是否通过费曼检验
- `clarity_score, accuracy_score` — 前端不做阈值判断，只读 `passed` 字段

**前端根据 `passed` 字段的行为：**
- `passed=true`：调用 complete 接口、解锁下一知识点、播放庆祝动效
- `passed=false`（次数 < 3）：展示 `follow_up_prompt`，清空输入框，重新等待提交
- `passed=false`（累计3次）：展示「允许跳过」选项

**次数计数在前端本地维护**（Zustand trainingStore 中 `feynman_attempts` 计数器，会话级存储）

---

## 六、通知系统边界

### 6.1 后台任务状态推送

| 任务类型 | 触发时机 | 推送内容 | 前端行为 |
|---------|---------|---------|---------|
| 简历分析完成 | arq worker 完成 analyze_resume_task | `{"task_type":"resume_analysis","entity_id":"<resume_id>","status":"completed"}` | 停止轮询、刷新简历状态、Toast 通知 |
| 面试报告生成完成 | arq worker 完成 generate_interview_report_task | `{"task_type":"interview_report","entity_id":"<session_id>","status":"completed"}` | 报告页刷新、「查看报告」按钮可用 |
| 训练计划生成完成 | arq worker 完成 generate_training_plan_task | `{"task_type":"training_plan","entity_id":"<plan_id>","status":"completed"}` | 蓝图页刷新、知识图谱渲染 |

**推送路径：** 后端 arq worker → Redis pub/sub → FastAPI WS Handler → 前端 `/ws/notifications`

**前端约定：**
- WebSocket 连接在用户登录后建立，登出时断开
- 断线自动重连（指数退避，最大间隔30秒）
- 收到通知后展示 Toast（shadcn/ui Sonner），可点击跳转

---

## 七、错误处理边界

### 7.1 后端错误码与前端展示映射

| HTTP 状态码 | 场景 | 前端展示 |
|------------|------|---------|
| 400 | 请求参数错误 | 表单内联错误提示（字段级）|
| 401 | Token 过期 | 自动续期，无感知；续期失败则跳转登录 |
| 403 | 无权访问（非本人资源）| Toast「无权访问此内容」|
| 404 | 资源不存在 | 跳转 NotFoundPage |
| 413 | 文件过大（后端二次校验）| Toast「文件超出大小限制」|
| 422 | 业务规则校验失败 | Toast 显示 detail 字段内容 |
| 429 | 请求频率限制 | Toast「操作太频繁，请稍后再试」|
| 500/503 | 服务器错误 | Toast「服务暂时不可用」+ 「重试」按钮 |

### 7.2 SSE 错误边界

- 后端在 SSE 流中推送 `data: {"error": "...", "done": true}` 时，前端关闭 EventSource
- 前端展示错误提示 + 「重试」按钮
- 「重试」重新建立 SSE 连接，内容区清空重新渲染

### 7.3 WebSocket 错误边界

- 连接断开：前端自动重连（3次），3次失败后提示「连接中断，请刷新页面」
- 转写失败：后端推送 `{"type":"error","message":"转写失败"}` → 前端展示「转写失败，请重新录制」

---

## 八、Zustand Store 职责边界

| Store | 文件 | 存储内容 | 不存储 |
|-------|------|---------|--------|
| `authStore` | `store/authStore.ts` | access_token、user（id/name/email）、isAuthenticated | refresh_token（HttpOnly Cookie，不可读）|
| `resumeStore` | `store/resumeStore.ts` | 当前编辑中的 JD 文本草稿、改写接受/拒绝状态、UI 展示的 activeTab | 简历列表数据（由 API 请求管理，不缓存）|
| `interviewStore` | `store/interviewStore.ts` | 当前题目文本、用户输入文本、流式评分进度、当前 session_id | 会话状态、题目历史（在后端 Redis 中）|
| `trainingStore` | `store/trainingStore.ts` | 费曼尝试次数（feynman_attempts）、当前展开的 layer 状态 | 蓝图数据、知识点内容（由 API 请求管理）|

---

## 九、API 请求发起规范

### 9.1 请求统一约定

| 项目 | 约定 |
|------|------|
| 基础 URL | `/api/v1`（Vite proxy 代理到后端 8000 端口）|
| 认证方式 | `Authorization: Bearer <access_token>`（Axios 拦截器统一添加）|
| 请求格式 | JSON（默认）/ `multipart/form-data`（文件上传）|
| 响应格式 | JSON |
| 超时设置 | 普通请求 30s / 文件上传 120s（前端配置）|
| 重试策略 | 网络错误自动重试1次；4xx/5xx 不自动重试 |

### 9.2 SSE 请求发起规范

| 项目 | 约定 |
|------|------|
| 连接方式 | `new EventSource(url, { withCredentials: true })` |
| 认证 | access_token 作为 URL 查询参数（`?token=<access_token>`，因 EventSource 不支持自定义 Header）|
| 消息格式 | `data: {"chunk":"..."}` / `data: {"done":true}` / `data: {"error":"...","done":true}` |
| 关闭时机 | 收到 `done=true` 或 `error` 后立即 `es.close()` |

### 9.3 各功能域 API 文件职责

| 文件 | 功能 |
|------|------|
| `api/client.ts` | Axios 实例、拦截器（Token 注入、401 续期处理）|
| `api/resume.ts` | 简历相关所有请求函数 |
| `api/interview.ts` | 面试相关所有请求函数 |
| `api/training.ts` | 训练相关所有请求函数 |
| `api/auth.ts` | 认证相关请求函数 |
