# 11 联调

> 阶段目标：验证前后端接口契约，确保端到端功能正常，消灭集成 Bug。

## 输出文件清单

| 文件 | 内容 | 状态 |
|------|------|------|
| `integration_checklist.md` | 联调检查清单（按功能逐项验证）| 待完成 |
| `e2e_test_plan.md` | 端到端测试用例（Happy Path + 异常路径）| 待完成 |
| `bug_tracker.md` | 联调 Bug 记录与修复追踪 | 待完成 |

## 联调顺序（建议按依赖顺序）

1. **Auth 联调** → 注册/登录/Token 刷新
2. **简历上传联调** → 上传 → arq 任务 → 状态轮询 → 分析结果
3. **简历改写 SSE 联调** → EventSource 连接 → chunk 追加 → done 事件
4. **面试会话联调** → 创建会话 → 提交回答 → SSE 评分流 → 完成
5. **面试语音联调** → WS 连接 → 音频传输 → 转写 → 评分
6. **训练计划联调** → 生成蓝图 → 学习内容 SSE → 费曼总结提交

## 联调环境

- 后端：`localhost:8000`（uvicorn --reload）
- 前端：`localhost:5173`（vite dev，/api 代理到后端）
- 基础设施：`docker compose up postgres redis minio -d`

## 完成标准

- [ ] 所有 P0 功能端到端 Happy Path 通过
- [ ] SSE 断线重连测试通过
- [ ] WebSocket 异常断开处理测试通过
- [ ] arq 任务失败重试逻辑测试通过
