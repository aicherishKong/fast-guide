# 核心交互流程图 — interaction_flow.md

> 阶段：04_core_interaction_design | 状态：有效
>
> ## 变更记录
> | 日期 | 变更内容 | Agent |
> |------|---------|-------|
> | 2026-04-01 | 初始版本，覆盖三大功能的正常路径与异常路径 | interaction-design-agent |

---

> **约定**：流程图使用 Mermaid 语法。实线 `-->` 为正常路径，虚线 `-.->` 为异常/可选路径。
> 系统行为用方括号 `[]` 表示，用户行为用圆角矩形表示。

---

## 一、认证流程

### 1.1 注册/登录

```mermaid
flowchart TD
    A([用户访问平台]) --> B{已登录?}
    B -- 是 --> C([进入 Dashboard])
    B -- 否 --> D([显示登录页])
    D --> E{操作选择}
    E -- 登录 --> F([输入邮箱+密码])
    E -- 注册 --> G([填写邮箱+密码+姓名])
    F --> H[POST /auth/login]
    G --> I[POST /auth/register]
    H --> J{验证结果}
    I --> K{注册结果}
    J -- 成功 --> L[存储 access_token\n设置 refresh cookie]
    J -- 失败 --> M([提示：邮箱或密码错误])
    K -- 成功 --> N([新用户引导弹窗])
    K -- 邮箱已注册 --> O([提示：邮箱已存在，去登录])
    L --> C
    N --> C
    M --> D
```

### 1.2 Token 刷新（静默，用户无感知）

```mermaid
flowchart LR
    A([API 请求]) --> B{access_token 有效?}
    B -- 是 --> C([正常请求])
    B -- 否/过期 --> D[POST /auth/refresh\n携带 refresh cookie]
    D --> E{refresh 有效?}
    E -- 是 --> F[返回新 access_token]
    F --> G([重试原请求])
    E -- 否/过期 --> H([跳转登录页\n提示「登录已过期」])
```

---

## 二、功能1：简历优化流程

### 2.1 主流程（含正常路径与异常路径）

```mermaid
flowchart TD
    A([进入简历优化]) --> B{已有简历?}
    B -- 否 --> C([拖拽/点击上传文件])
    B -- 是 --> D([简历库选择已有简历])
    
    C --> E{文件格式校验}
    E -- 不支持格式 --> F([内联提示：仅支持 PDF/DOCX])
    F --> C
    E -- 超过 10MB --> G([内联提示：文件过大，请压缩后上传])
    G --> C
    E -- 通过 --> H[POST /resumes/upload\n后台: 文本提取 + pgvector 分块]
    
    D --> I([显示简历摘要 + 上次评分])
    H --> J([显示上传成功 + 进度条])
    I --> K
    J --> K([粘贴 JD 或跳过])
    
    K --> L{JD 填写情况}
    L -- 填写了JD --> M[POST /resumes/:id/score\n传入 jd_text]
    L -- 跳过 --> N[GET /resumes/:id/analysis\n通用分析（已有缓存）]
    
    M --> O{分析状态}
    N --> O
    O -- processing --> P([Skeleton + 分步进度提示\n每3s轮询一次])
    P --> O
    O -- analyzed --> Q([显示评分报告])
    O -- error --> R([横幅提示：分析失败，点击重试])
    R --> M
    
    Q --> S([查看综合分 + 4维度 + 关键词])
    S --> T{用户决策}
    T -- 查看改写 --> U([点击「一键改写」])
    T -- 手动修改 --> V([跳转到简历编辑器])
    T -- 换个JD重新评分 --> K
    
    U --> W[GET /resumes/:id/rewrite SSE]
    W --> X{SSE 流状态}
    X -- 流式输出 --> Y([逐字显示改写内容])
    X -- done:true --> Z([改写完成，显示对比视图])
    X -- 网络中断 --> AA([保留已有内容 + 重连按钮])
    
    Z --> AB{接受改写?}
    AB -- 接受 --> AC[POST /resumes/:id/rewrite/accept]
    AB -- 手动编辑 --> V
    AB -- 拒绝 --> S
    AC --> AD([保存成功提示 + 下载/去面试 二选一])
```

### 2.2 评分报告页内部交互

