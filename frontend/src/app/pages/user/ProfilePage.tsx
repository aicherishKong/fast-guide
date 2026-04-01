import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Camera, Mail, User as UserIcon, Calendar, MapPin, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '北京市',
    position: '产品经理',
    company: '某科技公司',
    bio: '热爱学习，积极进取，希望找到心仪的工作机会。',
  });

  const handleSave = () => {
    // Mock 保存逻辑
    toast.success('个人信息已保存！');
    setIsEditing(false);
  };

  const stats = [
    { label: '简历数量', value: '5', icon: '📄' },
    { label: '面试次数', value: '12', icon: '💬' },
    { label: '训练题目', value: '48', icon: '📚' },
    { label: '学习天数', value: '23', icon: '📅' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">个人信息</h1>
          <p className="text-muted-foreground mt-1">管理您的个人资料和偏好设置</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>编辑资料</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        )}
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* 头像卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>个人头像</CardTitle>
            <CardDescription>点击头像可更换照片</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative group">
              <Avatar className="h-32 w-32">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl">
                  {user?.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              支持 JPG、PNG 格式，文件大小不超过 2MB
            </p>
          </CardContent>
        </Card>

        {/* 基本信息 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>您的个人基本资料</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <UserIcon className="inline h-4 w-4 mr-1" />
                  姓名
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="inline h-4 w-4 mr-1" />
                  邮箱
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <span className="inline h-4 w-4 mr-1">📱</span>
                  手机号
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入手机号"
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  所在地
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">
                  <Briefcase className="inline h-4 w-4 mr-1" />
                  目标职位
                </Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">
                  <span className="inline h-4 w-4 mr-1">🏢</span>
                  目标公司
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">
                <span className="inline h-4 w-4 mr-1">✍️</span>
                个人简介
              </Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                rows={3}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 账户信息 */}
      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
          <CardDescription>您的账户安全和登录信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">注册时间</p>
                <p className="text-sm text-muted-foreground">2024年3月15日</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔑</span>
              <div>
                <p className="font-medium">登录密码</p>
                <p className="text-sm text-muted-foreground">••••••••</p>
              </div>
            </div>
            <Button variant="outline" size="sm">修改密码</Button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">👤</span>
              <div>
                <p className="font-medium">账户ID</p>
                <p className="text-sm text-muted-foreground font-mono">{user?.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
