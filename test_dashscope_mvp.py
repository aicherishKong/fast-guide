"""
fast-guide MVP 测试脚本 — 验证 DashScope + LangChain 集成
测试内容：
1. 三档 LLM 基础调用（qwen-turbo / qwen-plus / qwen-max）
2. with_structured_output 结构化输出
3. astream 流式输出
4. RunnableParallel 并行调用
5. Embedding 向量生成
"""
import asyncio
import json
import sys
import time
from typing import Literal

# Fix Windows GBK encoding
sys.stdout.reconfigure(encoding='utf-8')

from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableParallel, RunnableLambda
from langchain_core.output_parsers import StrOutputParser

# ============================================================
# 配置
# ============================================================
BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
API_KEY = "sk-c4c385a38400407aba05fd4b011b1f82"

MODELS = {
    "fast": "qwen-turbo",
    "default": "qwen-plus",
    "quality": "qwen-max",
}

def get_llm(tier: Literal["fast", "default", "quality"] = "default", **kwargs) -> ChatOpenAI:
    return ChatOpenAI(
        model=MODELS[tier],
        base_url=BASE_URL,
        api_key=API_KEY,
        temperature=0.2,
        max_retries=2,
        streaming=True,
        stream_usage=True,
        **kwargs,
    )

# ============================================================
# Pydantic 模型（简历评分简化版）
# ============================================================
class KeywordExtractionOutput(BaseModel):
    """关键词提取结果"""
    technical_skills: list[str] = Field(description="技术技能关键词")
    soft_skills: list[str] = Field(description="软技能关键词")
    domain_knowledge: list[str] = Field(description="领域知识关键词")

class DimensionScore(BaseModel):
    score: int = Field(ge=0, le=100, description="维度得分 0-100")
    reason: str = Field(description="扣分/得分原因")

class ResumeScoreOutput(BaseModel):
    """简历评分结果"""
    overall_score: int = Field(ge=0, le=100, description="综合得分")
    dimensions: dict[Literal["relevance", "keywords", "structure", "quantification"], DimensionScore]
    missing_keywords: list[str] = Field(description="JD 有但简历缺失的关键词")
    matched_keywords: list[str] = Field(description="简历与 JD 共同命中的关键词")
    top_suggestions: list[str] = Field(description="最重要的3条改进建议")

class InterviewQuestion(BaseModel):
    """面试题目"""
    question_text: str = Field(description="面试题目正文")
    question_type: Literal["behavioral", "technical", "situational", "case"]
    difficulty: Literal["easy", "medium", "hard"]
    expected_points: list[str] = Field(description="评分要点，3-5条")
    time_suggestion_seconds: int = Field(description="建议作答时长（秒）", ge=30, le=300)

# ============================================================
# 测试数据
# ============================================================
SAMPLE_JD = """
岗位：Python 后端开发工程师
要求：
- 3年以上 Python 后端开发经验
- 精通 FastAPI 或 Django 框架
- 熟悉 PostgreSQL、Redis
- 了解 Docker、Kubernetes 容器化部署
- 有微服务架构设计经验
- 良好的沟通能力和团队协作能力
"""

SAMPLE_RESUME = """
张三，4年后端开发经验
技能：Python, Django, MySQL, Git
项目经历：
1. 电商平台后端开发（2年），负责订单模块，日均处理10万订单
2. 内部管理系统（1年），使用 Django REST Framework
3. 数据分析平台（1年），使用 Flask + Pandas
教育：计算机科学与技术 本科
"""

# ============================================================
# 测试用例
# ============================================================

async def test_1_basic_invoke():
    """测试1：三档 LLM 基础调用"""
    print("\n" + "="*60)
    print("测试1：三档 LLM 基础调用")
    print("="*60)

    for tier, model in MODELS.items():
        llm = get_llm(tier)
        start = time.time()
        response = await llm.ainvoke("用一句话介绍自己，你是哪个模型？")
        elapsed = time.time() - start

        print(f"\n[{tier}] {model}:")
        print(f"  响应: {response.content[:100]}")
        print(f"  耗时: {elapsed:.2f}s")
        print(f"  response_metadata: {json.dumps(response.response_metadata, indent=2, ensure_ascii=False)}")
        if response.usage_metadata:
            print(f"  usage_metadata: {json.dumps(dict(response.usage_metadata), indent=2)}")


