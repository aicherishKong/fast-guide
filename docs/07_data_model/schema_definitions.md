# 完整表结构定义 — schema_definitions.md

> 阶段：07_data_model | 状态：有效
>
> ## 变更记录
> | 日期 | 变更内容 | Agent |
> |------|---------|-------|
> | 2026-04-01 | 初始版本，覆盖全部 11 张表的字段、类型、约束、索引 | data-model-agent |

---

## 一、全局约定

| 约定 | 规则 |
|------|------|
| 主键 | 所有表使用 `UUID` 主键，由应用层（Python `uuid.uuid4()`）生成 |
| 时间戳 | `TIMESTAMPTZ`（带时区），默认 `now()`，统一 UTC 存储 |
| 软删除 | 不采用软删除，物理删除 + CASCADE |
| JSONB | 非结构化字段（评分维度、关键词列表等）使用 JSONB |
| 向量 | `vector(1024)` 类型，需 pgvector extension |
| 命名 | 表名复数蛇形（`interview_sessions`），字段蛇形（`user_id`）|
| 枚举 | 使用 `VARCHAR` + CHECK 约束，不使用 PostgreSQL ENUM（方便迁移扩展）|

---

## 二、表定义

### 2.1 users

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
```

**SQLAlchemy ORM 映射：**

```python
# backend/app/models/user.py
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now(), onupdate=func.now())

    # relationships
    resumes: Mapped[list["Resume"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    interview_sessions: Mapped[list["InterviewSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    training_plans: Mapped[list["TrainingPlan"]] = relationship(back_populates="user", cascade="all, delete-orphan")
```

---

### 2.2 resumes

```sql
CREATE TABLE resumes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename   VARCHAR(255) NOT NULL,
    storage_key         VARCHAR(500) NOT NULL,           -- MinIO object key
    raw_text            TEXT,                            -- 提取后的纯文本（分析完后填充）
    jd_text             TEXT,                            -- 上传时绑定的 JD 文本（可为空）
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'analyzing', 'analyzed', 'failed')),
    file_size           INTEGER,                         -- 文件大小（bytes）
    mime_type           VARCHAR(100),                    -- application/pdf | application/vnd.openxmlformats...
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resumes_user_id ON resumes (user_id);
CREATE INDEX idx_resumes_status ON resumes (status);
CREATE INDEX idx_resumes_created_at ON resumes (created_at DESC);
```

**SQLAlchemy ORM 映射：**

```python
# backend/app/models/resume.py
class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    raw_text: Mapped[str | None] = mapped_column(Text)
    jd_text: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    file_size: Mapped[int | None] = mapped_column(Integer)
    mime_type: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now(), onupdate=func.now())

    # relationships
    user: Mapped["User"] = relationship(back_populates="resumes")
    analyses: Mapped[list["ResumeAnalysis"]] = relationship(back_populates="resume", cascade="all, delete-orphan")
    chunks: Mapped[list["ResumeChunk"]] = relationship(back_populates="resume", cascade="all, delete-orphan")
```

---

### 2.3 resume_analyses

```sql
CREATE TABLE resume_analyses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id           UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    jd_hash             VARCHAR(64) NOT NULL,            -- SHA-256 of jd_text，用于去重
    overall_score       INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    dimension_scores    JSONB NOT NULL,                  -- {"relevance": {score, reason, suggestions[]}, ...}
    missing_keywords    JSONB NOT NULL DEFAULT '[]',     -- ["FastAPI", "Docker"]
    matched_keywords    JSONB NOT NULL DEFAULT '[]',     -- ["Python", "MySQL"]
    top_suggestions     JSONB NOT NULL DEFAULT '[]',     -- ["补充 FastAPI 经验", ...]
    rewrite_hints       JSONB NOT NULL DEFAULT '[]',     -- ["强调 API 设计", ...]
    rewritten_text      TEXT,                            -- 改写后的简历文本（用户接受改写后填充）
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resume_analyses_resume_id ON resume_analyses (resume_id);
CREATE UNIQUE INDEX idx_resume_analyses_resume_jd ON resume_analyses (resume_id, jd_hash);
```

**SQLAlchemy ORM 映射：**

```python
# backend/app/models/resume.py
class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    resume_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    jd_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    overall_score: Mapped[int] = mapped_column(Integer, nullable=False)
    dimension_scores: Mapped[dict] = mapped_column(JSONB, nullable=False)
    missing_keywords: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    matched_keywords: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    top_suggestions: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    rewrite_hints: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    rewritten_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())

    # relationships
    resume: Mapped["Resume"] = relationship(back_populates="analyses")

    # unique constraint
    __table_args__ = (
        UniqueConstraint("resume_id", "jd_hash", name="uq_resume_analyses_resume_jd"),
    )
