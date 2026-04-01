import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Calendar, Filter, Plus } from 'lucide-react';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [modeFilter, setModeFilter] = useState('all');

  // Mock 数据
  const interviews = [
    {
      id: '1',
      date: '2026-03-30',
      mode: '简历 + JD',
      difficulty: '中等',
      overallScore: 82,
      scores: { completeness: 85, accuracy: 90, depth: 75, clarity: 80 },
    },
    {
      id: '2',
      date: '2026-03-25',
      mode: '仅 JD',
      difficulty: '困难',
      overallScore: 75,
      scores: { completeness: 78, accuracy: 82, depth: 70, clarity: 72 },
    },
    {
      id: '3',
      date: '2026-03-20',
      mode: '简历 + JD',
      difficulty: '简单',
      overallScore: 88,
      scores: { completeness: 90, accuracy: 92, depth: 85, clarity: 86 },
    },
  ];

  const filteredInterviews = modeFilter === 'all'
    ? interviews
    : interviews.filter(i => i.mode === modeFilter);

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">面试历史</h1>
          <p className="text-muted-foreground mt-1">查看你的所有面试记录</p>
        </div>
        <Button onClick={() => navigate('/interviews/new')} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          新建面试
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择模式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部模式</SelectItem>
                <SelectItem value="简历 + JD">简历 + JD</SelectItem>
                <SelectItem value="仅 JD">仅 JD</SelectItem>
                <SelectItem value="仅简历">仅简历</SelectItem>
                <SelectItem value="自由主题">自由主题</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 历史记录列表 */}
      {filteredInterviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">还没有面试记录</h3>
            <p className="text-muted-foreground mb-4">开始第一次模拟面试</p>
            <Button onClick={() => navigate('/interviews/new')}>
              <Plus className="mr-2 h-4 w-4" />
              开始面试
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>面试记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {interview.overallScore}
                      </div>
                      <div className="text-xs text-muted-foreground">总分</div>
                    </div>
                    <div className="h-12 w-px bg-gray-200" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{interview.date}</span>
                        <Badge variant="outline">{interview.mode}</Badge>
                        <Badge variant="outline">{interview.difficulty}</Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>完整性: {interview.scores.completeness}</span>
                        <span>准确性: {interview.scores.accuracy}</span>
                        <span>深度: {interview.scores.depth}</span>
                        <span>清晰度: {interview.scores.clarity}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/interviews/${interview.id}/report`)}
                  >
                    查看报告
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
