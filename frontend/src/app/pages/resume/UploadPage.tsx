import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { FileUploadCard } from '../../components/common/FileUploadCard';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';

export default function UploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jd, setJd] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('请先选择文件');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // 模拟上传进度
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // 模拟上传延迟
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      toast.success('上传成功，正在分析简历...');
      
      // 跳转到简历详情页
      setTimeout(() => {
        navigate('/resumes/1');
      }, 1000);
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="cursor-pointer hover:text-foreground" onClick={() => navigate('/resumes')}>
          简历库
        </span>
        <span>/</span>
        <span>上传简历</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold">上传简历</h1>
        <p className="text-muted-foreground mt-1">上传你的简历，AI 将为你提供专业的分析和优化建议</p>
      </div>

      {/* 文件上传区 */}
      <Card>
        <CardHeader>
          <CardTitle>选择简历文件</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploadCard onFileSelect={handleFileSelect} />
        </CardContent>
      </Card>

      {/* JD 输入区 */}
      <Card>
        <CardHeader>
          <CardTitle>目标职位描述（可选）</CardTitle>
          <p className="text-sm text-muted-foreground">
            提供 JD 可以让 AI 更精准地分析简历与职位的匹配度
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="jd">职位描述</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {jd.length} / 5000 字
                </span>
                {jd.length > 5000 && (
                  <span className="text-xs text-red-600">超出限制</span>
                )}
              </div>
            </div>
            <Textarea
              id="jd"
              placeholder="粘贴职位描述内容..."
              rows={8}
              value={jd}
              onChange={(e) => setJd(e.target.value.slice(0, 5000))}
            />
          </div>
          <Button variant="link" className="p-0 h-auto" onClick={() => setJd('')}>
            跳过 JD
          </Button>
        </CardContent>
      </Card>

      {/* 上传进度 */}
      {uploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>上传中...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 确认按钮 */}
      <div className="flex gap-3">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          size="lg"
          className="flex-1"
        >
          {uploading ? '上传中...' : '上传并分析'}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/resumes')}
          disabled={uploading}
          size="lg"
        >
          取消
        </Button>
      </div>
    </div>
  );
}
