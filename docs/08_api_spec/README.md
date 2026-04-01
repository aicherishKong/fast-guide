# 08 API 规范

> 阶段目标：定义所有 API 端点的请求/响应格式，作为前后端联调契约。

## 输出文件清单

| 文件 | 内容 | 状态 |
|------|------|------|
| `api_conventions.md` | API 设计约定（状态码、错误格式、分页、认证）| 已完成 |
| `openapi_spec.yaml` | OpenAPI 3.0 完整规范（可导入 Swagger UI）| 已完成 |
| `sse_contract.md` | SSE 事件格式规范（所有流式端点）| 已完成 |
| `websocket_contract.md` | WebSocket 消息格式规范（语音面试）| 已完成 |

## API 模块划分

| 模块 | 前缀 | 主要端点数 |
|------|------|-----------|
| 认证 | `/api/v1/auth` | 4 |
| 简历 | `/api/v1/resumes` | 6 |
| 面试 | `/api/v1/interviews` | 6 + 1 WS |
| 训练 | `/api/v1/training` | 7 |
| 用户 | `/api/v1/users` | 2 |

## 统一错误响应格式

```json
{
  "error": {
    "code": "RESUME_NOT_FOUND",
    "message": "简历不存在或无权限访问",
    "detail": null
  }
}
```

## 完成标准

- [ ] 所有端点有完整的请求/响应 Schema
- [ ] openapi_spec.yaml 可通过 Swagger UI 正常渲染
- [ ] SSE 事件格式文档覆盖所有流式端点
- [ ] WebSocket 消息协议完整定义（含音频规格）