```mermaid
flowchart LR
    A([评分报告页]) --> B([圆形总分环\n动画进入])
    B --> C([4个维度条形图\n依次出现])
    C --> D{用户交互}
    D -- 点击某维度 --> E([展开详情面板\n显示扣分原因+建议])
    D -- 点击关键词 --> F([高亮对应关键词位置\n简历预览滚动到对应段])
    D -- 切换视图 --> G([简历原文 / 标注视图 切换])
    E --> H{操作}
    H -- 点击建议 --> I([建议详情弹窗\n为什么重要])
    H -- 收起 --> C
```

---

## 三、功能2：模拟面试流程

### 3.1 会话配置流程

```mermaid
flowchart TD
    A([点击「开始面试」]) --> B([面试配置页])
    B --> C{选择面试模式}
    C -- resume_jd --> D([选择简历 + 粘贴JD])
    C -- jd_only --> E([粘贴JD])
    C -- resume_only --> F([选择简历])
    C -- free --> G([输入练习主题])
    
    D --> H([选择难度: 简单/中等/困难/自适应])
    E --> H
    F --> H
    G --> H
    
    H --> I([选择题数: 3/5/8/10/自定义])
    I --> J([选择模式: 文字/语音])
    J -- 语音 --> K{麦克风权限}
    K -- 已授权 --> L
    K -- 未授权 --> M([浏览器权限弹窗])
    M -- 允许 --> L
    M -- 拒绝 --> N([提示「需要麦克风权限」\n或降级为文字模式])
    N --> J
    J -- 文字 --> L
    
    L([确认配置摘要]) --> O([点击「开始面试」])
    O --> P[POST /interviews/sessions\n后台: SessionContextChain 生成候选人画像]
    P --> Q{初始化状态}
    Q -- 成功 --> R([全屏面试界面\n第一题打字机效果出现])
    Q -- 失败 --> S([提示失败 + 重试按钮])
```

### 3.2 单题问答循环（文字模式）

```mermaid
flowchart TD
    A([题目出现\n含: 题型标签/难度/建议时长]) --> B([用户阅读题目])
    B --> C{操作选择}
    C -- 开始回答 --> D([输入框激活\n字数统计开始])
    C -- 跳过本题 --> E([确认弹窗: 确认跳过?])
    E -- 确认 --> F([记录空答案 → 下一题])
    E -- 取消 --> B
    
    D --> G([输入回答])
    G --> H{提交方式}
    H -- 点击「提交」--> I
    H -- Ctrl+Enter --> I
    I[POST /interviews/sessions/:id/answers\n传入: question_index + answer_text]
    
    I --> J([显示「评分中…」动画])
    J --> K{SSE 流状态}
    K -- 流式 chunk --> L([逐字显示评分文字])
    K -- done:true --> M([显示完整评分卡\n含: 总分/4维度/亮点/建议])
    K -- 网络中断 --> N([提示中断 + 「重新获取评分」按钮])
    
    M --> O{查看参考答案?}
    O -- 展开 --> P([参考答案要点折叠面板打开])
    O -- 不查看 --> Q
    P --> Q
    
    Q{还有下一题?}
    Q -- 是 --> R([「下一题」按钮])
    R --> A
    Q -- 否 --> S([「完成面试」按钮])
    S --> T[POST /interviews/sessions/:id/complete\n触发: arq InterviewSummaryChain 任务]
```

### 3.3 单题问答循环（语音模式）

```mermaid
flowchart TD
    A([题目出现]) --> B([语音录音界面\n显示波形可视化])
    B --> C{录音操作}
    C -- 按住录音键 --> D([开始录音\n实时音量波形])
    C -- 点击开始/结束 --> D
    D --> E([松手/点击结束])
    E --> F([「转写中…」提示\n约3-5s])
    F --> G[WS: 发送 PCM 数据\n触发 Whisper API]
    G --> H{转写结果}
    H -- 成功 --> I([显示转写文本\n用户可编辑修正])
    H -- 失败/空 --> J([提示「未识别到内容，请重新录音」])
    J --> B
    I --> K([「确认提交」按钮])
    K --> L([进入文字模式评分流程])
    
    style L fill:#e8f4fd
```

### 3.4 自适应难度调整（静默）

```mermaid
flowchart LR
    A([每题评分完成]) --> B[更新 score_history\n存入 Redis SessionState]
    B --> C{连续2题均分?}
    C -- > 80 且当前非 hard --> D([下一题升为 hard\n用户无感知])
    C -- < 55 且当前非 easy --> E([下一题降为 easy\n用户无感知])
    C -- 其他 --> F([保持当前档位])
    D --> G([出下一题\n题目难度有所提升])
    E --> G
    F --> G
```

