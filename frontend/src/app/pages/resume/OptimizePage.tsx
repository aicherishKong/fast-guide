import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScoreRing } from '../../components/common/ScoreRing';
import { ScorePanel } from '../../components/resume/ScorePanel';
import { KeywordBadge } from '../../components/resume/KeywordBadge';
import { DiffViewer } from '../../components/common/DiffViewer';
import { StreamingText } from '../../components/common/StreamingText';
import { useSSE } from '../../hooks/useSSE';
import { Sparkles, Check, X, Download, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OptimizePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { content: rewriteContent, isStreaming, startStreaming } = useSSE();
  const [hasRewrite, setHasRewrite] = useState(false);

  // Mock 数据
  const analysisData = {
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
        priority: 'high',
        title: '补充微前端相关经验',
        description: 'JD 中明确要求微前端架构经验，建议在项目经历中补充相关描述',
      },
      {
        priority: 'medium',
        title: '量化项目成果',
        description: '多个项目缺少具体的数据支撑，建议补充性能提升、用户增长等量化指标',
      },
      {
        priority: 'medium',
        title: '突出技术深度',
        description: '可以增加对 React 源码理解、性能优化实践等深度技术的描述',
      },
    ],
  };

  const originalResume = `个人简历

张三 | 前端工程师
邮箱：zhangsan@example.com | 电话：138****8888

工作经历：
2023-至今  字节跳动 - 前端工程师
负责公司内部管理系统的开发和维护
使用 React、TypeScript 进行开发

技能：
熟悉 React、Vue 等前端框架
了解 Webpack 构建工具`;

  const rewrittenResume = `个人简历

张三 | 高级前端工程师
邮箱：zhangsan@example.com | 电话：138****8888 | GitHub: github.com/zhangsan

工作经历：
2023-至今  字节跳动 - 高级前端工程师
• 负责公司核心业务管理系统的架构设计与开发，支撑 10000+ DAU
• 采用 React 18 + TypeScript 构建高性能单页应用，首屏加载时间优化 40%
• 搭建基于 Webpack 5 的前端工程化体系，构建速度提升 60%
• 推动团队代码规范建设，引入 ESLint + Prettier，代码质量显著提升

技术栈：
• 前端框架：React、Vue 3、微前端（qiankun）
• 构建工具：Webpack 5、Vite
• 性能优化：代码分割、懒加载、CDN 加速、性能监控`;

  const handleRewrite = () => {
    setHasRewrite(true);
    startStreaming('/api/resume/rewrite', {
      onDone: () => {
        toast.success('改写完成！');
      },
    });
  };

  const handleAccept = () => {
    toast.success('已接受改写版本');
    navigate(`/resumes/${id}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="cursor-pointer hover:text-foreground" onClick={() => navigate('/resumes')}>
          简历库
        </span>
        <span>/</span>
        <span className="cursor-pointer hover:text-foreground" onClick={() => navigate(`/resumes/${id}`)}>
          React前端开发_张三.pdf
        </span>
        <span>/</span>
        <span>优化分析</span>
      </div>

      {/* 综合评分区 */}
      <Card>
        <CardHeader>
          <CardTitle>综合评分</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex justify-center">
              <ScoreRing score={analysisData.overallScore} size={200} strokeWidth={12} />
            </div>
            <div className="flex items-center">
              <ScorePanel scores={analysisData.dimensions} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 关键词对比区 */}
      <Card>
        <CardHeader>
          <CardTitle>关键词匹配分析</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-green-700">已命中关键词</h4>
            <div className="flex flex-wrap gap-2">
              {analysisData.hitKeywords.map((keyword) => (
                <KeywordBadge key={keyword} keyword={keyword} type="hit" />
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2 text-red-700 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              缺失关键词（点击查看上下文）
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysisData.missingKeywords.map((keyword) => (
                <KeywordBadge 
                  key={keyword} 
                  keyword={keyword} 
                  type="missing"
                  onClick={() => toast.info(`建议在项目经历或技能描述中补充 "${keyword}" 相关内容`)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 改进建议区 */}
      <Card>
        <CardHeader>
          <CardTitle>改进建议</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysisData.suggestions.map((suggestion, idx) => (
              <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                suggestion.priority === 'high' 
                  ? 'bg-red-50 border-red-500' 
                  : 'bg-yellow-50 border-yellow-500'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{suggestion.title}</h4>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    suggestion.priority === 'high'
                      ? 'bg-red-200 text-red-800'
                      : 'bg-yellow-200 text-yellow-800'
                  }`}>
                    {suggestion.priority === 'high' ? '高优先级' : '中优先级'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 改写操作区 */}
      <Card>
        <CardHeader>
          <CardTitle>AI 智能改写</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasRewrite && !isStreaming && (
            <Button onClick={handleRewrite} size="lg" className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              一键智能改写
            </Button>
          )}

          {isStreaming && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm text-muted-foreground mb-2">正在为你改写简历...</p>
              <StreamingText content={rewriteContent} isStreaming={isStreaming} />
            </div>
          )}

          {hasRewrite && !isStreaming && (
            <Tabs defaultValue="diff">
              <TabsList>
                <TabsTrigger value="diff">对比视图</TabsTrigger>
                <TabsTrigger value="original">原文</TabsTrigger>
                <TabsTrigger value="rewritten">改写版</TabsTrigger>
              </TabsList>

              <TabsContent value="diff">
                <DiffViewer original={originalResume} modified={rewrittenResume} />
              </TabsContent>

              <TabsContent value="original">
                <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{originalResume}</pre>
                </div>
              </TabsContent>

              <TabsContent value="rewritten">
                <div className="border rounded-lg p-4 bg-green-50 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{rewrittenResume}</pre>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* 决策操作区 */}
      {hasRewrite && !isStreaming && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Button onClick={handleAccept} size="lg" className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                接受改写
              </Button>
              <Button variant="outline" size="lg" className="flex-1">
                手动编辑
              </Button>
              <Button variant="outline" size="lg" className="flex-1">
                <X className="mr-2 h-4 w-4" />
                拒绝
              </Button>
            </div>
            <div className="flex gap-3 mt-3">
              <Button variant="outline" size="lg" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                导出 PDF
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="flex-1"
                onClick={() => navigate('/interviews/new', { state: { resumeId: id } })}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                基于改写版开始面试
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
