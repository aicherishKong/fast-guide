# 07 数据模型

> 阶段目标：定义所有数据库表结构、字段类型、索引策略和迁移规范。

## 输出文件清单

| 文件 | 内容 | 状态 |
|------|------|------|
| `erd.md` | 实体关系图（文字版 + Mermaid 图）| 已完成 |
| `schema_definitions.md` | 完整建表 SQL + SQLAlchemy ORM 定义 | 已完成 |
| `migration_plan.md` | Alembic 迁移策略、初始迁移脚本说明 | 已完成 |

## 核心实体清单（来自架构文档）

| 实体 | 表名 | 关键字段 |
|------|------|---------|
| 用户 | `users` | id, email, password_hash |
| 简历 | `resumes` | id, user_id, storage_key, status |
| 简历分析 | `resume_analyses` | resume_id, jd_hash, overall_score, dimension_scores(JSONB) |
| 简历向量块 | `resume_chunks` | resume_id, embedding(vector 1024) |
| 面试会话 | `interview_sessions` | user_id, mode, difficulty, status |
| 面试题目 | `interview_questions` | session_id, question_index, expected_points(JSONB) |
| 面试回答 | `interview_answers` | question_id, score, evaluation(JSONB) |
| 面试报告 | `interview_reports` | session_id, dimension_scores(JSONB) |
| 训练计划 | `training_plans` | user_id, source_type, status |
| 训练项目 | `training_items` | plan_id, topic, severity, layers(JSONB) |
| 复测记录 | `retest_sessions` | plan_id, before_scores(JSONB), after_scores(JSONB) |

## 完成标准

- [ ] 所有表的 ERD 关系图完成
- [ ] 每张表的完整字段定义（类型、约束、索引）
- [ ] pgvector extension 初始化迁移脚本
- [ ] SQLAlchemy ORM 模型与 DB 表对应关系验证
