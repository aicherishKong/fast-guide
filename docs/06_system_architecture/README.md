# 06 系统架构设计

> 阶段目标：确定技术选型、服务拓扑、模块边界和工程化链路规范。

## 输出文件清单

| 文件 | 内容 | 状态 |
|------|------|------|
| `fast-guide-v1.0.md` | 完整工程化架构规范 + LangChain Chain I/O 接口规范 | **已完成** |
| `tech_decisions.md` | 关键技术决策记录（ADR 格式）| 待完成 |
| `sequence_diagrams.md` | 关键流程的时序图（简历分析、面试流程、训练生成）| 待完成 |

## 关键技术决策摘要

| 决策 | 选择 | 原因 |
|------|------|------|
| 向量存储 | pgvector（而非独立向量DB）| 避免额外服务，HNSW 够用 |
| 任务队列 | arq（而非Celery）| asyncio 原生，更适合 FastAPI |
| 实时通信 | SSE（文字）+ WebSocket（语音）| 单向流不需要 WS 复杂度 |
| 状态管理 | Zustand（而非Redux）| 3个独立Store，无跨 Store 依赖 |
| 环境管理 | uv（而非pip/poetry）| 速度快，锁文件精确 |

## 完成标准

- [x] 完整架构规范文档
- [x] LangChain Chain I/O 接口规范
- [ ] 技术决策记录（ADR）
- [ ] 关键流程时序图