### 3.5 面试报告查看流程

```mermaid
flowchart TD
    A([跳转报告页]) --> B{报告是否生成?}
    B -- 生成中 --> C([进度动画\n「正在汇总表现…」\n每3s轮询])
    C --> B
    B -- 已生成 --> D([报告页面加载])
    D --> E([综合评分 + 录用建议])
    E --> F([雷达图: 4维度\n动画展开])
    F --> G([整体评价文字])
    G --> H([题目回顾手风琴列表])
    H --> I{展开某题?}
    I -- 是 --> J([题目 + 我的回答 + 评分详情])
    I --> K([行动按钮区])
    K --> L{用户选择}
    L -- 生成学习计划 --> M[POST /training/plans\nsource=interview_report]
    L -- 重新面试 --> N([面试配置页])
    L -- 优化简历 --> O([简历优化页\n携带面试弱点作为 rewrite_hints])
    M --> P([跳转训练计划页])
```

---

## 四、功能3：知识缺口训练流程

### 4.1 训练计划初始化流程

```mermaid
flowchart TD
    A{来源} --> B[来自面试报告]
    A --> C[手动创建]
    B --> D[POST /training/plans\nsource=interview_report\nsource_id=session_id]
    C --> E([输入 JD 文本 / 选择已有 JD])
    E --> F[POST /training/plans\nsource=jd_text\njd_text=...]
    D --> G([跳转训练计划页\n显示「正在生成学习地图…」])
    F --> G
    G --> H{轮询计划状态}
    H -- generating --> I([进度动画\n「正在识别缺口…\n构建知识关联图…」\n每3s轮询])
    I --> H
    H -- active --> J([全局蓝图加载完成])
    H -- error --> K([生成失败提示 + 重试按钮])
```

### 4.2 全局蓝图交互流程

```mermaid
flowchart TD
    A([蓝图页面]) --> B([有向知识图谱\n左侧可视化区域])
    B --> C([右侧: 学习路径列表\n按序排列\n总时长估算])
    
    B --> D{图谱交互}
    D -- 悬停节点 --> E([Tooltip: 主题/严重程度/为什么重要/前置依赖])
    D -- 点击节点 --> F{节点状态?}
    F -- 未锁定 --> G([高亮节点 + 右侧显示节点详情])
    F -- 已锁定 --> H([提示「请先完成: prerequisite_topics」])
    F -- 已完成 --> I([允许回顾\n不重新费曼])
    
    C --> J{选择学习项}
    J -- 点击推荐项（第一个）--> K([进入学习页])
    J -- 手动选择其他项 --> L{前置完成?}
    L -- 是 --> K
    L -- 否 --> M([弹窗提示依赖关系])
```

### 4.3 单知识点学习流程

```mermaid
flowchart TD
    A([进入知识点学习页]) --> B([Why Important 横幅\n为什么该岗位需要此知识])
    B --> C([Layer1: 是什么\nSSE 流式输出\n约200字])
    C --> D([connection_prompt 出现\n引导联想])
    D --> E([Layer2: 为什么\nSSE 流式输出])
    E --> F([connection_prompt])
    F --> G([Layer3: 怎么用\nSSE 含代码块])
    G --> H([connection_prompt\n含跳转关联节点链接])
    H --> I([Layer4: 关联什么\n高亮已学知识点引用])
    I --> J([练习题展示\n可展开参考答案])
    J --> K([「我理解了，写总结」按钮\n费曼总结入口])
    
    K --> L([费曼总结输入框\n字数100-500\n提示: 用自己的语言])
    L --> M{字数检查}
    M -- < 50字 --> N([提示「多说一点，100字以上」])
    N --> L
    M -- 满足 --> O([点击「提交总结」])
    O --> P[POST /training/plans/:id/items/:item_id/summary\nSSE 返回评估]
    P --> Q{费曼评估结果}
```

### 4.4 费曼检验循环

