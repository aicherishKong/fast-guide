import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Slider } from '../../components/ui/slider';
import { FileText, Briefcase, User, Sparkles, MessageSquare, Mic } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfigPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('resume-jd');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState([5]);
  const [inputMode, setInputMode] = useState('text');
  const [jd, setJd] = useState('');

  const handleStart = () => {
    if (mode !== 'free' && !jd.trim()) {
      toast.error('请输入职位描述');
      return;
    }

    toast.success('面试配置完成，正在准备题目...');
    
    // 模拟创建面试会话
    setTimeout(() => {
      navigate('/interviews/1/session');
    }, 1500);
  };

  const estimatedTime = questionCount[0] * 3; // 每题约3分钟

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">配置面试</h1>
        <p className="text-muted-foreground mt-1">设置你的模拟面试参数</p>
      </div>

      {/* 面试模式选择 */}
      <Card>
        <CardHeader>
          <CardTitle>面试模式</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={mode} onValueChange={setMode}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label htmlFor="resume-jd" className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                mode === 'resume-jd' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
              }`}>
                <RadioGroupItem value="resume-jd" id="resume-jd" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="h-4 w-4" />
                    <span className="font-medium">简历 + JD</span>
                  </div>
                  <p className="text-sm text-muted-foreground">结合简历和职位描述出题</p>
                </div>
              </label>

              <label htmlFor="jd-only" className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                mode === 'jd-only' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
              }`}>
                <RadioGroupItem value="jd-only" id="jd-only" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">仅 JD</span>
                  </div>
                  <p className="text-sm text-muted-foreground">基于职位描述出题</p>
                </div>
              </label>

              <label htmlFor="resume-only" className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                mode === 'resume-only' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
              }`}>
                <RadioGroupItem value="resume-only" id="resume-only" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4" />
                    <span className="font-medium">仅简历</span>
                  </div>
                  <p className="text-sm text-muted-foreground">根据简历内容出题</p>
                </div>
              </label>

              <label htmlFor="free" className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                mode === 'free' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
              }`}>
                <RadioGroupItem value="free" id="free" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium">自由主题</span>
                  </div>
                  <p className="text-sm text-muted-foreground">自定义面试主题</p>
                </div>
              </label>
            </div>
          </RadioGroup>

          {/* JD 输入 */}
          {mode !== 'free' && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="jd">职位描述</Label>
              <Textarea
                id="jd"
                placeholder="粘贴职位描述..."
                rows={6}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 难度配置 */}
      <Card>
        <CardHeader>
          <CardTitle>难度设置</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={difficulty} onValueChange={setDifficulty}>
            <div className="space-y-3">
              <label htmlFor="easy" className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                difficulty === 'easy' ? 'border-blue-500 bg-blue-50' : ''
              }`}>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="easy" id="easy" />
                  <div>
                    <span className="font-medium">简单</span>
                    <p className="text-sm text-muted-foreground">基础概念，适合入门</p>
                  </div>
                </div>
              </label>

              <label htmlFor="medium" className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                difficulty === 'medium' ? 'border-blue-500 bg-blue-50' : ''
              }`}>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="medium" id="medium" />
                  <div>
                    <span className="font-medium">中等</span>
                    <p className="text-sm text-muted-foreground">实际应用，适合1-3年经验</p>
                  </div>
                </div>
              </label>

              <label htmlFor="hard" className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                difficulty === 'hard' ? 'border-blue-500 bg-blue-50' : ''
              }`}>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="hard" id="hard" />
                  <div>
                    <span className="font-medium">困难</span>
                    <p className="text-sm text-muted-foreground">深度原理，适合高级岗位</p>
                  </div>
                </div>
              </label>

              <label htmlFor="adaptive" className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                difficulty === 'adaptive' ? 'border-blue-500 bg-blue-50' : ''
              }`}>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="adaptive" id="adaptive" />
                  <div>
                    <span className="font-medium">自适应</span>
                    <p className="text-sm text-muted-foreground">根据作答表现动态调整</p>
                  </div>
                </div>
              </label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 题数配置 */}
      <Card>
        <CardHeader>
          <CardTitle>题目数量</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{questionCount[0]} 题</span>
            <span className="text-sm text-muted-foreground">预估时长: {estimatedTime} 分钟</span>
          </div>
          <Slider
            value={questionCount}
            onValueChange={setQuestionCount}
            min={3}
            max={10}
            step={1}
          />
          <div className="flex gap-2">
            {[3, 5, 8, 10].map((count) => (
              <Button
                key={count}
                variant={questionCount[0] === count ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuestionCount([count])}
              >
                {count}题
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 输入模式 */}
      <Card>
        <CardHeader>
          <CardTitle>回答方式</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={inputMode} onValueChange={setInputMode}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label htmlFor="text" className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer ${
                inputMode === 'text' ? 'border-blue-500 bg-blue-50' : ''
              }`}>
                <RadioGroupItem value="text" id="text" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium">文字模式</span>
                  </div>
                  <p className="text-sm text-muted-foreground">键盘输入回答</p>
                </div>
              </label>

              <label htmlFor="voice" className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer ${
                inputMode === 'voice' ? 'border-blue-500 bg-blue-50' : ''
              }`}>
                <RadioGroupItem value="voice" id="voice" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Mic className="h-4 w-4" />
                    <span className="font-medium">语音模式</span>
                  </div>
                  <p className="text-sm text-muted-foreground">语音回答（需麦克风权限）</p>
                </div>
              </label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 开始按钮 */}
      <Button onClick={handleStart} size="lg" className="w-full">
        开始面试
      </Button>
    </div>
  );
}