```

---

### 2.4 resume_chunks

```sql
-- 首次迁移必须先创建 extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE resume_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id       UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    chunk_index     INTEGER NOT NULL,
    content         TEXT NOT NULL,
    embedding       vector(1024) NOT NULL
);

CREATE INDEX idx_resume_chunks_resume_id ON resume_chunks (resume_id);
-- HNSW 索引，cosine 距离
CREATE INDEX idx_resume_chunks_embedding ON resume_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
```

**SQLAlchemy ORM 映射：**

```python
# backend/app/models/resume.py
from pgvector.sqlalchemy import Vector

class ResumeChunk(Base):
    __tablename__ = "resume_chunks"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    resume_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding = mapped_column(Vector(1024), nullable=False)

    # relationships
    resume: Mapped["Resume"] = relationship(back_populates="chunks")
```

---

### 2.5 interview_sessions

```sql
CREATE TABLE interview_sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id               UUID REFERENCES resumes(id) ON DELETE SET NULL,  -- 可为 NULL
    jd_text                 TEXT,                                            -- jd_only / resume_jd 模式必填
    mode                    VARCHAR(20) NOT NULL
                            CHECK (mode IN ('resume_jd', 'jd_only', 'resume_only', 'free')),
    difficulty              VARCHAR(20) NOT NULL DEFAULT 'medium'
                            CHECK (difficulty IN ('easy', 'medium', 'hard', 'adaptive')),
    effective_difficulty     VARCHAR(10) NOT NULL DEFAULT 'medium'
                            CHECK (effective_difficulty IN ('easy', 'medium', 'hard')),
    question_count          INTEGER NOT NULL DEFAULT 5 CHECK (question_count BETWEEN 3 AND 15),
    input_mode              VARCHAR(10) NOT NULL DEFAULT 'text'
                            CHECK (input_mode IN ('text', 'voice')),
    free_topic              VARCHAR(200),                                    -- free 模式主题
    candidate_profile       TEXT,                                            -- SessionContextChain 生成的画像
    score_history           JSONB NOT NULL DEFAULT '[]',                    -- [int, int, ...]
    asked_types             JSONB NOT NULL DEFAULT '[]',                    -- ["behavioral", "technical", ...]
    status                  VARCHAR(20) NOT NULL DEFAULT 'created'
                            CHECK (status IN ('created', 'in_progress', 'completed',
                                             'report_generating', 'report_ready', 'report_failed')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at            TIMESTAMPTZ
);

