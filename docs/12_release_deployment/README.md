# 12 发布与部署

> 阶段目标：定义生产环境部署方案、发布流程和运维规范。

## 输出文件清单

| 文件 | 内容 | 状态 |
|------|------|------|
| `deployment_guide.md` | 首次部署步骤（服务器配置、Docker、Nginx、SSL）| 待完成 |
| `runbook.md` | 日常运维手册（扩容、回滚、备份、监控告警）| 待完成 |
| `env_prod_template.md` | 生产环境变量清单（脱敏版，说明每个变量的获取方式）| 待完成 |
| `release_checklist.md` | 发布前检查清单 | 待完成 |

## 生产拓扑（v1 单机方案）

```
Internet
  ↓
Nginx (SSL/TLS, Let's Encrypt)
  ├── /api/*  → FastAPI (uvicorn, 4 workers)
  └── /*      → 前端静态文件

同机 Docker：
  ├── backend container
  ├── worker container (arq)
  └── （可选）MinIO container

外部托管服务：
  ├── PostgreSQL (Aliyun RDS / AWS RDS)
  ├── Redis (Aliyun Redis / ElastiCache)
  └── 对象存储 (Aliyun OSS / AWS S3)
```

## 完成标准

- [ ] 首次部署文档完成（可被新人独立执行）
- [ ] 回滚方案明确（数据库迁移回滚 + 容器回滚）
- [ ] 监控告警配置完成（至少覆盖：服务可用性、错误率、LLM API 消耗）
- [ ] 生产环境变量全部归档（脱敏）
