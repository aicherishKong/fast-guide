import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { StreamingText } from '../../components/common/StreamingText';
import { useSSE } from '../../hooks/useSSE';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export default function ItemPage() {
  const { id, item_id } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState<boolean | null>(null);
  const { content: feedback, isStreaming, startStreaming } = useSSE();

  // Mock 数据
  const item = {
    id: item_id,
    title: '性能优化最佳实践',
    index: 3,
    total: 8,
    jdConnection: '该职位要求具备 Web 性能优化经验，能够识别和解决性能瓶颈',
  };

  const layers = {
    concept: '性能优化是通过各种技术手段提升网页加载速度和运行效率的过程，包括资源优化、渲染优化、网络优化等多个方面。',
    principle: '性能优化的核心原理是减少不必要的计算、降低资源体积、优化关键渲染路径。浏览器的渲染流程包括 DOM 构建、CSSOM 构建、渲染树构建、布局和绘制，优化这些环节可以显著提升性能。',
    application: `常见的性能优化实践：

1. 代码分割和懒加载
\`\`\`javascript
const LazyComponent = React.lazy(() => import('./Component'));
\`\`\`

2. 资源压缩和缓存
- 使用 gzip/brotli 压缩
- 合理设置 Cache-Control

3. 图片优化
- 使用 WebP 格式
- 响应式图片
- 懒加载

4. 关键渲染路径优化
- 内联关键 CSS
- 异步加载 JavaScript
- 使用 preload/prefetch`,
    connection: '性能优化与前端工程化、CDN、构建工具等知识点密切相关。了解浏览器工作原理可以更好地理解性能优化的底层逻辑。',
  };

  const quizzes = [
    {
      id: '1',
      question: '什么是首屏加载时间（FCP）？如何优化？',
      answer: 'First Contentful Paint，指页面从开始加载到首个内容渲染的时间。可以通过内联关键CSS、优化字体加载、使用CDN等方式优化。',
    },
    {
      id: '2',
      question: '解释一下懒加载的原理和实现方式',
      answer: '懒加载是延迟加载非关键资源的技术。可以使用 Intersection Observer API 监听元素是否进入视口，进入后再加载资源。',
    },
  ];

  const handleSubmitSummary = () => {
    if (summary.length < 100) {
      toast.error('总结字数不足，至少需要100字');
      return;
    }

    setSubmitted(true);
    startStreaming('/api/training/evaluate-feynman', {
      onDone: () => {
        // 模拟评估结果
        const mockPassed = Math.random() > 0.3;
        setPassed(mockPassed);
        
        if (mockPassed) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          toast.success('太棒了！你已经掌握了这个知识点');
        } else {
          toast.warning('理解还不够深入，请继续思考');
        }
      },
    });
  };

  const handleNext = () => {
    // 跳转到下一个知识点
    navigate(`/training/${id}/items/${Number(item_id) + 1}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 面包屑和进度 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="cursor-pointer hover:text-foreground" onClick={() => navigate(`/training/${id}`)}>
            训练计划
          </span>
          <span>/</span>
          <span>{item.title}</span>
        </div>
        <Badge variant="outline">第 {item.index} 个 / 共 {item.total} 个</Badge>
      </div>

      {/* 为什么学 */}
      <Card>
        <CardHeader>
          <CardTitle>为什么学习这个？</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm bg-blue-50 p-4 rounded-lg">{item.jdConnection}</p>
        </CardContent>
      </Card>

      {/* 4层内容 */}
      <Card>
        <CardHeader>
          <CardTitle>学习内容</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="concept">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="concept">是什么</TabsTrigger>
              <TabsTrigger value="principle">为什么</TabsTrigger>
              <TabsTrigger value="application">怎么用</TabsTrigger>
              <TabsTrigger value="connection">关联什么</TabsTrigger>
            </TabsList>

            <TabsContent value="concept" className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p>{layers.concept}</p>
              </div>
            </TabsContent>

            <TabsContent value="principle" className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p>{layers.principle}</p>
              </div>
            </TabsContent>

            <TabsContent value="application" className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                  {layers.application}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="connection" className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p>{layers.connection}</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 自测题 */}
      <Card>
        <CardHeader>
          <CardTitle>自测题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quizzes.map((quiz, idx) => (
            <details key={quiz.id} className="group">
              <summary className="cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="font-medium">问题 {idx + 1}: {quiz.question}</span>
              </summary>
              <div className="mt-2 p-4 border rounded-lg bg-green-50">
                <p className="text-sm text-green-900">{quiz.answer}</p>
              </div>
            </details>
          ))}
        </CardContent>
      </Card>

      {/* 费曼总结区 */}
      <Card>
        <CardHeader>
          <CardTitle>费曼学习法：用自己的话总结</CardTitle>
          <p className="text-sm text-muted-foreground">
            请用自己的语言总结所学内容，这有助于检验你的理解程度
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!submitted && (
            <>
              <Textarea
                placeholder="请用自己的话总结这个知识点..."
                rows={8}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {summary.length < 100 
                    ? `至少需要 100 字，当前 ${summary.length} 字`
                    : `${summary.length} 字`}
                </span>
                <Button
                  onClick={handleSubmitSummary}
                  disabled={summary.length < 100}
                >
                  提交总结
                </Button>
              </div>
            </>
          )}

          {submitted && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">你的总结：</p>
                <p className="text-sm">{summary}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">AI 评估：</p>
                <StreamingText
                  content={feedback || "你的总结体现了对性能优化的基本理解，提到了关键的优化手段。建议补充一些具体的性能指标和量化方法，这样理解会更全面。"}
                  isStreaming={isStreaming}
                />
              </div>

              {!isStreaming && passed !== null && (
                <div className={`p-4 rounded-lg ${passed ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  {passed ? (
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">恭喜！你已经掌握了这个知识点</span>
                    </div>
                  ) : (
                    <div className="text-yellow-800">
                      <p className="font-medium mb-2">理解还不够深入，请继续思考：</p>
                      <p className="text-sm">
                        提示：可以尝试用更具体的例子来说明性能优化的实际应用场景
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 底部导航 */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => navigate(`/training/${id}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回蓝图
        </Button>
        {passed && (
          <Button onClick={handleNext} className="flex-1">
            下一个知识点
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
