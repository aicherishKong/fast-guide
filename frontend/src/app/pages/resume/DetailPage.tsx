import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { FileText, Calendar, HardDrive, MessageSquare, TrendingUp, Clock } from 'lucide-react';

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock 数据
  const resume = {
    id,
    name: 'React前端开发_张三.pdf',
    uploadDate: '2026-03-28',
    fileSize: '2.3 MB',
  };

  const optimizationHistory = [
    {
      id: '1',
      jdSummary: '阿里巴巴 - 高级前端工程师',
      score: 85,
      date: '2026-03-30',
    },
    {
      id: '2',
      jdSummary: '字节跳动 - React 开发工程师',
      score: 78,
      date: '2026-03-29',
    },
    {
      id: '3',
      jdSummary: '腾讯 - 前端开发（社交产品）',
      score: 82,
      date: '2026-03-28',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="cursor-pointer hover:text-foreground" onClick={() => navigate('/resumes')}>
          简历库
        </span>
        <span>/</span>
        <span>{resume.name}</span>
      </div>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>{resume.name}</CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {resume.uploadDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {resume.fileSize}
                  </span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              已完成
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* 关联操作区 */}
      <Card>
        <CardHeader>
          <CardTitle>��速操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 针对新JD优化 */}
          <div className="flex gap-2">
            <Input placeholder="输入新的职位描述或 JD 链接..." className="flex-1" />
            <Button onClick={() => navigate(`/resumes/${id}/optimize`)}>
              <TrendingUp className="mr-2 h-4 w-4" />
              优化
            </Button>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate(`/resumes/${id}/optimize`)}
            >
              查看最近分析报告
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/interviews/new', { state: { resumeId: id } })}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              基于此简历开始面试
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 历史优化记录 */}
      <Card>
        <CardHeader>
          <CardTitle>优化记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {optimizationHistory.map((record) => (
              <div 
                key={record.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{record.jdSummary}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {record.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">综合评分</p>
                    <p className="text-lg font-bold text-green-600">{record.score}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/resumes/${id}/optimize`)}
                  >
                    查看详情
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
