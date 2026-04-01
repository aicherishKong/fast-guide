import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { CheckCircle2, Circle, Play, RotateCcw, Maximize2 } from 'lucide-react';
import { AdvancedKnowledgeGraph } from '../../components/training/AdvancedKnowledgeGraph';
import { useState } from 'react';

export default function PlanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);

  // Mock 数据
  const plan = {
    id,
    source: '面试报告生成',
    createdAt: '2026-03-30',
    totalItems: 8,
    completedItems: 3,
  };

  const knowledgeItems = [
    {
      id: '1',
      title: 'React Hooks 深入原理',
      difficulty: '中等',
      estimatedTime: '30 分钟',
      status: 'completed' as const,
      dependencies: [],
      category: 'React',
    },
    {
      id: '2',
      title: '浏览器事件循环',
      difficulty: '困难',
      estimatedTime: '45 分钟',
      status: 'completed' as const,
      dependencies: [],
      category: '基础',
    },
    {
      id: '3',
      title: '性能优化最佳实践',
      difficulty: '中等',
      estimatedTime: '40 分钟',
      status: 'in-progress' as const,
      dependencies: ['1', '2'],
      category: 'React',
    },
    {
      id: '4',
      title: 'Webpack 构建原理',
      difficulty: '困难',
      estimatedTime: '50 分钟',
      status: 'pending' as const,
      dependencies: [],
      category: '工具链',
    },
    {
      id: '5',
      title: 'TypeScript 高级类型',
      difficulty: '中等',
      estimatedTime: '35 分钟',
      status: 'pending' as const,
      dependencies: ['1'],
      category: '工具链',
    },
    {
      id: '6',
      title: 'React 性能优化进阶',
      difficulty: '困难',
      estimatedTime: '45 分钟',
      status: 'pending' as const,
      dependencies: ['3', '5'],
      category: 'React',
    },
    {
      id: '7',
      title: '前端工程化实践',
      difficulty: '中等',
      estimatedTime: '40 分钟',
      status: 'pending' as const,
      dependencies: ['4'],
      category: '工程化',
    },
    {
      id: '8',
      title: '微前端架构设计',
      difficulty: '困难',
      estimatedTime: '60 分钟',
      status: 'pending' as const,
      dependencies: ['4', '6'],
      category: '架构',
    },
  ];

  const progress = (plan.completedItems / plan.totalItems) * 100;
  const nextItem = knowledgeItems.find(item => item.status === 'in-progress' || item.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 计划头部 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>我的训练计划</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>来源：{plan.source}</span>
                <span>创建于：{plan.createdAt}</span>
              </div>
            </div>
            {plan.completedItems === plan.totalItems && (
              <Button onClick={() => navigate(`/training/${id}/retest`)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                开始复测
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>总进度</span>
              <span className="font-medium">
                {plan.completedItems} / {plan.totalItems} 个知识点
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 知识图谱视图 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>知识图谱</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGraphExpanded(!isGraphExpanded)}
              >
                <Maximize2 className="mr-2 h-4 w-4" />
                {isGraphExpanded ? '收起' : '全屏查看'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${isGraphExpanded ? 'h-[800px]' : 'h-[500px]'}`}>
              <AdvancedKnowledgeGraph knowledgeItems={knowledgeItems} planId={id || '1'} />
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <span>待学习</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>进行中</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>已完成</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 学习路径列表 */}
        <Card>
          <CardHeader>
            <CardTitle>学习路径</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {knowledgeItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    item.status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : item.status === 'in-progress'
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => navigate(`/training/${id}/items/${item.id}`)}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {item.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : item.status === 'in-progress' ? (
                        <Play className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.estimatedTime}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {nextItem && (
              <Button
                className="w-full mt-4"
                onClick={() => navigate(`/training/${id}/items/${nextItem.id}`)}
              >
                <Play className="mr-2 h-4 w-4" />
                继续学习
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