CREATE INDEX idx_interview_sessions_user_id ON interview_sessions (user_id);
CREATE INDEX idx_interview_sessions_status ON interview_sessions (status);
CREATE INDEX idx_interview_sessions_created_at ON interview_sessions (created_at DESC);
```

**SQLAlchemy ORM 映射：**

```python
# backend/app/models/interview.py
class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id: Mapped[uuid.UUID | None] = mapped_column(UUID, ForeignKey("resumes.id", ondelete="SET NULL"))
    jd_text: Mapped[str | None] = mapped_column(Text)
    mode: Mapped[str] = mapped_column(String(20), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    effective_difficulty: Mapped[str] = mapped_column(String(10), nullable=False, default="medium")
    question_count: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    input_mode: Mapped[str] = mapped_column(String(10), nullable=False, default="text")
    free_topic: Mapped[str | None] = mapped_column(String(200))
    candidate_profile: Mapped[str | None] = mapped_column(Text)
    score_history: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    asked_types: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="created")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(TIMESTAMPTZ)

    # relationships
    user: Mapped["User"] = relationship(back_populates="interview_sessions")
    resume: Mapped["Resume | None"] = relationship()
    questions: Mapped[list["InterviewQuestion"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    report: Mapped["InterviewReport | None"] = relationship(back_populates="session", uselist=False, cascade="all, delete-orphan")
```

---

### 2.6 interview_questions

```sql
CREATE TABLE interview_questions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id              UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_index          INTEGER NOT NULL,
    question_text           TEXT NOT NULL,
    question_type           VARCHAR(20) NOT NULL
                            CHECK (question_type IN ('behavioral', 'technical', 'situational', 'case')),
    difficulty              VARCHAR(10) NOT NULL
                            CHECK (difficulty IN ('easy', 'medium', 'hard')),
    expected_points         JSONB NOT NULL DEFAULT '[]',
    follow_up_hints         JSONB NOT NULL DEFAULT '[]',
    time_suggestion_seconds INTEGER NOT NULL DEFAULT 120 CHECK (time_suggestion_seconds BETWEEN 30 AND 300),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interview_questions_session_id ON interview_questions (session_id);
CREATE UNIQUE INDEX idx_interview_questions_session_index ON interview_questions (session_id, question_index);
```

**SQLAlchemy ORM 映射：**

```python
# backend/app/models/interview.py
class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    question_index: Mapped[int] = mapped_column(Integer, nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(20), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(10), nullable=False)
    expected_points: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    follow_up_hints: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    time_suggestion_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=120)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())

    # relationships
    session: Mapped["InterviewSession"] = relationship(back_populates="questions")
    answer: Mapped["InterviewAnswer | None"] = relationship(back_populates="question", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("session_id", "question_index", name="uq_interview_questions_session_index"),
    )
```

---

### 2.7 interview_answers

```sql
CREATE TABLE interview_answers (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id                 UUID NOT NULL UNIQUE REFERENCES interview_questions(id) ON DELETE CASCADE,
    answer_text                 TEXT NOT NULL,
    audio_key                   VARCHAR(500),                  -- MinIO key（语音模式有值）
    total_score                 INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
    dimensions                  JSONB NOT NULL,                -- {content_accuracy: {score, feedback}, ...}
    strengths                   JSONB NOT NULL DEFAULT '[]',
    improvements                JSONB NOT NULL DEFAULT '[]',
    model_answer_hints          JSONB NOT NULL DEFAULT '[]',
    next_question_direction     TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interview_answers_question_id ON interview_answers (question_id);
```

**SQLAlchemy ORM 映射：**

```python
# backend/app/models/interview.py
class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    question_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("interview_questions.id", ondelete="CASCADE"), unique=True, nullable=False)
    answer_text: Mapped[str] = mapped_column(Text, nullable=False)
    audio_key: Mapped[str | None] = mapped_column(String(500))
    total_score: Mapped[int] = mapped_column(Integer, nullable=False)
    dimensions: Mapped[dict] = mapped_column(JSONB, nullable=False)
    strengths: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    improvements: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    model_answer_hints: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    next_question_direction: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())

    # relationships
    question: Mapped["InterviewQuestion"] = relationship(back_populates="answer")
```

---

### 2.8 interview_reports

```sql
CREATE TABLE interview_reports (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id              UUID NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
    overall_score           INTEGER CHECK (overall_score BETWEEN 0 AND 100),
    dimension_scores        JSONB,                         -- {technical: int, communication: int, ...}
    overall_assessment      TEXT,
    top_strengths           JSONB DEFAULT '[]',
    critical_gaps           JSONB DEFAULT '[]',
    hiring_recommendation   VARCHAR(20)
                            CHECK (hiring_recommendation IN ('strong_yes', 'yes', 'borderline', 'no')),
    learning_priorities     JSONB DEFAULT '[]',
    mode_insights           TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'generating'
                            CHECK (status IN ('generating', 'completed', 'failed')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interview_reports_session_id ON interview_reports (session_id);
```

**SQLAlchemy ORM 映射：**

```python
# backend/app/models/interview.py
class InterviewReport(Base):
    __tablename__ = "interview_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("interview_sessions.id", ondelete="CASCADE"), unique=True, nullable=False)
    overall_score: Mapped[int | None] = mapped_column(Integer)
    dimension_scores: Mapped[dict | None] = mapped_column(JSONB)
    overall_assessment: Mapped[str | None] = mapped_column(Text)
    top_strengths: Mapped[list | None] = mapped_column(JSONB, default=list)
    critical_gaps: Mapped[list | None] = mapped_column(JSONB, default=list)
    hiring_recommendation: Mapped[str | None] = mapped_column(String(20))
    learning_priorities: Mapped[list | None] = mapped_column(JSONB, default=list)
    mode_insights: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="generating")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())

    # relationships
    session: Mapped["InterviewSession"] = relationship(back_populates="report")
