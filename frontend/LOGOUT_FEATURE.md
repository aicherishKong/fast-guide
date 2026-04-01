# 登出功能实现说明

## ✅ 功能状态

登出功能已完整实现并增强，支持桌面端和移动端双重体验。

## 🎯 实现位置

### 1. 桌面端登出
**位置**: 页面右上角用户头像菜单

**使用方式**:
1. 点击右上角的用户头像
2. 在下拉菜单中选择"退出登录"
3. 确认对话框中点击"确认退出"

**特性**:
- ✅ 用户信息展示（姓名、邮箱）
- ✅ 头像显示（支持自定义头像和首字母fallback）
- ✅ 个人信息入口
- ✅ 设置入口
- ✅ 退出登录按钮（红色高亮）
- ✅ 确认对话框防止误操作

### 2. 移动端登出
**位置**: 左侧汉堡菜单

**使用方式**:
1. 点击左上角的菜单图标（☰）
2. 侧边栏底部点击"退出登录"
3. 确认对话框中点击"确认退出"

**特性**:
- ✅ 侧边栏用户信息卡片
- ✅ 主导航链接
- ✅ 个人信息按钮
- ✅ 设置按钮
- ✅ 退出登录按钮
- ✅ 响应式设计，小于 md 断点显示

## 🔐 认证逻辑

### useAuth Hook
**文件**: `/src/app/hooks/useAuth.ts`

**功能**:
```typescript
{
  user: User | null,           // 当前用户信息
  loading: boolean,            // 加载状态
  login: (email, password),    // 登录方法
  register: (email, password, name),  // 注册方法
  logout: () => void,          // 登出方法
  isAuthenticated: boolean     // 认证状态
}
```

**登出实现**:
```typescript
const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  setUser(null);
};
```

### 路由守卫
**文件**: `/src/app/routes.tsx`

**RequireAuth 组件**:
- 检查 localStorage 中的 `auth_token`
- 未登录自动重定向到 `/login`
- 已登录正常显示内容

**PublicOnly 组件**:
- 已登录用户访问登录/注册页自动重定向到 `/dashboard`

## 🎨 UI/UX 设计

### 1. 确认对话框
使用 AlertDialog 组件提供二次确认：

**标题**: "确认退出登录？"
**描述**: "退出后您需要重新登录才能访问系统功能。"
**操作**: 
- 取消按钮（默认）
- 确认退出按钮（红色，危险操作提示）

### 2. 视觉反馈
- 退出登录按钮使用红色文字 (`text-red-600`)
- 悬停时红色背景高亮 (`focus:bg-red-50`)
- 确认按钮使用红色背景 (`bg-red-600`)

### 3. 响应式适配
- **桌面端** (≥ md): 显示下拉菜单，隐藏汉堡菜单
- **移动端** (< md): 显示汉堡菜单，隐藏桌面导航

## 📱 移动端侧边栏布局

```
┌─────────────────────┐
│ 菜单                │
├─────────────────────┤
│ [头像] 用户名       │
│        邮箱         │
├─────────────────────┤
│ 🏠 工作台           │
│ 📄 简历优化         │
│ 💬 模拟面试         │
│ 📚 知识训练         │
├─────────────────────┤
│                     │
│                     │
│ (底部固定)          │
├─────────────────────┤
│ 👤 个人信息         │
│ ⚙️  设置            │
│ 🚪 退出登录 (红色)  │
└─────────────────────┘
```

## 🔄 登出流程

1. **点击退出登录**
   - 触发 `setShowLogoutDialog(true)`
   - 显示确认对话框

2. **确认退出**
   - 调用 `logout()` 清除认证信息
   - 清除 `localStorage` 中的 `auth_token` 和 `user`
   - 设置 `user` 状态为 `null`
   - 使用 `navigate('/login')` 跳转到登录页

3. **路由守卫拦截**
   - RequireAuth 检测到无 token
   - 自动重定向到登录页（双重保护）

## 🛡️ 安全考虑

- ✅ 二次确认防止误操作
- ✅ 清除本地存储的所有认证信息
- ✅ 路由守卫确保登出后无法访问受保护页面
- ✅ 登出后自动跳转到登录页

## 🔧 技术实现

### 使用的组件
- `DropdownMenu` - 桌面端用户菜单
- `Sheet` - 移动端侧边栏
- `AlertDialog` - 确认对话框
- `Avatar` - 用户头像
- `Button` - 各种按钮

### 状态管理
```typescript
const [showLogoutDialog, setShowLogoutDialog] = useState(false);
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
```

### 导航数据
```typescript
const navItems = [
  { to: '/dashboard', icon: Home, label: '工作台' },
  { to: '/resumes', icon: FileText, label: '简历优化' },
  { to: '/interviews', icon: MessageSquare, label: '模拟面试' },
  { to: '/training/1', icon: BookOpen, label: '知识训练' },
];
```

## 📝 使用示例

### 在其他组件中使用 useAuth

```typescript
import { useAuth } from '../../hooks/useAuth';

function MyComponent() {
  const { user, logout, isAuthenticated } = useAuth();

  const handleCustomLogout = () => {
    if (confirm('确定要退出吗？')) {
      logout();
      // 自定义逻辑
    }
  };

  return (
    <div>
      {isAuthenticated && (
        <p>欢迎, {user?.name}!</p>
      )}
    </div>
  );
}
```

## 🎉 功能清单

- ✅ 桌面端下拉菜单登出
- ✅ 移动端侧边栏登出
- ✅ 登出确认对话框
- ✅ 清除认证信息
- ✅ 自动跳转到登录页
- ✅ 路由守卫保护
- ✅ 用户信息展示
- ✅ 个人信息入口
- ✅ 设置入口
- ✅ 响应式设计
- ✅ 视觉反馈优化
- ✅ 误操作防护

## 🚀 下一步建议

1. **添加个人信息页面** - 点击"个人信息"跳转到用户资料页
2. **添加设置页面** - 点击"设置"跳转到系统设置页
3. **会话过期处理** - 添加 token 过期自动登出
4. **登出前保存草稿** - 在登出前提醒保存未提交的内容
5. **登出日志** - 记录登出时间和设备信息
