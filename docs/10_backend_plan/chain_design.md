# Chain 实现规范 — chain_design.md

> 阶段：10_backend_plan | 状态：有效
>
> ## 变更记录
> | 日期 | 变更内容 | Agent |
> |------|---------|-------|
> | 2026-04-01 | 初始版本，三大功能域 Chain 实现要点 | backend-plan-agent |

---

> 完整的 Chain I/O 接口规范（Pydantic Schema、Prompt 模板、JSON 示例）见：
> `docs/06_system_architecture/fast-guide-v1.0.md` 第二部分「LangChain Chain I/O 接口规范」。
> 本文件聚焦于**实现层面**的要点和注意事项。

---

## 一、LLM Factory 实现要点

**文件：** `backend/app/chains/llm_factory.py`

| 档位 | 模型 | 用途 | temperature |
|------|------|------|------------|
| `fast` | qwen-turbo | 关键词提取、候选人画像生成 | 0.2 |
| `default` | qwen-plus | 出题、学习内容、费曼评估、复测 | 0.2 |
| `quality` | qwen-max | 评分、改写、面试汇总、缺口分析 | 0.2 |

**关键配置：**
- `streaming=True`：所有 LLM 实例启用 token 级流式
- `stream_usage=True`：流式时附带 token 用量统计
- `max_retries=2`：LLM 调用失败自动重试 2 次
- 模型名和 base_url 从 `Settings` 读取，不硬编码

---

## 二、Streaming 辅助函数

**文件：** `backend/app/chains/streaming.py`

**核心函数签名：**

```
sse_stream(chain, input_data) → StreamingResponse
```

**实现要点：**
- 使用 `chain.astream()` 获取 `AsyncIterator[AIMessageChunk]`
- 每个 chunk 包装为 `data: {"chunk": "..."}\n\n` 格式
- 流结束发送 `data: {"done": true}\n\n`
- 异常捕获：LLM 调用失败时发送 `data: {"error": "...", "done": true}\n\n`
- 心跳：generator 中每 15 秒发送 `:keepalive\n\n`

---

## 三、简历优化 Chain 实现要点

### 3.1 KeywordExtractChain

**文件：** `backend/app/core/resume/scorer.py`

- 使用 `fast` 档位 LLM（低成本、快速响应）
- `with_structured_output(KeywordExtractionOutput, method="json_schema")`
- 同一个 Chain 实例同时用于简历文本和 JD 文本（输入格式相同：`{"text": str}`）

### 3.2 ResumeScoreChain

**文件：** `backend/app/core/resume/scorer.py`

- 使用 `RunnableParallel` 并行提取简历关键词和 JD 关键词
- `RunnableLambda` 做字段映射（从 `{"resume_text", "jd_text"}` 映射为 `{"text"}`）
- 最终评分使用 `quality` 档位 LLM
- `with_structured_output(ResumeScoreOutput, method="json_schema")` 保证结构化输出
- 输出中的 `rewrite_hints` 会存入 DB，供后续改写使用

### 3.3 ResumeRewriteChain

**文件：** `backend/app/core/resume/rewriter.py`

- 使用 `quality` 档位 LLM（改写质量要求高）
- **不**使用 `with_structured_output`（输出为自由文本 Markdown）
- 通过 `sse_stream()` 流式推送
- 输入需要从 DB 读取：resume_text + jd_text + rewrite_hints + missing_keywords

---

## 四、模拟面试 Chain 实现要点

### 4.1 SessionContextChain

**文件：** `backend/app/core/interview/session.py`

- 纯 Python 路由器（`build_context_chain(mode)`），不是 LLM Chain
- 根据 mode 返回不同的 Chain 实例
- `free` 模式直接返回 `RunnableLambda`（无 LLM 调用）
- 其他模式使用 `fast` 档位生成候选人画像（300 字以内）
- 输出存入 `interview_sessions.candidate_profile`，后续所有题目复用

### 4.2 QuestionGenerateChain

**文件：** `backend/app/core/interview/question_gen.py`

- 使用 `default` 档位
- `with_structured_output(InterviewQuestion, method="json_schema")`
- 输入需要组装 `context_info` 字段（由 mode 决定内容）
- `asked_types` 从 session 状态读取，避免出题重复
- `weak_areas` 从上一题评分的 `improvements` 字段提取

### 4.3 自适应难度

**文件：** `backend/app/core/interview/session.py`