```

---

### 2.9 training_plans

```sql
CREATE TABLE training_plans (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type                 VARCHAR(20) NOT NULL
                                CHECK (source_type IN ('interview_report', 'jd_only')),
    source_id                   UUID,                              -- interview_reports.id 或 NULL
    status                      VARCHAR(20) NOT NULL DEFAULT 'generating'
                                CHECK (status IN ('generating', 'active', 'completed', 'failed')),
    completed_items             INTEGER NOT NULL DEFAULT 0,
    total_items                 INTEGER NOT NULL DEFAULT 0,
    total_estimated_minutes     INTEGER,
    knowledge_graph_summary     TEXT,
    candidate_strengths         JSONB DEFAULT '[]',
    suggested_learning_order    JSONB DEFAULT '[]',               -- ["topic1", "topic2", ...]
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_training_plans_user_id ON training_plans (user_id);
CREATE INDEX idx_training_plans_status ON training_plans (status);
```

**SQLAlchemy ORM 映射：**

```python
# backend/app/models/training.py
class TrainingPlan(Base):
    __tablename__ = "training_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    source_type: Mapped[str] = mapped_column(String(20), nullable=False)
    source_id: Mapped[uuid.UUID | None] = mapped_column(UUID)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="generating")
    completed_items: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_items: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_estimated_minutes: Mapped[int | None] = mapped_column(Integer)
    knowledge_graph_summary: Mapped[str | None] = mapped_column(Text)
    candidate_strengths: Mapped[list | None] = mapped_column(JSONB, default=list)
    suggested_learning_order: Mapped[list | None] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now(), onupdate=func.now())

    # relationships
    user: Mapped["User"] = relationship(back_populates="training_plans")
    items: Mapped[list["TrainingItem"]] = relationship(back_populates="plan", cascade="all, delete-orphan")
    retest_sessions: Mapped[list["RetestSession"]] = relationship(back_populates="plan", cascade="all, delete-orphan")
```

---

### 2.10 training_items

```sql
CREATE TABLE training_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id                 UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    topic                   VARCHAR(200) NOT NULL,
    category                VARCHAR(30) NOT NULL
                            CHECK (category IN ('technical_skill', 'domain_knowledge', 'soft_skill', 'tool_proficiency')),
    severity                VARCHAR(10) NOT NULL
                            CHECK (severity IN ('high', 'medium', 'low')),
    evidence                TEXT,
    sequence_order          INTEGER NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'locked'
                            CHECK (status IN ('locked', 'pending', 'in_progress', 'feynman_pending', 'completed')),
    prerequisite_topics     JSONB NOT NULL DEFAULT '[]',
    related_topics          JSONB NOT NULL DEFAULT '[]',
    leads_to                JSONB NOT NULL DEFAULT '[]',
    core_concepts           JSONB DEFAULT '[]',
    why_important           TEXT,
    layers                  JSONB,                             -- [{layer, title, content, connection_prompt}, ...]
    practice_questions      JSONB DEFAULT '[]',
    external_resources      JSONB DEFAULT '[]',
    estimated_minutes       INTEGER CHECK (estimated_minutes BETWEEN 15 AND 120),
    feynman_summary         TEXT,                              -- 用户最后一次提交的费曼总结
    feynman_eval            JSONB,                             -- FeynmanEvalOutput
    feynman_attempts        INTEGER NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at            TIMESTAMPTZ
);

