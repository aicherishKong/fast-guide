import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { QuestionCard } from '../../components/interview/QuestionCard';
import { RubricScore } from '../../components/interview/RubricScore';
import { StreamingText } from '../../components/common/StreamingText';
import { useSSE } from '../../hooks/useSSE';
import { X, ArrowRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

export default function SessionPage() {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const { content: feedback, isStreaming, startStreaming } = useSSE();

  // Mock 数据
  const session = {
    totalQuestions: 5,
    difficulty: 'medium' as const,
  };

  const questions = [
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
  ];

  const mockScores = {
    completeness: 85,
    accuracy: 90,
    depth: 75,
    clarity: 88,
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / session.totalQuestions) * 100;

  const handleSubmit = () => {
    if (!answer.trim()) return;

    setSubmitted(true);
    startStreaming('/api/interview/evaluate', {
      onDone: () => {
        // 评分完成
      },
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setAnswer('');
      setSubmitted(false);
    } else {
      // 面试结束
      navigate('/interviews/1/report');
    }
  };

  const handleExit = () => {
    setShowExitDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部进度条 */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="font-medium">
                第 {currentQuestionIndex + 1} 题 / 共 {session.totalQuestions} 题
              </span>
              <Badge variant="outline">
                {session.difficulty === 'easy' && '简单'}
                {session.difficulty === 'medium' && '中等'}
                {session.difficulty === 'hard' && '困难'}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleExit}>
              <X className="h-4 w-4 mr-1" />
              结束面试
            </Button>
          </div>
          <Progress value={progress} />
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* 题目卡片 */}
        <QuestionCard
          question={currentQuestion.text}
          type={currentQuestion.type}
          suggestedTime={currentQuestion.suggestedTime}
        />

        {/* 回答区 */}
        {!submitted && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-medium">你的回答</label>
                <span className="text-sm text-muted-foreground">{answer.length} 字</span>
              </div>
              <Textarea
                placeholder="请输入你的回答..."
                rows={8}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <Button onClick={handleSubmit} disabled={!answer.trim()} className="w-full">
                提交答案
              </Button>
            </div>
          </Card>
        )}

        {/* 评分反馈区 */}
        {submitted && (
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="font-medium mb-3">AI 评分反馈</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <StreamingText 
                  content={feedback || "你的回答展示了对 React Hooks 的良好理解。你正确地指出了 Hooks 解决了类组件中逻辑复用困难的问题，并且提到了 useState 和 useEffect 的基本用法。不过，可以进一步深入探讨 Hooks 的闭包陷阱和依赖管理等高级话题。"}
                  isStreaming={isStreaming}
                />
              </div>
            </div>

            {!isStreaming && (
              <>
                <div>
                  <h3 className="font-medium mb-3">评分详情</h3>
                  <RubricScore scores={mockScores} />
                </div>

                <div>
                  <h3 className="font-medium mb-3">改进建议</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>可以补充说明 useEffect 的清理函数机制</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>建议结合具体代码示例说明 Hooks 的使用场景</span>
                    </li>
                  </ul>
                </div>

                <Button onClick={handleNext} className="w-full" size="lg">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <>
                      下一题
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    '查看面试报告'
                  )}
                </Button>
              </>
            )}
          </Card>
        )}
      </div>

      {/* 退出确认对话框 */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要结束面试吗？</AlertDialogTitle>
            <AlertDialogDescription>
              当前进度将会保存，你可以稍后继续。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>继续面试</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/interviews/1/report')}>
              结束面试
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