```mermaid
flowchart TD
    A{费曼评估结果} --> B{passed?}
    B -- true --> C([显示评分详情\n清晰度/准确性/完整性])
    C --> D([鼓励语\n+ 「解锁下一个节点」按钮])
    D --> E([蓝图中节点变绿 ✓])
    E --> F([推荐下一个节点\n或返回蓝图选择])
    
    B -- false --> G([显示评分详情\n指出不足维度])
    G --> H([follow_up_prompt 追问\n给提示不给答案])
    H --> I{第几次失败?}
    I -- 第1次 --> J([输入框清空\n可继续修改提交])
    I -- 第2次 --> K([显示「建议重读 Layer2 的XXX部分」])
    K --> J
    I -- 第3次 --> L([显示「允许跳过」按钮\n+ 「再试一次」按钮])
    L --> M{用户选择}
    M -- 跳过 --> N([节点标记为「部分掌握」黄色\n仍可继续])
    M -- 再试 --> J
    J --> O([用户修改总结])
    O --> P([重新提交])
    P --> A
```

### 4.5 复测流程

```mermaid
flowchart TD
    A([完成全部/部分训练项]) --> B([「开始复测」按钮])
    B --> C([选择复测范围\n全部/仅高优先级/手动选择])
    C --> D[POST /training/plans/:id/retest\n触发: RetestQuestionChain]
    D --> E([复测题逐题出现\n比学习题更简洁])
    E --> F([用户回答: 文字/语音])
    F --> G[POST /training/retest/:id/answers]
    G --> H([SSE 显示评分\n+ 「学习前」分数对比])
    H --> I{还有下一题?}
    I -- 是 --> E
    I -- 否 --> J[GET /training/retest/:id/result]
    J --> K([复测结果页])
    K --> L([各知识点: 学习前→学习后 对比图])
    L --> M([整体提升分\n掌握率变化])
    M --> N([行动建议\n「以下仍需强化: …」])
    N --> O{后续操作}
    O -- 继续学习薄弱项 --> E
    O -- 更新简历 --> P([跳转简历优化\n将新技能融入简历])
    O -- 再次面试 --> Q([跳转面试配置])
```

---

## 五、通知与后台任务反馈流程

### 5.1 arq 任务完成通知

后台长任务（简历分析、面试报告生成、训练计划生成）完成后，通过 Redis pub/sub → WebSocket 推送通知：

```mermaid
sequenceDiagram
    participant U as 用户浏览器
    participant FE as 前端
    participant BE as 后端
    participant WK as arq Worker
    participant RD as Redis

    U->>FE: 触发长任务（如完成面试）
    FE->>BE: POST /interviews/sessions/:id/complete
    BE->>WK: enqueue_job(generate_interview_report_task)
    BE-->>FE: 202 Accepted { task_id }
    FE-->>U: 显示「报告生成中」Loading

    Note over WK,RD: Worker 处理任务（10-30s）

    WK->>BE: 调用 InterviewSummaryChain
    WK->>RD: PUBLISH task_complete:{user_id}
    RD->>BE: 消息推送
    BE->>FE: WebSocket push: { task_type: "interview_report", entity_id: "report_id" }
    FE-->>U: 自动刷新报告页 / Toast 通知
```

### 5.2 全局通知 WebSocket 连接

```
用户登录后 → 建立 WS /ws/notifications → 保持心跳 → 接收任务完成事件
用户切换页面 → WS 保持（不断开）
用户登出 → 关闭 WS
网络断开 → 自动重连（指数退避: 1s/2s/4s/8s）
```

---

## 六、页面级加载与错误边界

### 6.1 路由级加载策略

| 页面 | 加载策略 | 说明 |
|------|---------|------|
| `/login`, `/register` | 立即加载 | 核心入口，不懒加载 |
| `/dashboard` | 立即加载 | 登录后首屏 |
| `/resumes/:id/optimize` | 懒加载 | 按需加载 ScorePanel、DiffViewer |
| `/interviews/:id/session` | 懒加载 | 面试中不允许后台刷新 |
| `/training/:id` | 懒加载 | 知识图谱组件较重 |

### 6.2 错误边界处理

| 错误场景 | 展示位置 | 恢复方式 |
|---------|---------|---------|
| 页面级 JS 错误 | 全屏 ErrorBoundary | 刷新按钮 |
| API 401 未授权 | 自动跳转登录 | — |
| API 404 资源不存在 | 页面内提示 | 返回列表 |
| API 500 服务端错误 | Toast + 稍后重试 | 重试按钮 |
| SSE 连接失败 | 内联提示 | 重试按钮（保留已有内容）|
| WS 连接失败 | 面试中显示 Banner | 自动重连 |
| LLM 响应超时（>60s）| Toast 提示 | 重试按钮 |
