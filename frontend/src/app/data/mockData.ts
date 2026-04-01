// Mock 数据集中管理

export const mockUser = {
  id: '1',
  email: 'demo@example.com',
  name: '演示用户',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
};

export const mockResumes = [
  {
    id: '1',
    name: 'React前端开发_张三.pdf',
    uploadDate: '2026-03-28',
    lastScore: 85,
    status: 'completed' as const,
    fileSize: '2.3 MB',
  },
  {
    id: '2',
    name: '全栈工程师简历.docx',
    uploadDate: '2026-03-25',
    lastScore: 72,
    status: 'completed' as const,
    fileSize: '1.8 MB',
  },
  {
    id: '3',
    name: '产品经理简历.pdf',
    uploadDate: '2026-03-20',
    lastScore: null,
    status: 'analyzing' as const,
    fileSize: '2.1 MB',
  },
];

export const mockInterviews = [
  {
    id: '1',
    date: '2026-03-30',
    mode: '简历 + JD',
    difficulty: '中等',
    overallScore: 82,
    questionCount: 5,
    scores: { completeness: 85, accuracy: 90, depth: 75, clarity: 80 },
  },
  {
    id: '2',
    date: '2026-03-25',
    mode: '仅 JD',
    difficulty: '困难',
    overallScore: 75,
    questionCount: 8,
    scores: { completeness: 78, accuracy: 82, depth: 70, clarity: 72 },
  },
  {
    id: '3',
    date: '2026-03-20',
    mode: '简历 + JD',
    difficulty: '简单',
    overallScore: 88,
    questionCount: 3,
    scores: { completeness: 90, accuracy: 92, depth: 85, clarity: 86 },
  },
];

export const mockTrainingPlans = [
  {
    id: '1',
    source: '面试报告生成',
    createdAt: '2026-03-30',
    totalItems: 8,
    completedItems: 3,
  },
];

export const mockKnowledgeItems = [
  {
    id: '1',
    title: 'React Hooks 深入原理',
    difficulty: '中等',
    estimatedTime: '30 分钟',
    status: 'completed' as const,
  },
  {
    id: '2',
    title: '浏览器事件循环',
    difficulty: '困难',
    estimatedTime: '45 分钟',
    status: 'completed' as const,
  },
  {
    id: '3',
    title: '性能优化最佳实践',
    difficulty: '中等',
    estimatedTime: '40 分钟',
    status: 'in-progress' as const,
  },
  {
    id: '4',
    title: 'Webpack 构建原理',
    difficulty: '困难',
    estimatedTime: '50 分钟',
    status: 'pending' as const,
  },
  {
    id: '5',
    title: 'TypeScript 高级类型',
    difficulty: '中等',
    estimatedTime: '35 分钟',
    status: 'pending' as const,
  },
];

export const mockDashboardStats = {
  resumes: 3,
  interviews: 5,
  trainingProgress: 65,
};

export const mockRecentActivities = [
  {
    id: '1',
    type: 'interview',
    title: '前端工程师面试',
    date: '2026-03-30',
    score: 82,
  },
  {
    id: '2',
    type: 'resume',
    title: '简历优化 - React 开发.pdf',
    date: '2026-03-29',
    action: '已完成分析',
  },
  {
    id: '3',
    type: 'training',
    title: '正在学习：React Hooks 原理',
    date: '2026-03-28',
    progress: 40,
  },
];

export const mockAnalysisData = {
  overallScore: 85,
  dimensions: {
    relevance: 88,
    keywords: 82,
    structure: 90,
    quantification: 80,
  },
  hitKeywords: ['React', 'TypeScript', 'Vue', 'Webpack', '性能优化', 'CI/CD'],
  missingKeywords: ['微前端', 'Vite', 'Nest.js', 'GraphQL'],
  suggestions: [
    {
      priority: 'high' as const,
      title: '补充微前端相关经验',
      description: 'JD 中明确要求微前端架构经验，建议在项目经历中补充相关描述',
    },
    {
      priority: 'medium' as const,
      title: '量化项目成果',
      description: '多个项目缺少具体的数据支撑，建议补充性能提升、用户增长等量化指标',
    },
    {
      priority: 'medium' as const,
      title: '突出技术深度',
      description: '可以增加对 React 源码理解、性能优化实践等深度技术的描述',
    },
  ],
};

export const mockQuestions = [
  {
    id: '1',
    text: '请详细介绍一下 React Hooks 的工作原理，以及它解决了什么问题？',
    type: '概念理解',
    suggestedTime: 3,
  },
  {
    id: '2',
    text: '在你的项目中，如何进行性能优化？请结合具体案例说明。',
    type: '实践应用',
    suggestedTime: 4,
  },
  {
    id: '3',
    text: '解释一下浏览器的事件循环机制，以及宏任务和微任务的区别。',
    type: '原理深度',
    suggestedTime: 4,
  },
  {
    id: '4',
    text: '如果让你设计一个前端路由系统，你会如何实现？',
    type: '系统设计',
    suggestedTime: 5,
  },
  {
    id: '5',
    text: '谈谈你对前端工程化的理解和实践经验。',
    type: '综合应用',
    suggestedTime: 4,
  },
];
