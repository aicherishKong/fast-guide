# SSE 事件格式规范 — sse_contract.md

> 阶段：08_api_spec | 状态：有效
>
> ## 变更记录
> | 日期 | 变更内容 | Agent |
> |------|---------|-------|
> | 2026-04-01 | 初始版本 | api-spec-agent |

---

## 一、全局 SSE 约定

| 项 | 约定 |
|----|------|
| Content-Type | `text/event-stream; charset=utf-8` |
| 认证 | URL 查询参数 `?token=<access_token>` |
| 消息格式 | `data: {JSON}\n\n` |
| 结束标志 | `data: {"done": true}\n\n` |
| 错误标志 | `data: {"error": "错误描述", "done": true}\n\n` |
| 心跳 | 每 15 秒发送 `:keepalive\n\n`（注释行，防止连接超时）|
| 编码 | JSON 中文不转义（`ensure_ascii=False`）|

---

## 二、各端点 SSE 规范

### 2.1 简历改写 — `GET /api/v1/resumes/{id}/rewrite`

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | string | 是 | Access Token |
| `analysis_id` | string | 是 | 使用哪次分析的评分结果（ResumeAnalysis.id）|

**事件序列：**

```
data: {"chunk": "# 张三\n"}

data: {"chunk": "## 个人简介\n"}

data: {"chunk": "5年后端开发经验，精通 Python 和 FastAPI 框架..."}

...（持续推送 chunk）

data: {"done": true, "total_tokens": 1240}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `chunk` | string | 增量文本片段 |
| `done` | boolean | 流结束标志 |
| `total_tokens` | int | 本次调用消耗的 token 数（仅 done 时出现）|
| `error` | string | 错误信息（仅异常时出现，同时 done=true）|

---

### 2.2 面试答案评分 — `POST /api/v1/interviews/sessions/{id}/answers`

**请求体（JSON）：**

```json
{
  "answer_text": "我在上一份工作中主导了一次API性能优化..."
}
```

**响应：** 不返回 JSON body，改为 SSE 流。

**事件序列：**

```
data: {"type": "eval_stream", "chunk": "### 评分反馈\n"}

data: {"type": "eval_stream", "chunk": "你的回答提到了性能优化的方向..."}

...

data: {"type": "eval_done", "evaluation": {
  "total_score": 72,
  "dimensions": {
    "content_accuracy": {"score": 20, "feedback": "..."},
    "structure_clarity": {"score": 17, "feedback": "..."},
    "star_adherence": {"score": 18, "feedback": "..."},
    "communication": {"score": 17, "feedback": "..."}
  },
  "strengths": ["识别了关键瓶颈"],
  "improvements": ["补充量化数据"],
  "model_answer_hints": ["APM工具定位", "缓存策略"],
  "next_question_direction": "系统设计"
}}

data: {"type": "next_question", "question": {
  "question_text": "如果让你设计一个高并发的订单系统...",
  "question_type": "technical",
  "difficulty": "hard",
  "expected_points": ["..."],
  "follow_up_hints": ["..."],
  "time_suggestion_seconds": 180
}, "question_index": 3, "effective_difficulty": "hard"}

data: {"done": true}
```

**字段说明：**

| type | 说明 |
|------|------|
| `eval_stream` | 评分文本流式推送（供前端实时展示） |
| `eval_done` | 评分完成，`evaluation` 为完整 AnswerEvaluationOutput |
| `next_question` | 下一题（最后一题时无此事件） |
| `session_complete` | 所有题目回答完毕（替代 next_question） |

---

### 2.3 面试报告 — `GET /api/v1/interviews/sessions/{id}/report`

当报告已生成（`status=report_ready`）时，直接返回 JSON（非 SSE）。

当请求时报告仍在生成中（`status=report_generating`），返回：

```json
{
  "status": "generating",
  "message": "报告正在生成中，请稍后刷新"
}
```

---

### 2.4 训练内容生成 — `GET /api/v1/training/plans/{id}/items/{item_id}`

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `token` | string | 是 | Access Token |

**事件序列（分层输出）：**

```
data: {"layer": "concept", "chunk": "## 是什么：协程与异步函数\n"}

data: {"layer": "concept", "chunk": "async def 定义协程函数..."}

data: {"layer": "concept", "done": true, "connection_prompt": "你已经熟悉 Django 的同步视图，想想看..."}

data: {"layer": "principle", "chunk": "## 为什么：事件循环的工作机制\n"}

data: {"layer": "principle", "chunk": "事件循环是单线程的任务调度器..."}

data: {"layer": "principle", "done": true, "connection_prompt": "这和你熟悉的MySQL连接池有什么相似之处？"}

data: {"layer": "application", "chunk": "## 怎么用：FastAPI 中的异步端点\n"}

...

data: {"layer": "application", "done": true, "connection_prompt": "注意这里的 Depends..."}

data: {"layer": "connection", "chunk": "## 关联什么：与 asyncpg、arq 的协同\n"}

...

data: {"layer": "connection", "done": true, "connection_prompt": "现在你已经掌握了 asyncio 基础..."}

data: {"all_done": true, "practice_questions": ["用自己的话解释...", "改写以下同步代码..."], "estimated_minutes": 45}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `layer` | string | 当前层名：`concept` / `principle` / `application` / `connection` |
| `chunk` | string | 该层内容增量文本 |
| `done` | boolean | 单层完成标志（层级 done，非全局 done）|
| `connection_prompt` | string | 层完成时的关联提示语（仅 done=true 时出现）|
| `all_done` | boolean | 全部4层完成标志 |
| `practice_questions` | string[] | 自测题（仅 all_done 时出现）|
| `estimated_minutes` | int | 预计学习时长（仅 all_done 时出现）|

---

### 2.5 费曼评估 — `POST /api/v1/training/plans/{id}/items/{item_id}/summary`

**请求体（JSON）：**

```json
{
  "user_summary": "我理解 async/await 是 Python 中实现非阻塞 IO 的方式..."
}
```

**事件序列：**

```
data: {"type": "feedback_stream", "chunk": "你对 async/await 的理解已经建立起来了..."}

...

data: {"type": "feedback_done", "evaluation": {
  "clarity_score": 78,
  "accuracy_score": 82,
  "completeness_score": 65,
  "connection_awareness": true,
  "missing_concepts": ["事件循环的单线程特性"],
  "encouragement": "你的理解方向正确，特别是能联想到 Django 的对比...",
  "follow_up_prompt": null,
  "passed": true
}}

data: {"done": true}
```

---

### 2.6 复测出题 — `POST /api/v1/training/plans/{id}/retest`

非 SSE。直接返回 JSON：

```json
{
  "retest_id": "uuid-xxx",
  "questions": [
    {
      "topic": "FastAPI 异步编程模型",
      "question": "请解释 FastAPI 中为什么推荐使用 async def...",
      "question_type": "concept",
      "reference_answer_points": ["...", "..."]
    }
  ]
}
```

---

## 三、前端消费约定

### 3.1 通用消费模式

```
1. 建立 EventSource 连接
2. 收到 chunk → 追加到展示区
3. 收到 done=true → 关闭连接、恢复操作按钮
4. 收到 error → 展示错误提示、关闭连接、显示重试按钮
5. 连接断开（onerror）→ 展示「连接中断」、显示重试按钮
```

### 3.2 SSE 流中禁止的前端行为

- 禁止在流未结束时触发页面跳转（路由守卫拦截）
- 禁止在流未结束时重复触发同一 SSE 请求
- 禁止在流未结束时关闭 EventSource（除非用户明确取消）