async def test_2_structured_output():
    """测试2：with_structured_output 结构化输出"""
    print("\n" + "="*60)
    print("测试2：with_structured_output 结构化输出")
    print("="*60)

    # 2a: 关键词提取（fast LLM）
    print("\n--- 2a: 关键词提取 (qwen-turbo) ---")
    keyword_prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一位资深 HR，擅长从文本中提取结构化关键词。"),
        ("human", "请从以下文本中提取关键词。\n\n文本：\n{text}"),
    ])

    # 尝试 json_schema 方法
    try:
        chain = keyword_prompt | get_llm("fast").with_structured_output(
            KeywordExtractionOutput, method="json_schema"
        )
        start = time.time()
        result = await chain.ainvoke({"text": SAMPLE_JD})
        elapsed = time.time() - start
        print(f"  method=json_schema 成功!")
        print(f"  结果类型: {type(result).__name__}")
        print(f"  结果: {result.model_dump_json(indent=2, ensure_ascii=False)}")
        print(f"  耗时: {elapsed:.2f}s")
    except Exception as e:
        print(f"  method=json_schema 失败: {e}")

        # fallback: 尝试不指定 method
        try:
            chain = keyword_prompt | get_llm("fast").with_structured_output(KeywordExtractionOutput)
            start = time.time()
            result = await chain.ainvoke({"text": SAMPLE_JD})
            elapsed = time.time() - start
            print(f"  method=default 成功!")
            print(f"  结果: {result.model_dump_json(indent=2, ensure_ascii=False)}")
            print(f"  耗时: {elapsed:.2f}s")
        except Exception as e2:
            print(f"  method=default 也失败: {e2}")

    # 2b: 面试出题（default LLM）
    print("\n--- 2b: 面试出题 (qwen-plus) ---")
    question_prompt = ChatPromptTemplate.from_messages([
        ("system", "你是经验丰富的技术面试官，出一道有针对性的面试题。"),
        ("human", "目标岗位JD：\n{jd_text}\n\n请出一道中等难度的技术面试题："),
    ])

    try:
        chain = question_prompt | get_llm("default").with_structured_output(
            InterviewQuestion, method="json_schema"
        )
        start = time.time()
        result = await chain.ainvoke({"jd_text": SAMPLE_JD})
        elapsed = time.time() - start
        print(f"  成功!")
        print(f"  结果: {result.model_dump_json(indent=2, ensure_ascii=False)}")
        print(f"  耗时: {elapsed:.2f}s")
    except Exception as e:
        print(f"  json_schema 失败: {e}")
        try:
            chain = question_prompt | get_llm("default").with_structured_output(InterviewQuestion)
            start = time.time()
            result = await chain.ainvoke({"jd_text": SAMPLE_JD})
            elapsed = time.time() - start
            print(f"  default method 成功!")
            print(f"  结果: {result.model_dump_json(indent=2, ensure_ascii=False)}")
            print(f"  耗时: {elapsed:.2f}s")
        except Exception as e2:
            print(f"  default method 也失败: {e2}")


