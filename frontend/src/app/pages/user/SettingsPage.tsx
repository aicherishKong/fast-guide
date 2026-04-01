import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { Bell, Moon, Globe, Zap, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReport: true,
    achievementAlerts: true,
    darkMode: false,
    language: 'zh-CN',
    autoSave: true,
    aiSuggestions: true,
  });

  const handleSave = () => {
    toast.success('设置已保存！');
  };

  const handleReset = () => {
    if (confirm('确定要重置所有设置为默认值吗？')) {
      setSettings({
        emailNotifications: true,
        pushNotifications: false,
        weeklyReport: true,
        achievementAlerts: true,
        darkMode: false,
        language: 'zh-CN',
        autoSave: true,
        aiSuggestions: true,
      });
      toast.success('设置已重置为默认值');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">系统设置</h1>
        <p className="text-muted-foreground mt-1">管理您的偏好设置和通知选项</p>
      </div>

      {/* 通知设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知设置
          </CardTitle>
          <CardDescription>管理您接收通知的方式</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">邮件通知</Label>
              <p className="text-sm text-muted-foreground">
                接收重要更新和系统消息的邮件通知
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">推送通知</Label>
              <p className="text-sm text-muted-foreground">
                在浏览器中接收实时推送通知
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, pushNotifications: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-report">每周报告</Label>
              <p className="text-sm text-muted-foreground">
                每周一收到学习进度和成就总结
              </p>
            </div>
            <Switch
              id="weekly-report"
              checked={settings.weeklyReport}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, weeklyReport: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="achievement-alerts">成就提醒</Label>
              <p className="text-sm text-muted-foreground">
                解锁新成就时收到通知
              </p>
            </div>
            <Switch
              id="achievement-alerts"
              checked={settings.achievementAlerts}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, achievementAlerts: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 外观设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            外观设置
          </CardTitle>
          <CardDescription>自定义界面外观和显示选项</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">深色模式</Label>
              <p className="text-sm text-muted-foreground">
                启用深色主题以减少眼睛疲劳
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={settings.darkMode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, darkMode: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="language" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              语言设置
            </Label>
            <select
              id="language"
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁體中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 功能设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            功能设置
          </CardTitle>
          <CardDescription>管理应用功能和智能辅助选项</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-save">自动保存</Label>
              <p className="text-sm text-muted-foreground">
                编辑内容时自动保存草稿
              </p>
            </div>
            <Switch
              id="auto-save"
              checked={settings.autoSave}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoSave: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-suggestions">AI 智能建议</Label>
              <p className="text-sm text-muted-foreground">
                在编辑时显示 AI 优化建议
              </p>
            </div>
            <Switch
              id="ai-suggestions"
              checked={settings.aiSuggestions}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, aiSuggestions: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 隐私与安全 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            隐私与安全
          </CardTitle>
          <CardDescription>管理您的数据和隐私设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">数据导出</p>
              <p className="text-sm text-muted-foreground">下载您的所有数据副本</p>
            </div>
            <Button variant="outline" size="sm">导出数据</Button>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">清除缓存</p>
              <p className="text-sm text-muted-foreground">清除本地存储的临时数据</p>
            </div>
            <Button variant="outline" size="sm">清除缓存</Button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-red-600">删除账户</p>
              <p className="text-sm text-muted-foreground">永久删除您的账户和所有数据</p>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              删除账户
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleReset}>
          重置为默认
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">取消</Button>
          <Button onClick={handleSave}>保存设置</Button>
        </div>
      </div>
    </div>
  );
}