CREATE INDEX idx_training_items_plan_id ON training_items (plan_id);
CREATE INDEX idx_training_items_status ON training_items (status);
CREATE INDEX idx_training_items_sequence ON training_items (plan_id, sequence_order);
```

**SQLAlchemy ORM 映射：**

```python
# backend/app/models/training.py
class TrainingItem(Base):
    __tablename__ = "training_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    plan_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("training_plans.id", ondelete="CASCADE"), nullable=False)
    topic: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    severity: Mapped[str] = mapped_column(String(10), nullable=False)
    evidence: Mapped[str | None] = mapped_column(Text)
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="locked")
    prerequisite_topics: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    related_topics: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    leads_to: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    core_concepts: Mapped[list | None] = mapped_column(JSONB, default=list)
    why_important: Mapped[str | None] = mapped_column(Text)
    layers: Mapped[dict | None] = mapped_column(JSONB)
    practice_questions: Mapped[list | None] = mapped_column(JSONB, default=list)
    external_resources: Mapped[list | None] = mapped_column(JSONB, default=list)
    estimated_minutes: Mapped[int | None] = mapped_column(Integer)
    feynman_summary: Mapped[str | None] = mapped_column(Text)
    feynman_eval: Mapped[dict | None] = mapped_column(JSONB)
    feynman_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(TIMESTAMPTZ)

    # relationships
    plan: Mapped["TrainingPlan"] = relationship(back_populates="items")
```

---

### 2.11 retest_sessions

```sql
CREATE TABLE retest_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id             UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    questions           JSONB NOT NULL DEFAULT '[]',     -- [{topic, question, question_type, reference_answer_points[]}, ...]
    answers             JSONB DEFAULT '[]',              -- [{topic, answer}, ...]
    before_scores       JSONB DEFAULT '{}',              -- {topic: score, ...}
    after_scores        JSONB DEFAULT '{}',              -- {topic: score, ...}
    improvement_rate    FLOAT,                           -- 平均进步百分比
    status              VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                        CHECK (status IN ('in_progress', 'completed')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_retest_sessions_plan_id ON retest_sessions (plan_id);
```

**SQLAlchemy ORM 映射：**

```python
# backend/app/models/training.py
class RetestSession(Base):
    __tablename__ = "retest_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    plan_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("training_plans.id", ondelete="CASCADE"), nullable=False)
    questions: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    answers: Mapped[list | None] = mapped_column(JSONB, default=list)
    before_scores: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    after_scores: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    improvement_rate: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="in_progress")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(TIMESTAMPTZ)

    # relationships
    plan: Mapped["TrainingPlan"] = relationship(back_populates="retest_sessions")
```

---

## 三、索引策略总结

| 表 | 索引名 | 类型 | 列 | 用途 |
|----|--------|------|-----|------|
| users | idx_users_email | B-tree UNIQUE | email | 登录查询 |
| resumes | idx_resumes_user_id | B-tree | user_id | 用户简历列表 |
| resumes | idx_resumes_status | B-tree | status | arq worker 查询待处理 |
| resumes | idx_resumes_created_at | B-tree DESC | created_at | 时间倒序列表 |
| resume_analyses | idx_resume_analyses_resume_jd | B-tree UNIQUE | (resume_id, jd_hash) | 同一简历+JD 去重 |
| resume_chunks | idx_resume_chunks_embedding | HNSW | embedding | 向量相似度检索 |
| interview_sessions | idx_interview_sessions_user_id | B-tree | user_id | 用户面试历史 |
| interview_sessions | idx_interview_sessions_created_at | B-tree DESC | created_at | 时间倒序列表 |
| interview_questions | uq_interview_questions_session_index | B-tree UNIQUE | (session_id, question_index) | 题目顺序唯一 |
| training_items | idx_training_items_sequence | B-tree | (plan_id, sequence_order) | 按学习顺序查询 |

---

## 四、ORM 文件组织

```
backend/app/models/
    __init__.py       # from .user import User; from .resume import ...; 统一导出
    base.py           # Base = declarative_base()，公共 mixin（TimestampMixin）
    user.py           # User
    resume.py         # Resume, ResumeAnalysis, ResumeChunk
    interview.py      # InterviewSession, InterviewQuestion, InterviewAnswer, InterviewReport
    training.py       # TrainingPlan, TrainingItem, RetestSession
```

**公共 Mixin：**

```python
# backend/app/models/base.py
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import func, TIMESTAMP

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now(), onupdate=func.now())
```
