# 项目规范 — project_rules.md

> 阶段：00_setup | 状态：有效
>
> ## 变更记录
> | 日期 | 变更内容 | Agent |
> |------|---------|-------|
> | 2026-04-01 | 初始版本创建 | setup-agent |

---

## 一、目录结构规范

```
fast-guide/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── dependencies.py
│   │   ├── api/v1/
│   │   ├── core/
│   │   │   ├── resume/
│   │   │   ├── interview/
│   │   │   └── training/
│   │   ├── chains/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── db/
│   │   │   ├── session.py
│   │   │   └── migrations/
│   │   ├── services/
│   │   ├── workers/
│   │   └── prompts/
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── pyproject.toml
│   ├── uv.lock
│   ├── Dockerfile
│   ├── alembic.ini
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── package.json
│
├── docs/
│   ├── 00_setup/
│   ├── 01_business_research/
│   ├── 02_competitive_analysis/
│   ├── 03_business_problem_modeling/
│   ├── 04_core_interaction_design/
│   ├── 05_product_prototype_spec/
│   ├── 06_system_architecture/
│   ├── 07_data_model/
│   ├── 08_api_spec/
│   ├── 09_frontend_plan/
│   ├── 10_backend_plan/
│   ├── 11_integration_testing/
│   └── 12_release_deployment/
│
├── docker/
│   ├── nginx/
│   │   └── nginx.conf
│   └── minio/
│       └── init.sh
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
└── CLAUDE.md
```

---

## 二、命名规范

### 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| Python 模块 | `snake_case.py` | `gap_detector.py` |
| Python 测试 | `test_<模块名>.py` | `test_gap_detector.py` |
| TypeScript 组件 | `PascalCase.tsx` | `ScorePanel.tsx` |
| TypeScript Hook | `use<Name>.ts` | `useSSE.ts` |
| TypeScript 工具 | `camelCase.ts` | `formatters.ts` |
| TypeScript 类型 | `<domain>.ts` | `resume.ts` |
| 文档文件 | `snake_case.md` | `user_journey.md` |
| Plan 文件 | `plan_<task>.md` | `plan_resume_api.md` |
| Prompt 模板 | `<chain>_<role>.txt` | `resume_score_system.txt` |

### 变量/函数命名

| 语言 | 变量 | 函数 | 类 | 常量 |
|------|------|------|-----|------|
| Python | `snake_case` | `snake_case` | `PascalCase` | `UPPER_SNAKE` |
| TypeScript | `camelCase` | `camelCase` | `PascalCase` | `UPPER_SNAKE` |

### API 路由命名

- 使用复数名词：`/resumes`、`/interviews`、`/training/plans`
- 动作用 HTTP method 表达，不在路径中使用动词（除 SSE/WS 特殊端点）
- 版本前缀：`/api/v1/`
- 子资源：`/resumes/{id}/analysis`，不超过3层嵌套

### 数据库命名

| 对象 | 规范 | 示例 |
|------|------|------|
| 表名 | `snake_case` 复数 | `resume_analyses` |
| 列名 | `snake_case` | `overall_score` |
| 索引 | `idx_<表>_<列>` | `idx_resumes_user_id` |
| 外键 | `fk_<表>_<引用表>` | `fk_resumes_users` |

---

## 三、Git 规范

### 分支策略

```
main          ← 生产环境，只接受 PR 合并，禁止直接 push
develop       ← 集成分支，功能开发完成后合并到此
feature/<name> ← 功能开发分支，如 feature/resume-scoring
fix/<name>    ← 缺陷修复分支，如 fix/sse-reconnect
docs/<name>   ← 文档更新分支，如 docs/api-spec
```

### Commit Message 格式

```
<type>(<scope>): <subject>

<body（可选）>
```

**type 可选值：**

| type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `refactor` | 重构（不改变行为）|
| `test` | 测试相关 |
| `chore` | 构建/工具链/配置 |
| `perf` | 性能优化 |

**示例：**
```
feat(resume): add keyword extraction chain with RunnableParallel
fix(interview): handle websocket disconnect gracefully
docs(api): add response examples to resume endpoints
```

### .gitignore 关键规则

```gitignore
# 环境变量（绝对禁止提交）
.env
.env.local
*.env

# Python
backend/.venv/
backend/__pycache__/
backend/*.egg-info/
backend/.pytest_cache/

# Node
frontend/node_modules/
frontend/dist/
frontend/.next/

# IDE
.vscode/settings.json
.idea/

# OS
.DS_Store
Thumbs.db
```

---

## 四、后端开发规范

### 环境管理（uv）

```bash
# 首次初始化
cd backend
uv venv                          # 创建 .venv/（Python 3.11+）
source .venv/Scripts/activate    # Windows Git Bash
uv pip install -e ".[dev]"       # 安装全部依赖

# 新增依赖
uv pip install <package>
# 然后手动更新 pyproject.toml [project.dependencies] 或 [project.optional-dependencies.dev]
uv pip compile pyproject.toml -o uv.lock   # 更新锁文件

# 生产安装（CI/CD）
uv pip sync uv.lock
```

### 配置读取（pydantic-settings）

```python
# backend/app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    llm_api_key: str
    llm_base_url: str
    postgres_dsn: str
    redis_host: str = "localhost"
    # ...

settings = Settings()  # 模块级单例，直接 import 使用
```

**规则：**
- 所有配置通过 `Settings` 类读取，不使用 `os.environ.get` 裸调用
- 敏感配置（API Key 等）不设默认值，缺失时启动即报错
- `settings` 对象只在 `config.py` 实例化一次，其他模块 `from app.config import settings`