- 纯 Python 函数 `next_effective_difficulty(state)`，无 LLM 调用
- 在每次答案评分写入后调用
- 更新 `interview_sessions.effective_difficulty` 和 `score_history`
- 仅在 `difficulty=adaptive` 时激活

### 4.4 AnswerEvaluationChain

**文件：** `backend/app/core/interview/evaluator.py`

- 两个版本：
  - `AnswerEvaluationStreamChain`：流式版本，SSE 实时推送给用户
  - `AnswerEvaluationChain`：结构化版本，用于后台保存评分
- 实际调用顺序：先流式推送，流结束后再调结构化版本保存（或解析流式输出）
- 使用 `quality` 档位

### 4.5 InterviewSummaryChain

**文件：** `backend/app/core/interview/evaluator.py`

- 仅在 arq 后台任务中调用（非实时）
- 使用 `quality` 档位
- 需要组装 `interview_records` 列表（从 DB 加载所有问答）
- 输出写入 `interview_reports` 表

### 4.6 语音转写

**文件：** `backend/app/core/interview/voice.py`

- 封装 Whisper API 调用
- 输入：base64 PCM bytes → 拼接为完整音频 → 调用 Whisper
- 输出：转写文本 str
- Whisper API 使用 `WHISPER_API_KEY` 和 `WHISPER_MODEL` 配置

---

## 五、知识缺口训练 Chain 实现要点

### 5.1 BlueprintChain（GapDetectionChain）

**文件：** `backend/app/core/training/gap_detector.py`

- 仅在 arq 后台任务中调用
- 使用 `quality` 档位
- 输出 `GapDetectionOutput`，包含：
  - `gaps[]`（含 prerequisite_topics, related_topics, leads_to）
  - `suggested_learning_order`（拓扑排序后的学习顺序）
- 后台任务负责将 gaps 写入 `training_items` 表，并设置初始 status

### 5.2 DeepDiveChain

**文件：** `backend/app/core/training/plan_generator.py`

- 两个版本：
  - `DeepDiveStreamChain`：SSE 流式，分层推送给前端
  - `DeepDiveChain`：结构化版本，后台保存
- 使用 `default` 档位
- SSE 需要**分层推送**：每层完成后发送 `{"layer": "xxx", "done": true}`
- `already_learned`：从 DB 查询本 plan 已完成 items 的 topic 列表
- 内容生成后写入 `training_items.layers`（JSONB）

### 5.3 FeynmanChain

**文件：** `backend/app/core/training/retester.py`

- 两个版本：流式（FeynmanStreamChain）+ 结构化（FeynmanChain）
- 使用 `default` 档位
- 输入需要从 DB 读取：topic、core_concepts、related_topics
- 输出的 `passed` 字段决定是否解锁下一知识点
- 评估结果写入 `training_items.feynman_eval`，summary 写入 `feynman_summary`
- `feynman_attempts` 自增 1

### 5.4 RetestChain

**文件：** `backend/app/core/training/retester.py`

- `RetestQuestionChain`：为每个 topic 生成一道复测题
- `RetestEvalChain`：评分每道复测答案
- 使用 `default` 档位
- 复测题写入 `retest_sessions.questions`（JSONB）
- 评分结果写入 `retest_sessions.after_scores`

---

## 六、Prompt 管理

**目录：** `backend/app/prompts/`

| 文件名 | 用途 |
|--------|------|
| `resume_keyword_extract.txt` | 关键词提取 system prompt |
| `resume_score.txt` | 评分 system + human prompt |
| `resume_rewrite.txt` | 改写 system + human prompt |
| `interview_context_{mode}.txt` | 4 种模式的候选人画像生成 prompt |
| `interview_question_gen.txt` | 出题 prompt |
| `interview_eval.txt` | 单题评分 prompt |
| `interview_summary.txt` | 面试汇总 prompt |
| `training_blueprint.txt` | 蓝图生成 prompt |
| `training_deep_dive.txt` | 学习内容生成 prompt |
| `training_feynman.txt` | 费曼评估 prompt |
| `training_retest_question.txt` | 复测出题 prompt |
| `training_retest_eval.txt` | 复测评分 prompt |

**加载方式：**

```python
# backend/app/chains/prompt_loader.py
from jinja2 import Environment, FileSystemLoader

prompt_env = Environment(loader=FileSystemLoader("app/prompts"))

def load_prompt(name: str, **kwargs) -> str:
    template = prompt_env.get_template(f"{name}.txt")
    return template.render(**kwargs)
```

Prompt 文件纳入版本控制，修改 prompt 无需改 Python 代码。
