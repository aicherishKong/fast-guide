import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { TrendingUp, TrendingDown, ArrowLeft, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RetestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [completed, setCompleted] = useState(false);

  // Mock 数据
  const questions = [
    {
      id: '1',
      topic: 'React Hooks 深入原理',
      question: '请解释 useEffect 的依赖数组工作原理',
    },
    {
      id: '2',
      topic: '浏览器事件循环',
      question: '说明宏任务和微任务的执行顺序',
    },
    {
      id: '3',
      topic: '性能优化最佳实践',
      question: '列举三种常见的性能优化方法',
    },
  ];

  const results = [
    {
      topic: 'React Hooks 深入原理',
      beforeScore: 60,
      afterScore: 85,
      mastery: '已掌握' as const,
    },
    {
      topic: '浏览器事件循环',
      beforeScore: 55,
      afterScore: 78,
      mastery: '部分掌握' as const,
    },
    {
      topic: '性能优化最佳实践',
      beforeScore: 50,
      afterScore: 88,
      mastery: '已掌握' as const,
    },
  ];

  const progressData = [
    { name: '学前', score: 55 },
    { name: '学后', score: 84 },
  ];

  const handleSubmit = () => {
    setAnswers([...answers, answer]);
    setAnswer('');

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setCompleted(true);
    }
  };

  if (completed) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="cursor-pointer hover:text-foreground" onClick={() => navigate(`/training/${id}`)}>
            训练计划
          </span>
          <span>/</span>
          <span>复测结果</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>复测完成</CardTitle>
            <p className="text-sm text-muted-foreground">
              太棒了！你的学习成果显著
            </p>
          </CardHeader>
        </Card>

        {/* 知识点对比 */}
        <Card>
          <CardHeader>
            <CardTitle>学习效果对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.topic}</span>
                    <Badge
                      variant={
                        result.mastery === '已掌握'
                          ? 'default'
                          : result.mastery === '部分掌握'
                          ? 'secondary'
                          : 'outline'
                      }
                      className={
                        result.mastery === '已掌握'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : ''
                      }
                    >
                      {result.mastery}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">学习前</span>
                        <span>{result.beforeScore}</span>
                      </div>
                      <Progress value={result.beforeScore} className="h-2" />
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">学习后</span>
                        <span className="font-bold text-green-600">{result.afterScore}</span>
                      </div>
                      <Progress value={result.afterScore} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 进步曲线 */}
        <Card>
          <CardHeader>
            <CardTitle>进步曲线</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 操作区 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/training/${id}`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回蓝图
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate(`/training/${id}`)}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                继续学习薄弱项
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="cursor-pointer hover:text-foreground" onClick={() => navigate(`/training/${id}`)}>
          训练计划
        </span>
        <span>/</span>
        <span>复测</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>知识复测</CardTitle>
            <Badge variant="outline">
              第 {currentQuestion + 1} 题 / 共 {questions.length} 题
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Progress value={((currentQuestion + 1) / questions.length) * 100} />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            检验你对所学知识点的掌握程度
          </p>
        </CardContent>
      </Card>

      {/* 题目区 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{questions[currentQuestion].topic}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-lg">{questions[currentQuestion].question}</p>
          </div>

          <div className="space-y-2">
            <label className="font-medium">你的回答</label>
            <Textarea
              placeholder="请输入你的答案..."
              rows={6}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!answer.trim()}
            className="w-full"
            size="lg"
          >
            {currentQuestion < questions.length - 1 ? '提交并继续' : '提交并查看结果'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