async def test_3_streaming():
    """测试3：astream 流式输出"""
    print("\n" + "="*60)
    print("测试3：astream 流式输出")
    print("="*60)

    rewrite_prompt = ChatPromptTemplate.from_messages([
        ("system", "你是简历优化顾问。根据 JD 改写简历，使用 Markdown 格式。保持真实性。"),
        ("human", "## 原始简历\n{resume_text}\n\n## 目标 JD\n{jd_text}\n\n请输出改写后的简历："),
    ])

    chain = rewrite_prompt | get_llm("quality")

    start = time.time()
    chunks = []
    token_count = 0
    first_chunk_time = None

    async for chunk in chain.astream({
        "resume_text": SAMPLE_RESUME,
        "jd_text": SAMPLE_JD,
    }):
        if first_chunk_time is None:
            first_chunk_time = time.time() - start
        if hasattr(chunk, "content") and chunk.content:
            chunks.append(chunk.content)
        if hasattr(chunk, "usage_metadata") and chunk.usage_metadata:
            token_count = chunk.usage_metadata.get("total_tokens", 0)

    elapsed = time.time() - start
    full_text = "".join(chunks)

    print(f"  首 chunk 延迟: {first_chunk_time:.2f}s")
    print(f"  总耗时: {elapsed:.2f}s")
    print(f"  chunk 数量: {len(chunks)}")
    print(f"  总字符数: {len(full_text)}")
    print(f"  token_count: {token_count}")
    print(f"  前200字: {full_text[:200]}...")


async def test_4_runnable_parallel():
    """测试4：RunnableParallel 并行调用"""
    print("\n" + "="*60)
    print("测试4：RunnableParallel 并行调用")
    print("="*60)

    keyword_prompt = ChatPromptTemplate.from_messages([
        ("system", "你是资深 HR，从文本中提取关键词。"),
        ("human", "请从以下文本中提取关键词。\n\n文本：\n{text}"),
    ])

    try:
        KeywordExtractChain = (
            keyword_prompt
            | get_llm("fast").with_structured_output(KeywordExtractionOutput, method="json_schema")
        )
    except:
        KeywordExtractChain = (
            keyword_prompt
            | get_llm("fast").with_structured_output(KeywordExtractionOutput)
        )

    parallel = RunnableParallel(
        resume_keywords=(RunnableLambda(lambda x: {"text": x["resume_text"]}) | KeywordExtractChain),
        jd_keywords=(RunnableLambda(lambda x: {"text": x["jd_text"]}) | KeywordExtractChain),
    )

    start = time.time()
    result = await parallel.ainvoke({
        "resume_text": SAMPLE_RESUME,
        "jd_text": SAMPLE_JD,
    })
    elapsed = time.time() - start

    print(f"  并行调用耗时: {elapsed:.2f}s")
    print(f"  简历关键词: {result['resume_keywords'].model_dump_json(indent=2, ensure_ascii=False)}")
    print(f"  JD关键词: {result['jd_keywords'].model_dump_json(indent=2, ensure_ascii=False)}")


async def test_5_full_score_chain():
    """测试5：完整评分链（RunnableParallel → ScoreChain）"""
    print("\n" + "="*60)
    print("测试5：完整评分链")
    print("="*60)

    score_prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "你是资深 HR 评估专家。请对候选人简历与目标 JD 的匹配度进行全面评分。\n"
            "评分维度：relevance（岗位相关性）、keywords（关键词覆盖率）、"
            "structure（结构清晰度）、quantification（量化表达度）。\n"
            "请严格按照 JSON 格式输出结果。"
        )),
        ("human", (
            "## 目标 JD\n{jd_text}\n\n"
            "## 候选人简历\n{resume_text}\n\n"
            "请以 JSON 格式输出结构化评分结果。"
        )),
    ])

    try:
        chain = score_prompt | get_llm("quality").with_structured_output(
            ResumeScoreOutput, method="json_schema"
        )
    except:
        chain = score_prompt | get_llm("quality").with_structured_output(ResumeScoreOutput)

    start = time.time()
    result = await chain.ainvoke({
        "resume_text": SAMPLE_RESUME,
        "jd_text": SAMPLE_JD,
    })
    elapsed = time.time() - start

    print(f"  耗时: {elapsed:.2f}s")
    print(f"  评分结果:")
    print(f"  {result.model_dump_json(indent=2, ensure_ascii=False)}")


