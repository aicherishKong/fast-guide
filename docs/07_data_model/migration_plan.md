# Alembic 迁移规范 — migration_plan.md

> 阶段：07_data_model | 状态：有效
>
> ## 变更记录
> | 日期 | 变更内容 | Agent |
> |------|---------|-------|
> | 2026-04-01 | 初始版本 | data-model-agent |

---

## 一、迁移工具配置

| 项 | 值 |
|----|----|
| 工具 | Alembic 1.13+ |
| 配置文件 | `backend/alembic.ini` |
| 迁移目录 | `backend/app/db/migrations/` |
| 数据库 URL | 从 `backend/app/config.py` 的 `Settings.POSTGRES_DSN` 读取 |
| 命名规则 | `alembic revision --autogenerate -m "简要描述"` |

---

## 二、初始迁移脚本（V1）

初始迁移必须按以下顺序执行：

### 迁移 1：pgvector extension

```
alembic revision -m "create_pgvector_extension"
```

```python
def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

def downgrade():
    op.execute("DROP EXTENSION IF EXISTS vector")
```

### 迁移 2：全量建表

```
alembic revision --autogenerate -m "create_all_tables"
```

建表顺序（遵循外键依赖）：

1. `users`
2. `resumes`
3. `resume_analyses`
4. `resume_chunks`（含 HNSW 索引）
5. `interview_sessions`
6. `interview_questions`
7. `interview_answers`
8. `interview_reports`
9. `training_plans`
10. `training_items`
11. `retest_sessions`

---

## 三、迁移规范

### 3.1 命名约定

| 类型 | 格式 | 示例 |
|------|------|------|
| 建表 | `create_{table_name}` | `create_users` |
| 加字段 | `add_{column}_to_{table}` | `add_file_size_to_resumes` |
| 加索引 | `add_idx_{table}_{column}` | `add_idx_resumes_status` |
| 修改字段 | `alter_{column}_in_{table}` | `alter_status_in_resumes` |
| 删表 | `drop_{table_name}` | `drop_temp_cache` |

### 3.2 开发流程

```bash
# 1. 修改 ORM 模型
# 2. 自动生成迁移
cd backend
alembic revision --autogenerate -m "描述"

# 3. 检查生成的迁移脚本（重要！自动生成不一定完整）
# 4. 执行迁移
alembic upgrade head

# 5. 回滚（如需要）
alembic downgrade -1
```

### 3.3 必须手写的迁移

以下场景 autogenerate **无法**自动检测，必须手写：

| 场景 | 说明 |
|------|------|
| CREATE EXTENSION | pgvector 等扩展安装 |
| HNSW / GiST 索引 | pgvector 索引参数 autogenerate 不识别 |
| CHECK 约束 | 枚举值约束需手动添加 |
| 数据迁移 | 字段拆分、合并、默认值填充 |
| JSONB 默认值 | `server_default=text("'[]'::jsonb")` 需显式声明 |

### 3.4 生产环境迁移原则

- 只执行 `upgrade`，禁止在生产执行 `downgrade`
- 迁移脚本纳入 Git，部署流水线自动执行 `alembic upgrade head`
- 大表加索引使用 `CREATE INDEX CONCURRENTLY`（不锁表）
- 删列/删表操作须先确认应用代码已不再读取该列

---

## 四、环境初始化命令

```bash
# 开发环境完整初始化
docker compose up postgres -d
cd backend
uv venv && uv pip install -e ".[dev]"

# 执行所有迁移
alembic upgrade head

# 验证
psql -h localhost -U postgres -d fast_guide -c "\dt"
psql -h localhost -U postgres -d fast_guide -c "\dx"  # 确认 vector extension
```
