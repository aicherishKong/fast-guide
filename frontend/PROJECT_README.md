# AI 求职助手平台

一个基于 React + TypeScript 的智能求职准备平台，帮助求职者优化简历、模拟面试和进行知识训练。

## 功能模块

### 1. 认证模块
- **登录页面** (`/login`) - 用户登录
- **注册页面** (`/register`) - 新用户注册

### 2. 工作台 (`/dashboard`)
- 数据概览：简历数量、面试次数、训练进度
- 最近活动列表
- 快速操作入口

### 3. 简历优化模块
- **简历库** (`/resumes`) - 管理所有上传的简历
- **上传简历** (`/resumes/upload`) - 支持 PDF/DOCX 格式，可选填 JD
- **简历详情** (`/resumes/:id`) - 查看简历信息和优化历史
- **简历优化** (`/resumes/:id/optimize`) - AI 评分、关键词分析、智能改写

### 4. 模拟面试模块
- **面试配置** (`/interviews/new`) - 设置面试模式、难度、题数、输入方式
- **面试会话** (`/interviews/:id/session`) - 沉浸式答题体验
- **面试报告** (`/interviews/:id/report`) - 综合评分、雷达图、逐题回顾
- **面试历史** (`/interviews`) - 查看所有面试记录

### 5. 知识训练模块
- **训练计划** (`/training/:id`) - 知识图谱、学习路径
- **知识点学习** (`/training/:id/items/:item_id`) - 四层学习法（是什么、为什么、怎么用、关联什么）+ 费曼学习法
- **复测** (`/training/:id/retest`) - 学习效果检验

## 技术栈

- **框架**: React 18 + TypeScript
- **路由**: React Router v7 (Data Mode)
- **样式**: Tailwind CSS v4
- **UI 组件**: Radix UI + shadcn/ui
- **图表**: Recharts
- **图标**: Lucide React
- **动画**: Motion (Framer Motion)
- **状态管理**: React Hooks
- **通知**: Sonner

## 核心组件

### 通用组件
- `StreamingText` - SSE 流式文本渲染
- `ScoreRing` - 圆形评分环
- `RadarChart` - 雷达图
- `FileUploadCard` - 文件上传
- `DiffViewer` - 文本对比视图

### 功能组件
- `KeywordBadge` - 关键词标签
- `ScorePanel` - 评分面板
- `QuestionCard` - 面试题目卡片
- `RubricScore` - 评分维度展示

### 核心 Hooks
- `useAuth` - 认证管理
- `useSSE` - 流式内容处理

## Mock 数据

当前所有接口都使用 Mock 数据，便于演示和开发。真实环境中需要：

1. 替换 `useAuth.ts` 中的登录/注册逻辑
2. 替换 `useSSE.ts` 中的流式数据源
3. 连接真实的后端 API
4. 实现 WebSocket 通知功能

## 快速开始

### 默认账号（Mock）
任意邮箱和密码都可以登录，系统会自动创建 Mock 用户。

### 主要页面流程

1. **简历优化流程**
   - 上传简历 → 查看详情 → 优化分析 → AI 改写 → 导出/开始面试

2. **面试流程**
   - 配置面试参数 → 进入面试会话 → 逐题作答 → 查看报告 → 生成训练计划

3. **学习流程**
   - 查看训练计划 → 学习知识点 → 费曼总结 → 复测验收

## 项目结构

\`\`\`
src/app/
├── components/
│   ├── common/          # 通用组件
│   ├── layout/          # 布局组件
│   ├── resume/          # 简历模块组件
│   ├── interview/       # 面试模块组件
│   └── ui/              # UI 基础组件
├── pages/
│   ├── auth/            # 认证页面
│   ├── dashboard/       # 工作台
│   ├── resume/          # 简历页面
│   ├── interview/       # 面试页面
│   └── training/        # 训练页面
├── hooks/               # 自定义 Hooks
├── data/                # Mock 数据
├── routes.tsx           # 路由配置
└── App.tsx              # 应用入口
\`\`\`

## 设计特点

1. **流式体验** - AI 生成内容采用逐字输出效果
2. **响应式设计** - 适配桌面和移动端
3. **路由守卫** - 自动处理登录状态
4. **沉浸式面试** - 全屏模式，减少干扰
5. **费曼学习法** - 强制总结，确保理解
6. **可视化数据** - 雷达图、进度条、折线图

## 待扩展功能

- [ ] 语音输入（VoiceRecorder 组件）
- [ ] 知识图谱可视化（使用 D3.js 或 React Flow）
- [ ] WebSocket 实时通知
- [ ] 简历模板系统
- [ ] 多语言支持
- [ ] 深色模式

## 注意事项

- 当前使用 `localStorage` 存储认证信息，生产环境建议使用更安全的方案
- Mock 数据存储在前端，刷新后会重置
- 文件上传功能需要配置后端接口
- SSE 流式输出当前为模拟效果