### 异步规范

- 所有 FastAPI 路由函数使用 `async def`
- 所有数据库操作使用 `async` SQLAlchemy session
- 所有 LangChain chain 调用使用 `ainvoke` / `astream`
- 禁止在 `async` 函数中直接调用阻塞 I/O（文件读写用 `aiofiles`，同步库用 `asyncio.to_thread`）

### 错误处理

```python
# 使用 FastAPI HTTPException，不要裸 raise Exception
from fastapi import HTTPException

raise HTTPException(status_code=404, detail="Resume not found")

# 自定义异常在 app/exceptions.py 统一定义
# LLM 调用失败的 fallback 在 chains/llm_factory.py 的 RunnableWithFallbacks 处理
```

### 测试规范

- 单元测试覆盖所有 Chain 函数（使用 `langchain_core` 的 `FakeLLM` mock）
- 集成测试覆盖关键 API 端点（使用 `httpx.AsyncClient` + 真实 DB）
- 测试文件与被测模块同名，前缀 `test_`
- 每个 PR 测试覆盖率不得低于现有水平

---

## 五、前端开发规范

### 组件规范

- 页面级组件放 `pages/`，纯展示组件放 `components/`
- 每个组件一个文件，不允许在同一文件中定义多个导出组件
- Props 类型用 `interface`，不用 `type`（除联合类型）
- 禁止使用 `any`，使用 `unknown` 并做类型收窄

### API 调用规范

- 所有 API 调用通过 `api/` 目录下的函数封装，不在组件中直接使用 `fetch`/`axios`
- `api/client.ts` 统一管理 axios 实例、baseURL、token 注入、401 刷新逻辑
- SSE 连接通过 `hooks/useSSE.ts` 封装，不在组件中直接使用 `EventSource`

### 状态管理规范

- 全局状态使用 Zustand，局部状态使用 `useState`/`useReducer`
- 三个核心 Store：`authStore`、`resumeStore`、`interviewStore`（互相独立）
- Store action 命名：动词开头，如 `setResumes`、`clearSession`

---

## 六、文档规范

### 文件头格式（所有 docs 文件必须包含）

```markdown
# 文档标题

> 阶段：<阶段编号_名称> | 状态：草稿/评审中/有效/已废弃
>
> ## 变更记录
> | 日期 | 变更内容 | Agent |
> |------|---------|-------|
> | YYYY-MM-DD | 初始版本 | <agent-name> |
```

### Plan 文件格式

```markdown
# Plan: <任务名称>

> 创建日期：YYYY-MM-DD | 状态：草稿/已批准/执行中/已完成

## 背景
<为什么需要做这个任务>

## 目标
<本次任务要达成的具体目标，可量化>

## 影响范围
- 涉及文件：
- 涉及 API：
- 涉及数据库表：

## 实施步骤
1. Step 1
2. Step 2
...

## 验收标准
- [ ] 标准1
- [ ] 标准2

## 风险与依赖
<潜在风险、前置依赖>
```

### 阶段 README 格式

每个 docs 子目录下的 `README.md` 说明：
- 本阶段的目标
- 本阶段的输出文件清单
- 完成标准

---

## 七、Agent 协作规范

### 任务分级

| 级别 | 判定标准 | 要求 |
|------|---------|------|
| 简单 | 单文件修改、内容追加、配置调整 | 直接执行，无需 Plan |
| 中等 | 2-5 个文件修改、新增 API 端点 | 简要 Plan（100字以内）后执行 |
| 复杂 | 跨层修改、新功能模块、架构变更 | 完整 Plan 文件 + 用户确认后执行 |

### 跨 Agent 交接规范

当一个 Agent 完成阶段工作交接给下一个 Agent 时，需输出交接文件：

```markdown
# 交接文件：<阶段名> → <下一阶段名>

## 已完成内容
- 文件1：简述
- 文件2：简述

## 关键决策记录
- 决策1：<决策内容> | 原因：<原因>

## 遗留问题
- 问题1（优先级：高/中/低）

## 下一阶段必读文件
- 文件路径1
- 文件路径2
```

### SSE/流式任务规范

- 所有流式输出必须以 `data: {"done": true}` 结束
- 流式任务中途报错时发送 `data: {"error": "<message>", "done": true}`
- 前端 `useSSE` hook 统一处理，不在业务组件中写 EventSource 逻辑

---

## 八、发布规范

### 版本号规则（语义化版本 SemVer）

```
MAJOR.MINOR.PATCH
  │     │     └── Bug 修复、文档更新
  │     └──────── 新功能（向后兼容）
  └────────────── 破坏性变更
```

### 发布流程

1. 从 `develop` 创建 `release/vX.X.X` 分支
2. 更新 `CHANGELOG.md`
3. 所有测试通过（CI 绿灯）
4. PR 合并到 `main`
5. 打 Tag `vX.X.X`
6. 触发 CD 部署到生产

---

## 九、当前项目状态（初始化阶段）

- [x] 目录结构创建
- [x] CLAUDE.md 编写
- [x] project_rules.md 编写
- [x] 系统架构文档（`06_system_architecture/fast-guide-v1.0.md`）
- [ ] backend/ 初始化（`pyproject.toml`、`alembic.ini` 等）
- [ ] frontend/ 初始化（`package.json`、`vite.config.ts` 等）
- [ ] docker-compose.yml
- [ ] .env.example
- [ ] 01~05 阶段文档（业务调研 → 原型规范）
- [ ] 07~12 阶段文档（数据模型 → 发布部署）
