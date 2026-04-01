# LangChain + DashScope MVP 测试计划

## 背景

根据系统架构文档，fast-guide 的最小可行 LLM 能力依赖 LangChain 与阿里云百炼（DashScope OpenAI 兼容接口），并覆盖三档模型调用、结构化输出、流式输出、并行调用与 Embedding 生成。

## 目标

1. 执行现有 `E:\fuyao\project\fast-guide\test_dashscope_mvp.py` 测试脚本。
2. 记录最小 MVP 实测结果，包括成功能力、失败项与关键输出形态。
3. 根据测试结果更新 `docs/08_api_spec/` 下接口参数规范，确保文档与可行实现一致。

## 影响范围

- `E:\fuyao\project\fast-guide\test_dashscope_mvp.py`
- `E:\fuyao\project\fast-guide\docs\08_api_spec\api_conventions.md`
- `E:\fuyao\project\fast-guide\docs\08_api_spec\openapi_spec.yaml`
- `E:\fuyao\project\fast-guide\docs\11_integration_testing\plan_langchain_dashscope_mvp.md`

## 实施步骤

1. 阅读架构文档与 API 文档，提取 DashScope / LangChain 的既定约束。
2. 检查本地 Python 环境与依赖可用性，必要时安装测试所需依赖。
3. 执行 `test_dashscope_mvp.py`，收集控制台输出与错误信息。
4. 归纳最小可用参数规范，包括模型分层、结构化输出要求、流式输出行为与 Embedding 参数。
5. 更新 API 接口文档并补充变更记录。

## 验收标准

- 测试脚本至少完成一次真实百炼 API 调用。
- 明确列出通过/失败的能力项及原因。
- API 文档中的参数规范与实测结果保持一致，不保留未经验证的关键参数假设。
