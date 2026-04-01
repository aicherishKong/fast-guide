import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Upload, MessageSquare, FileText, BookOpen, TrendingUp, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock 数据
  const stats = {
    resumes: 3,
    interviews: 5,
    trainingProgress: 65,
  };

  const recentActivities = [
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

  return (
    <div className="space-y-8">
      {/* 欢迎区 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">欢迎回来，{user?.name}！</h1>
          <p className="text-muted-foreground mt-1">继续你的求职准备之旅</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/resumes/upload')} size="lg">
            <Upload className="mr-2 h-4 w-4" />
            上传简历
          </Button>
          <Button onClick={() => navigate('/interviews/new')} variant="outline" size="lg">
            <MessageSquare className="mr-2 h-4 w-4" />
            开始面试
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">简历数量</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resumes}</div>
            <p className="text-xs text-muted-foreground">已上传简历总数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">面试次数</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviews}</div>
            <p className="text-xs text-muted-foreground">完成的模拟面试</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">训练进度</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trainingProgress}%</div>
            <p className="text-xs text-muted-foreground">当前学习计划完成度</p>
          </CardContent>
        </Card>

        {/* 升级套餐卡片 */}
        <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">当前套餐</CardTitle>
            <Crown className="h-4 w-4 text-yellow-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">免费版</div>
            <Button 
              onClick={() => navigate('/user/pricing')}
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
            >
              <Sparkles className="mr-2 h-3 w-3" />
              升级套餐
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 最近活动 */}
      <Card>
        <CardHeader>
          <CardTitle>最近活动</CardTitle>
          <CardDescription>查看你最近的学习和面试记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'interview' ? 'bg-blue-100' :
                    activity.type === 'resume' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    {activity.type === 'interview' && <MessageSquare className="h-5 w-5 text-blue-600" />}
                    {activity.type === 'resume' && <FileText className="h-5 w-5 text-green-600" />}
                    {activity.type === 'training' && <BookOpen className="h-5 w-5 text-purple-600" />}
                  </div>
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {'score' in activity && (
                    <span className="text-lg font-bold text-green-600">{activity.score}分</span>
                  )}
                  {'progress' in activity && (
                    <span className="text-sm text-muted-foreground">{activity.progress}%</span>
                  )}
                  {'action' in activity && (
                    <span className="text-sm text-green-600">{activity.action}</span>
                  )}
                  <Button variant="ghost" size="sm">查看</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速开始</CardTitle>
          <CardDescription>选择一个功能开始使用</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2" 
              onClick={() => navigate('/resumes')}
            >
              <FileText className="h-6 w-6" />
              <span>管理简历</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2"
              onClick={() => navigate('/interviews')}
            >
              <MessageSquare className="h-6 w-6" />
              <span>面试历史</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2"
              onClick={() => navigate('/training/1')}
            >
              <BookOpen className="h-6 w-6" />
              <span>继续学习</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}