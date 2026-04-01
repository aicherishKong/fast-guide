# API 设计约定 — api_conventions.md

> 阶段：08_api_spec | 状态：有效
>
> ## 变更记录
> | 日期 | 变更内容 | Agent |
> |------|---------|-------|
> | 2026-04-01 | 初始版本 | api-spec-agent |

---

## 一、基础约定

| 项 | 约定 |
|----|------|
| 版本前缀 | `/api/v1` |
| 请求格式 | `application/json`（默认）；`multipart/form-data`（文件上传）|
| 响应格式 | `application/json`（默认）；`text/event-stream`（SSE）|
| 字符编码 | UTF-8 |
| 时间格式 | ISO 8601（`2026-04-01T12:00:00Z`），统一 UTC |
| ID 格式 | UUID v4（`550e8400-e29b-41d4-a716-446655440000`）|
| 字段命名 | snake_case |
| 空值 | 字段不存在 = 未传；字段值 `null` = 显式为空 |

---

## 二、认证

### 2.1 JWT 方案

| Token 类型 | 传递方式 | 有效期 | 用途 |
|-----------|---------|--------|------|
| Access Token | `Authorization: Bearer <token>` Header | 15 分钟 | API 请求认证 |
| Refresh Token | HttpOnly Cookie（`refresh_token`）| 7 天 | 静默续期 access token |

### 2.2 SSE 认证

EventSource 不支持自定义 Header，access token 通过 URL 查询参数传递：

```
GET /api/v1/resumes/{id}/rewrite?token=<access_token>
```

### 2.3 WebSocket 认证

初始握手时通过 URL 查询参数传递：

```
WS /api/v1/interviews/sessions/{id}/voice?token=<access_token>
```

---

## 三、HTTP 状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| 200 | 成功 | GET 查询、PUT 更新 |
| 201 | 创建成功 | POST 创建资源（返回新资源）|
| 204 | 无内容 | DELETE 成功、POST 无返回体（如 logout）|
| 400 | 请求参数错误 | 缺少必填字段、格式错误 |
| 401 | 未认证 | Token 缺失或过期 |
| 403 | 无权限 | 访问非本人资源 |
| 404 | 资源不存在 | ID 无效 |
| 409 | 冲突 | 邮箱已注册、重复操作 |
| 413 | 请求体过大 | 文件超过 10MB |
| 422 | 业务规则校验失败 | 面试模式缺少必填字段等 |
| 429 | 请求频率限制 | 过于频繁的 API 调用 |
| 500 | 服务器内部错误 | 未捕获异常 |
| 503 | 服务不可用 | LLM 服务不可达 |

---

## 四、统一错误响应

```json
{
  "error": {
    "code": "RESUME_NOT_FOUND",
    "message": "简历不存在或无权限访问",
    "detail": null
  }
}
```

### 4.1 错误码清单

| 错误码 | HTTP | 说明 |
|--------|------|------|
| `VALIDATION_ERROR` | 400 | 请求参数校验失败（detail 包含字段级错误）|
| `INVALID_CREDENTIALS` | 401 | 邮箱或密码错误 |
| `TOKEN_EXPIRED` | 401 | Access Token 过期 |
| `TOKEN_INVALID` | 401 | Token 格式错误或签名无效 |
| `FORBIDDEN` | 403 | 无权访问该资源 |
| `USER_NOT_FOUND` | 404 | 用户不存在 |
| `RESUME_NOT_FOUND` | 404 | 简历不存在 |
| `SESSION_NOT_FOUND` | 404 | 面试会话不存在 |
| `PLAN_NOT_FOUND` | 404 | 训练计划不存在 |
| `ITEM_NOT_FOUND` | 404 | 训练项目不存在 |
| `EMAIL_ALREADY_EXISTS` | 409 | 邮箱已注册 |
| `SESSION_ALREADY_COMPLETED` | 409 | 会话已结束，不可重复操作 |
| `FILE_TOO_LARGE` | 413 | 文件大小超过限制 |
| `UNSUPPORTED_FILE_TYPE` | 422 | 文件类型不支持 |
| `MODE_REQUIRES_RESUME` | 422 | resume_jd/resume_only 模式必须提供 resume_id |
| `MODE_REQUIRES_JD` | 422 | resume_jd/jd_only 模式必须提供 jd_text |
| `MODE_REQUIRES_TOPIC` | 422 | free 模式必须提供 free_topic |
| `ITEM_NOT_READY` | 422 | 知识点前置依赖未完成 |
| `ANALYSIS_NOT_READY` | 422 | 简历分析尚未完成 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `LLM_SERVICE_ERROR` | 503 | LLM 服务调用失败 |
| `INTERNAL_ERROR` | 500 | 未预期的服务器错误 |

### 4.2 校验错误格式（400）

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数校验失败",
    "detail": [
      {"field": "jd_text", "message": "resume_jd 模式下 jd_text 为必填"},
      {"field": "question_count", "message": "值必须在 3-15 之间"}
    ]
  }
}
```

---

## 五、分页

使用 offset/limit 分页（简单场景足够）：

**请求参数：**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `offset` | int | 0 | 跳过的记录数 |
| `limit` | int | 20 | 每页记录数（最大 100）|
| `sort_by` | string | `created_at` | 排序字段 |
| `sort_order` | string | `desc` | 排序方向（asc/desc）|

**响应格式：**

```json
{
  "items": [...],
  "total": 42,
  "offset": 0,
  "limit": 20
}
```

---

## 六、文件上传

| 约束 | 值 |
|------|-----|
| 最大文件大小 | 10 MB |
| 支持格式 | `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| 传输方式 | `multipart/form-data` |
| 文件字段名 | `file` |
| 附加字段 | `jd_text`（可选，表单字段）|

---

## 七、幂等性

| 方法 | 幂等 | 说明 |
|------|------|------|
| GET | 是 | 只读 |
| POST 创建资源 | 否 | 重复调用可能创建重复资源 |
| POST 操作类 | 视情况 | `accept`、`complete` 类端点需后端做幂等处理（状态检查）|
| PUT | 是 | 全量更新 |
| DELETE | 是 | 重复删除返回 204 |

---

## 八、速率限制

| 端点分组 | 限制 | 窗口 |
|---------|------|------|
| 认证端点（login/register）| 10 次 | 1 分钟 |
| LLM 相关端点（rewrite/score/answers）| 20 次 | 1 分钟 |
| 普通 CRUD | 100 次 | 1 分钟 |
| 文件上传 | 5 次 | 1 分钟 |

响应 Header：

```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 18
X-RateLimit-Reset: 1714540800
```
