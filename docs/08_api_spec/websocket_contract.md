# WebSocket 消息协议 — websocket_contract.md

> 阶段：08_api_spec | 状态：有效
>
> ## 变更记录
> | 日期 | 变更内容 | Agent |
> |------|---------|-------|
> | 2026-04-01 | 初始版本，覆盖语音面试通道和通知推送通道 | api-spec-agent |

---

## 一、语音面试通道

### 1.1 连接

```
WS /api/v1/interviews/sessions/{session_id}/voice?token=<access_token>
```

**握手条件：**
- `session_id` 必须存在且属于当前用户
- `session.status` 必须为 `created` 或 `in_progress`
- `session.input_mode` 必须为 `voice`

**握手失败响应：**
- 4001: Token 无效或过期
- 4003: 无权访问该会话
- 4004: 会话不存在
- 4009: 会话已结束
- 4022: 该会话不是语音模式

### 1.2 音频规格

| 参数 | 值 |
|------|-----|
| 采样率 | 16000 Hz |
| 位深 | 16-bit |
| 声道 | mono（单声道）|
| 编码 | PCM |
| 传输编码 | base64 |
| 单帧最大大小 | 4096 bytes（base64 编码前）|

### 1.3 客户端 → 服务器消息

#### `audio_chunk` — 音频分块

```json
{
  "type": "audio_chunk",
  "data": "<base64_encoded_pcm_bytes>",
  "is_final": false
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | string | 固定 `"audio_chunk"` |
| `data` | string | base64 编码的 PCM 音频字节 |
| `is_final` | boolean | `false`=连续发送；`true`=本段录音结束，触发转写 |

**发送频率约定：**
- 客户端每 250ms 发送一帧（约 8000 bytes PCM = 10.9KB base64）
- VAD 静音检测：连续 2 秒无语音活动时自动发送 `is_final=true`

#### `control` — 控制消息

```json
{
  "type": "control",
  "action": "end_session"
}
```

| action | 说明 |
|--------|------|
| `end_session` | 用户主动结束面试，服务端关闭连接并触发报告生成 |

### 1.4 服务器 → 客户端消息

#### `question` — 推送面试题

```json
{
  "type": "question",
  "data": {
    "question_text": "请描述一次你优化 API 性能的经历...",
    "question_type": "technical",
    "difficulty": "medium",
    "expected_points": ["识别瓶颈", "量化效果", "工具选型"],
    "follow_up_hints": ["追问监控方案"],
    "time_suggestion_seconds": 120
  },
  "question_index": 0,
  "effective_difficulty": "medium"
}
```

**时机：** 连接建立后立即发送第一题；每道题评分完成后发送下一题。

#### `transcript` — 语音转写结果

```json
{
  "type": "transcript",
  "data": {
    "text": "我在上一个项目中负责了订单系统的性能优化工作..."
  }
}
```

**时机：** 收到 `is_final=true` 后，调用 Whisper API 完成转写后推送。

#### `eval_chunk` — 流式评分文本

```json
{
  "type": "eval_chunk",
  "data": {
    "chunk": "你的回答提到了具体的瓶颈场景..."
  }
}
```

**时机：** 转写完成后启动 EvaluationChain，逐 chunk 推送。

#### `eval_done` — 评分完成

```json
{
  "type": "eval_done",
  "data": {
    "total_score": 72,
    "dimensions": {
      "content_accuracy": {"score": 20, "feedback": "提到了缓存优化方向"},
      "structure_clarity": {"score": 17, "feedback": "STAR 结构不够完整"},
      "star_adherence": {"score": 18, "feedback": "有情境描述"},
      "communication": {"score": 17, "feedback": "表达流畅"}
    },
    "strengths": ["识别了性能瓶颈方向"],
    "improvements": ["补充量化优化数据"],
    "model_answer_hints": ["APM 工具定位", "缓存策略"],
    "next_question_direction": "系统设计"
  }
}
```

#### `session_complete` — 面试结束

```json
{
  "type": "session_complete",
  "data": {
    "session_id": "uuid-xxx",
    "total_questions": 5,
    "message": "面试结束，正在生成报告..."
  }
}
```

**时机：** 最后一题评分完成后发送，随后服务端关闭 WS 连接。

#### `error` — 错误消息

```json
{
  "type": "error",
  "data": {
    "code": "WHISPER_TRANSCRIBE_FAILED",
    "message": "语音转写失败，请重新录制"
  }
}
```

| 错误码 | 说明 | 客户端处理 |
|--------|------|-----------|
| `WHISPER_TRANSCRIBE_FAILED` | 转写失败 | 提示用户重新录制 |
| `LLM_EVAL_FAILED` | LLM 评分失败 | 提示用户重试 |
| `SESSION_EXPIRED` | 会话超时 | 提示用户返回历史页 |

### 1.5 完整交互时序

```
Client                                Server
  |                                     |
  |-- WS Connect (/voice?token=xxx) -->|
  |                                     |-- 验证 token + session
  |<-- {type: "question", data: Q1} ---|
  |                                     |
  |-- {type: "audio_chunk", ...} ----->|
  |-- {type: "audio_chunk", ...} ----->|  (累积 buffer)
  |-- {type: "audio_chunk",            |
  |    is_final: true} --------------->|  (触发 Whisper)
  |                                     |
  |<-- {type: "transcript", text} -----|
  |                                     |
  |<-- {type: "eval_chunk", chunk} ----|  (逐 chunk 推送)
  |<-- {type: "eval_chunk", chunk} ----|
  |<-- {type: "eval_done", data} ------|  (评分完成)
  |                                     |-- 更新 score_history
  |                                     |-- adaptive 难度重算
  |<-- {type: "question", data: Q2} ---|  (下一题)
  |                                     |
  |  ... 循环 N 题 ...                  |
  |                                     |
  |<-- {type: "session_complete"} -----|
  |                                     |-- 触发 arq 报告任务
  |-- connection closed                |
```

---

## 二、通知推送通道

### 2.1 连接

```
WS /ws/notifications?token=<access_token>
```

**用途：** arq 后台任务完成时推送通知给前端。

**生命周期：** 用户登录后建立，登出时断开。断线自动重连（指数退避，最大 30 秒）。

### 2.2 服务器 → 客户端消息

#### `task_complete` — 后台任务完成

```json
{
  "type": "task_complete",
  "data": {
    "task_type": "resume_analysis",
    "entity_id": "uuid-xxx",
    "status": "completed"
  }
}
```

| task_type | 含义 | 前端处理 |
|-----------|------|---------|
| `resume_analysis` | 简历分析完成 | 停止轮询、刷新简历状态、Toast 通知 |
| `interview_report` | 面试报告生成完成 | 报告页刷新、启用「查看报告」按钮 |
| `training_plan` | 训练计划生成完成 | 蓝图页刷新、渲染知识图谱 |

#### `task_failed` — 后台任务失败

```json
{
  "type": "task_failed",
  "data": {
    "task_type": "resume_analysis",
    "entity_id": "uuid-xxx",
    "error_message": "文件格式解析失败"
  }
}
```

### 2.3 心跳

服务端每 30 秒发送 ping frame，客户端自动 pong。若 60 秒无 pong 响应，服务端断开连接。

### 2.4 后端推送路径

```
arq Worker 任务完成
  → Redis PUBLISH "task_complete:{user_id}" {payload}
  → FastAPI WS Handler 订阅该 channel
  → 推送给该用户的所有活跃 WS 连接
```
