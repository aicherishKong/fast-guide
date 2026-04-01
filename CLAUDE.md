# fast-guide — CLAUDE.md

> 本文件是 Agent Team 的唯一行为准则，所有 Agent 在执行任务前必须先读取此文件。

## 变更记录

| 2026-04-01 | 新增前端项目本地安装与启动说明，明确启动路径与命令 | Codex |

---

## 项目概述

**fast-guide** 是一个求职增效平台，围绕"简历通过率 + 面试通过率"两个核心指标，提供：
1. 简历优化（JD 对齐 + 关键词 + 评分 + 一键改写）
2. 模拟面试（多模式 + 自适应难度 + rubric 评分 + 复盘报告）
3. 知识缺口训练（全局蓝图 → 局部细挖 → 费曼概括）

---

## 目录职责边界

```
fast-guide/
├── backend/        # FastAPI 后端服务（Python）
├── frontend/       # React + Vite 前端应用（TypeScript）
├── docs/           # 全量文档，按阶段分层管理
├── docker/         # Nginx 配置、MinIO 初始化脚本
├── docker-compose.yml
├── .env.example    # 环境变量模板（不含真实密钥）
├── .gitignore
└── CLAUDE.md       # 本文件
```

### backend/ 职责
- FastAPI 应用代码、LangChain Chain、数据库模型、API 路由
- **禁止**在此目录放置任何前端文件、文档或部署脚本
- 所有配置通过 `.env` 注入，代码中**不允许**硬编码任何密钥或 URL
- 虚拟环境使用 **uv** 管理（`uv venv` + `uv pip`），不使用 pip/conda/poetry
- 依赖声明在 `backend/pyproject.toml`，锁文件 `backend/uv.lock` 纳入版本控制

### frontend/ 职责
- React 18 + Vite + TypeScript 应用代码
- **禁止**在此目录放置后端逻辑、数据库操作或 LangChain 相关代码
- 环境变量通过 `frontend/.env.local`（本地，gitignore）和 `frontend/.env`（仅公开变量）管理
- 包管理使用 **pnpm**

### frontend/ 本地启动说明
- 启动路径：`E:\fuyao\project\fast-guide\frontend`
- 安装依赖命令：`pnpm install`
- 启动开发服务器命令：`pnpm dev`
- 若 PowerShell 因执行策略无法直接调用 `pnpm`，可改用：`pnpm.cmd install` 和 `pnpm.cmd dev`

### docs/ 职责
- 所有阶段性文档的唯一存放位置，按编号子目录分层
- **禁止**在此目录放置任何可运行代码（示例代码片段除外）
- 每个阶段目录下必须有对应的输出文件，详见下方「文档阶段说明」

---

## 环境变量管理规范

```
# 根目录
.env.example          # 模板，纳入 git，包含所有变量名和注释，值为占位符
.env                  # 本地实际值，gitignore

# backend/
backend/.env          # 后端运行时读取（如单独启动）
```

- 所有密钥（API Key、JWT Secret、DB Password）**只能**在 `.env` 文件中声明
- 代码中通过 `pydantic-settings` 的 `Settings` 类读取，不使用 `os.environ.get` 裸调用
- 新增环境变量时，必须同步更新 `.env.example` 并添加注释说明

---

## uv 虚拟环境规范

```bash
# 初始化（首次）
cd backend
uv venv                          # 创建 .venv/
uv pip install -e ".[dev]"       # 安装依赖

# 日常
uv pip install <package>         # 安装新包
uv pip freeze > requirements.txt # 不需要，依赖在 pyproject.toml

# CI/CD
uv pip sync                      # 按 uv.lock 精确安装
```

- `.venv/` 目录 gitignore，不纳入版本控制
- `uv.lock` 纳入版本控制，保证复现性

---

## 文档阶段说明（docs/ 子目录）

| 编号 | 目录名 | 阶段 | 核心输出文件 |
|------|--------|------|-------------|
| 00 | `00_setup` | 项目规范与初始化 | `project_rules.md` |
| 01 | `01_business_research` | 业务调研 | `user_research.md`, `market_analysis.md` |
| 02 | `02_competitive_analysis` | 竞品分析 | `competitive_matrix.md` |
| 03 | `03_business_problem_modeling` | 业务问题建模 | `problem_model.md`, `metrics_tree.md` |
| 04 | `04_core_interaction_design` | 核心交互链路设计 | `user_journey.md`, `interaction_flow.md` |
| 05 | `05_product_prototype_spec` | 产品原型规范 | `prototype_spec.md`, `component_list.md` |
| 06 | `06_system_architecture` | 系统架构设计 | `fast-guide-v1.0.md`, `tech_decisions.md` |
| 07 | `07_data_model` | 数据模型 | `erd.md`, `schema_definitions.md` |
| 08 | `08_api_spec` | API 规范 | `openapi_spec.yaml`, `api_conventions.md` |
| 09 | `09_frontend_plan` | 前端实现计划 | `component_tree.md`, `state_management.md`, `sprint_plan.md` |
| 10 | `10_backend_plan` | 后端实现计划 | `chain_design.md`, `task_queue_design.md`, `sprint_plan.md` |
| 11 | `11_integration_testing` | 联调 | `integration_checklist.md`, `e2e_test_plan.md` |
| 12 | `12_release_deployment` | 发布与部署 | `deployment_guide.md`, `runbook.md` |

---

## Agent Team 工作规范

### 核心原则

1. **Plan First（复杂任务先规划）**
   - 凡涉及多文件修改、新功能实现、架构变更的任务，必须先输出 Plan 文件再实施
   - Plan 文件存放在对应阶段目录下，格式：`plan_<task_name>.md`
   - Plan 内容：背景、目标、影响范围、实施步骤、验收标准

2. **阶段输出强制要求**
   - 每个阶段完成后，对应 docs 子目录下必须有输出文件
   - 输出文件格式：Markdown，文件名用小写+下划线
   - 没有输出文件的阶段视为未完成

3. **单一职责**
   - 每个 Agent 只操作其职责范围内的文件
   - backend Agent 不修改 frontend/ 下的文件，反之亦然
   - docs Agent 只写文档，不生成可运行代码

4. **变更追踪**
   - 每次修改已有文档，在文件顶部的 `## 变更记录` 中追加一行
   - 格式：`| YYYY-MM-DD | 变更内容简述 | Agent |`

5. **禁止事项**
   - 禁止在未 Plan 的情况下直接修改核心架构文件
   - 禁止删除文档，只允许追加和标注 `[DEPRECATED]`
   - 禁止在代码中留下 TODO 超过 3 天未处理
   - 禁止提交包含真实密钥的文件

### 任务启动检查清单

Agent 在开始任何任务前，必须确认：
- [ ] 已读取本 CLAUDE.md
- [ ] 已读取对应阶段的 README.md
- [ ] 已确认任务复杂度（简单/复杂），复杂任务先写 Plan
- [ ] 已确认本次任务的输出文件路径

---

## 技术栈速查

| 层 | 技术 |
|----|------|
| 后端框架 | FastAPI 0.115 + uvicorn |
| LLM | LangChain + DashScope (qwen-turbo/plus/max) |
| 数据库 | PostgreSQL 16 + pgvector |
| 任务队列 | arq (async Redis) |
| 文件存储 | MinIO (S3 兼容) |
| 前端框架 | React 18 + Vite + TypeScript |
| 样式 | Tailwind CSS + shadcn/ui |
| 状态管理 | Zustand |
| 包管理(后端) | uv |
| 包管理(前端) | pnpm |
| 容器化 | Docker + docker-compose |
