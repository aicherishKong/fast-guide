import { Link, useNavigate } from 'react-router';
import { Home, FileText, MessageSquare, BookOpen, User, LogOut, Settings, Menu, CreditCard } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useAuth } from '../../hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { UserMenu } from './UserMenu';
import { useState } from 'react';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutDialog(false);
  };

  const navItems = [
    { to: '/dashboard', icon: Home, label: '工作台' },
    { to: '/resumes', icon: FileText, label: '简历优化' },
    { to: '/interviews', icon: MessageSquare, label: '模拟面试' },
    { to: '/training/1', icon: BookOpen, label: '知识训练' },
  ];

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
            AI
          </div>
          <span>求职助手</span>
        </Link>

        {/* 桌面端导航 */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link 
              key={to}
              to={to} 
              className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* 右侧按钮组 */}
        <div className="flex items-center gap-2">
          {/* 移动端菜单 */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>菜单</SheetTitle>
              </SheetHeader>
              
              {/* 用户信息 */}
              {user && (
                <div className="flex items-center gap-3 py-4 px-2 border-b">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* 导航链接 */}
              <nav className="flex flex-col gap-2 mt-4">
                {navItems.map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-base hover:text-blue-600 hover:bg-blue-50 transition-colors py-3 px-2 rounded-lg"
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                ))}
              </nav>

              {/* 底部操作 */}
              <div className="absolute bottom-6 left-6 right-6 space-y-2 border-t pt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/user/profile" onClick={() => setMobileMenuOpen(false)}>
                    <User className="mr-2 h-4 w-4" />
                    个人信息
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/user/settings" onClick={() => setMobileMenuOpen(false)}>
                    <Settings className="mr-2 h-4 w-4" />
                    设置
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/user/pricing" onClick={() => setMobileMenuOpen(false)}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    充值订阅
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogoutDialog(true);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* 用户菜单 */}
          {user && (
            <div className="hidden md:block">
              <UserMenu />
            </div>
          )}
        </div>
      </div>

      {/* 移动端登出确认对话框 */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认退出登录？</AlertDialogTitle>
            <AlertDialogDescription>
              退出后您需要重新登录才能访问系统功能。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
              确认退出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}