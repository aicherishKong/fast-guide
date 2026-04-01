import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ScoreRing } from '../../components/common/ScoreRing';
import { RadarChart } from '../../components/common/RadarChart';
import { Calendar, Target, TrendingUp, TrendingDown, RotateCcw, Home, BookOpen } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock 数据
  const report = {
    date: '2026-03-30',
    mode: '简历 + JD',
    difficulty: '中等',
    questionCount: 5,
    overallScore: 82,
    recommendation: '推荐',
  };

  const radarData = [
    { dimension: '完整性', score: 85 },
    { dimension: '准确性', score: 90 },
    { dimension: '深度', score: 75 },
    { dimension: '清晰度', score: 80 },
  ];

  const strengths = [
    '基础知识扎实，对 React 核心概念理解透彻',
    '实践经验丰富，能结合项目场景作答',
    '表达清晰，逻辑性强',
  ];

  const weaknesses = [
    '对底层原理的理解有待深入',
    '性能优化方面的实践案例较少',
    '部分回答缺少量化数据支撑',
  ];

  const questionReviews = [
    {
      id: '1',
      question: '请详细介绍一下 React Hooks 的工作原理，以及它解决了什么问题？',
      answer: '我的回答是...',
      score: 85,
      feedback: '回答全面，正确说明了 Hooks 的核心价值...',
    },
    {
      id: '2',
      question: '在你的项目中，如何进行性能优化？请结合具体案例说明。',
      answer: '在我负责的项目中...',
      score: 78,
      feedback: '提供了具体案例，但可以补充更多量化指标...',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 报告头部 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>面试报告</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {report.date}
                </span>
                <Badge variant="outline">{report.mode}</Badge>
                <Badge variant="outline">{report.difficulty}</Badge>
                <span>{report.questionCount} 题</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 综合评分 */}
      <Card>
        <CardHeader>
          <CardTitle>综合评分</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center justify-center">
              <ScoreRing score={report.overallScore} size={200} strokeWidth={12} />
              <Badge className="mt-4 bg-green-100 text-green-800 border-green-300">
                {report.recommendation}
              </Badge>
            </div>
            <div className="flex items-center">
              <RadarChart data={radarData} className="w-full h-64" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 优势与短板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              优势亮点
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Badge className="mt-0.5 bg-green-100 text-green-800 border-green-300">
                    {idx + 1}
                  </Badge>
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              关键短板
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {weaknesses.map((weakness, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Badge className="mt-0.5 bg-red-100 text-red-800 border-red-300">
                    {idx + 1}
                  </Badge>
                  <span className="text-sm">{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 逐题回顾 */}
      <Card>
        <CardHeader>
          <CardTitle>逐题回顾</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {questionReviews.map((review, idx) => (
            <Collapsible key={review.id}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 text-left">
                    <Badge variant="outline">Q{idx + 1}</Badge>
                    <span className="font-medium line-clamp-1">{review.question}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">{review.score}</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 border-x border-b rounded-b-lg space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">我的回答</h4>
                    <p className="text-sm bg-gray-50 p-3 rounded">{review.answer}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">AI 反馈</h4>
                    <p className="text-sm">{review.feedback}</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      {/* 行动建议 */}
      <Card>
        <CardHeader>
          <CardTitle>行动建议</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              学习优先方向
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>深入学习浏览器工作原理和性能优化</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>补充数据结构与算法基础</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>积累更多实战项目经验</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" size="lg" onClick={() => navigate('/training/1')}>
              <BookOpen className="mr-2 h-4 w-4" />
              生成训练计划
            </Button>
            <Button variant="outline" className="flex-1" size="lg" onClick={() => navigate('/interviews/new')}>
              <RotateCcw className="mr-2 h-4 w-4" />
              再来一次
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/dashboard')}>
              <Home className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