async def test_6_embedding():
    """测试6：Embedding 向量生成"""
    print("\n" + "="*60)
    print("测试6：Embedding 向量生成")
    print("="*60)

    # DashScope embedding 需要用 dashscope SDK 或者 OpenAI 兼容方式
    # OpenAIEmbeddings 默认 check_embedding_ctx_length=True 会触发 tokenizer 问题
    # 关闭此选项直接发送原始文本
    embeddings = OpenAIEmbeddings(
        model="text-embedding-v3",
        dimensions=1024,
        base_url=BASE_URL,
        api_key=API_KEY,
        check_embedding_ctx_length=False,
    )

    texts = [
        "Python 后端开发经验",
        "FastAPI 微服务架构",
        "Docker 容器化部署",
    ]

    start = time.time()
    vectors = await embeddings.aembed_documents(texts)
    elapsed = time.time() - start

    print(f"  耗时: {elapsed:.2f}s")
    print(f"  向量数量: {len(vectors)}")
    print(f"  向量维度: {len(vectors[0])}")
    print(f"  前5维: {vectors[0][:5]}")

    # 测试单条查询
    query_vec = await embeddings.aembed_query("Python 开发")
    print(f"  查询向量维度: {len(query_vec)}")


async def test_7_interview_question_structured():
    """测试7：面试出题 + 评分完整链"""
    print("\n" + "="*60)
    print("测试7：面试评分结构化输出")
    print("="*60)

    from pydantic import BaseModel, Field
    from typing import Literal

    class RubricDimension(BaseModel):
        score: int = Field(ge=0, le=25, description="该维度得分，满分25")
        feedback: str = Field(description="具体反馈")

    class AnswerEvaluationOutput(BaseModel):
        total_score: int = Field(ge=0, le=100)
        dimensions: dict[
            Literal["content_accuracy", "structure_clarity", "star_adherence", "communication"],
            RubricDimension
        ]
        strengths: list[str] = Field(description="回答亮点")
        improvements: list[str] = Field(description="改进建议")

    eval_prompt = ChatPromptTemplate.from_messages([
        ("system", "你是专业面试评分官。按照 rubric 对候选人回答进行评分，请以 JSON 格式输出。"),
        ("human", (
            "## 面试题目\n请描述一次你优化API性能的经历\n\n"
            "## 评分要点\n识别瓶颈、量化效果、工具选型\n\n"
            "## 候选人回答\n我在电商项目中发现订单查询接口响应时间过长，通过分析发现是数据库N+1查询导致的。"
            "我使用了 Django ORM 的 select_related 和 prefetch_related 优化，将响应时间从2秒降低到200毫秒。\n\n"
            "请按 rubric 以 JSON 格式评分："
        )),
    ])

    try:
        chain = eval_prompt | get_llm("quality").with_structured_output(
            AnswerEvaluationOutput, method="json_schema"
        )
    except:
        chain = eval_prompt | get_llm("quality").with_structured_output(AnswerEvaluationOutput)

    start = time.time()
    result = await chain.ainvoke({})
    elapsed = time.time() - start

    print(f"  耗时: {elapsed:.2f}s")
    print(f"  评分结果: {result.model_dump_json(indent=2, ensure_ascii=False)}")


# ============================================================
# Main
# ============================================================
async def main():
    print("=" * 60)
    print("fast-guide MVP 测试 — DashScope + LangChain")
    print("=" * 60)

    tests = [
        ("基础调用", test_1_basic_invoke),
        ("结构化输出", test_2_structured_output),
        ("流式输出", test_3_streaming),
        ("并行调用", test_4_runnable_parallel),
        ("完整评分链", test_5_full_score_chain),
        ("Embedding", test_6_embedding),
        ("面试评分", test_7_interview_question_structured),
    ]

    results = {}
    for name, test_fn in tests:
        try:
            await test_fn()
            results[name] = "PASS"
        except Exception as e:
            print(f"\n  !!! 测试失败: {e}")
            import traceback
            traceback.print_exc()
            results[name] = f"FAIL: {e}"

    print("\n" + "=" * 60)
    print("测试汇总")
    print("=" * 60)
    for name, status in results.items():
        icon = "✓" if status == "PASS" else "✗"
        print(f"  {icon} {name}: {status}")

if __name__ == "__main__":
    asyncio.run(main())
