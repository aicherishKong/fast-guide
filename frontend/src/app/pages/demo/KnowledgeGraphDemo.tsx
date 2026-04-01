import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { KnowledgeGraph } from '../../components/training/KnowledgeGraph';
import { AdvancedKnowledgeGraph } from '../../components/training/AdvancedKnowledgeGraph';
import { InteractiveKnowledgeGraph } from '../../components/training/InteractiveKnowledgeGraph';
import { Badge } from '../../components/ui/badge';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';

export default function KnowledgeGraphDemo() {
  // Mock 数据 - 更复杂的知识图谱
  const knowledgeItems = [
    {
      id: '1',
      title: 'JavaScript 基础',
      difficulty: '简单',
      estimatedTime: '20 分钟',
      status: 'completed' as const,
      dependencies: [],
      category: '基础',
    },
    {
      id: '2',
      title: 'HTML/CSS 核心',
      difficulty: '简单',
      estimatedTime: '25 分钟',
      status: 'completed' as const,
      dependencies: [],
      category: '基础',
    },
    {
      id: '3',
      title: 'ES6+ 新特性',
      difficulty: '中等',
      estimatedTime: '35 分钟',
      status: 'completed' as const,
      dependencies: ['1'],
      category: '基础',
    },
    {
      id: '4',
      title: 'React 基础概念',
      difficulty: '中等',
      estimatedTime: '30 分钟',
      status: 'in-progress' as const,
      dependencies: ['1', '3'],
      category: 'React',
    },
    {
      id: '5',
      title: 'React Hooks 深入',
      difficulty: '中等',
      estimatedTime: '40 分钟',
      status: 'pending' as const,
      dependencies: ['4'],
      category: 'React',
    },
    {
      id: '6',
      title: 'TypeScript 基础',
      difficulty: '中等',
      estimatedTime: '30 分钟',
      status: 'pending' as const,
      dependencies: ['3'],
      category: '工具链',
    },
    {
      id: '7',
      title: 'Webpack 构建原理',
      difficulty: '困难',
      estimatedTime: '50 分钟',
      status: 'pending' as const,
      dependencies: ['1'],
      category: '工具链',
    },
    {
      id: '8',
      title: 'React 性能优化',
      difficulty: '困难',
      estimatedTime: '45 分钟',
      status: 'pending' as const,
      dependencies: ['5'],
      category: 'React',
    },
    {
      id: '9',
      title: '前端测试策略',
      difficulty: '中等',
      estimatedTime: '35 分钟',
      status: 'pending' as const,
      dependencies: ['4', '6'],
      category: '工程化',
    },
    {
      id: '10',
      title: '微前端架构',
      difficulty: '困难',
      estimatedTime: '60 分钟',
      status: 'pending' as const,
      dependencies: ['7', '8'],
      category: '架构',
    },
    {
      id: '11',
      title: '前端监控体系',
      difficulty: '困难',
      estimatedTime: '50 分钟',
      status: 'pending' as const,
      dependencies: ['8', '9'],
      category: '工程化',
    },
    {
      id: '12',
      title: 'Node.js 基础',
      difficulty: '中等',
      estimatedTime: '30 分钟',
      status: 'pending' as const,
      dependencies: ['3'],
      category: '后端',
    },
  ];

  const [selectedTab, setSelectedTab] = useState('basic');

  const componentInfo = {
    basic: {
      title: '基础版知识图谱',
      description: '简单直观的知识点依赖关系展示，适合快速集成',
      features: ['节点状态可视化', '依赖关系展示', '点击跳转', '自动布局', '迷你地图'],
    },
    advanced: {
      title: '增强版知识图谱',
      description: '提供更丰富的视觉效果和统计信息',
      features: ['渐变色节点', '节点高亮', '动画效果', '统计面板', '分类支持', '难度图标'],
    },
    interactive: {
      title: '交互式知识图谱',
      description: '包含搜索和过滤功能，适合大量知识点场景',
      features: ['实时搜索', '多维过滤', '高亮匹配', '过滤组合', '结果统计', '一键清除'],
    },
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold mb-2">知识图谱可视化组件演示</h1>
        <p className="text-muted-foreground">
          基于 React Flow 实现的三种知识图谱组件，展示知识点之间的依赖关系
        </p>
      </div>

      {/* 数据统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总知识点
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{knowledgeItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已完成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {knowledgeItems.filter((i) => i.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              进行中
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {knowledgeItems.filter((i) => i.status === 'in-progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              待学习
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {knowledgeItems.filter((i) => i.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 组件展示 */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基础版</TabsTrigger>
              <TabsTrigger value="advanced">增强版</TabsTrigger>
              <TabsTrigger value="interactive">交互式</TabsTrigger>
            </TabsList>

            {/* 基础版 */}
            <TabsContent value="basic" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>{componentInfo.basic.title}</strong>
                  <p className="text-sm mt-1">{componentInfo.basic.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {componentInfo.basic.features.map((feature) => (
                      <Badge key={feature} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
              <div className="h-[600px] border rounded-lg">
                <KnowledgeGraph knowledgeItems={knowledgeItems} planId="demo" />
              </div>
            </TabsContent>

            {/* 增强版 */}
            <TabsContent value="advanced" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>{componentInfo.advanced.title}</strong>
                  <p className="text-sm mt-1">{componentInfo.advanced.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {componentInfo.advanced.features.map((feature) => (
                      <Badge key={feature} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
              <div className="h-[600px] border rounded-lg">
                <AdvancedKnowledgeGraph
                  knowledgeItems={knowledgeItems}
                  planId="demo"
                  showStats={true}
                />
              </div>
            </TabsContent>

            {/* 交互式 */}
            <TabsContent value="interactive" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>{componentInfo.interactive.title}</strong>
                  <p className="text-sm mt-1">{componentInfo.interactive.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {componentInfo.interactive.features.map((feature) => (
                      <Badge key={feature} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
              <div className="h-[600px] border rounded-lg">
                <InteractiveKnowledgeGraph knowledgeItems={knowledgeItems} planId="demo" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用建议</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">基础版</h3>
              <p className="text-sm text-muted-foreground">
                适合小型项目（&lt; 10 个知识点）或需要快速集成的场景
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">增强版</h3>
              <p className="text-sm text-muted-foreground">
                适合中型项目（10-30 个知识点），需要更好视觉效果的场景
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">交互式</h3>
              <p className="text-sm text-muted-foreground">
                适合大型项目（&gt; 30 个知识点），需要搜索和过滤功能的场景
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">快速开始</h3>
            <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
              {`import { AdvancedKnowledgeGraph } from './components/training/AdvancedKnowledgeGraph';

const knowledgeItems = [
  {
    id: '1',
    title: 'React Hooks',
    difficulty: '中等',
    estimatedTime: '30 分钟',
    status: 'completed',
    dependencies: [],
    category: 'React',
  },
];

<AdvancedKnowledgeGraph 
  knowledgeItems={knowledgeItems} 
  planId="1"
  showStats={true}
/>`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
