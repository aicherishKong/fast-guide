import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Plus, Search, FileText, Clock, Star, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export default function LibraryPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock 数据
  const resumes = [
    {
      id: '1',
      name: 'React前端开发_张三.pdf',
      uploadDate: '2026-03-28',
      lastScore: 85,
      status: 'completed' as const,
    },
    {
      id: '2',
      name: '全栈工程师简历.docx',
      uploadDate: '2026-03-25',
      lastScore: 72,
      status: 'completed' as const,
    },
    {
      id: '3',
      name: '产品经理简历.pdf',
      uploadDate: '2026-03-20',
      lastScore: null,
      status: 'analyzing' as const,
    },
  ];

  const filteredResumes = resumes.filter(resume =>
    resume.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">简历库</h1>
          <p className="text-muted-foreground mt-1">管理和优化你的简历</p>
        </div>
        <Button onClick={() => navigate('/resumes/upload')} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          上传新简历
        </Button>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索简历..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 简历卡片网格 */}
      {filteredResumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">还没有简历</h3>
            <p className="text-muted-foreground mb-4">上传第一份简历开始优化</p>
            <Button onClick={() => navigate('/resumes/upload')}>
              <Plus className="mr-2 h-4 w-4" />
              上传简历
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResumes.map((resume) => (
            <Card key={resume.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-blue-600" />
                  {resume.status === 'analyzing' ? (
                    <Badge variant="secondary">分析中</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      已完成
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base mt-4 line-clamp-2">{resume.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {resume.uploadDate}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resume.lastScore !== null && (
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm">最近评分：</span>
                    <span className="font-bold text-lg">{resume.lastScore}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/resumes/${resume.id}`)}
                  >
                    查看
                  </Button>
                  {resume.status === 'completed' && (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/resumes/${resume.id}/optimize`)}
                    >
                      优化
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
