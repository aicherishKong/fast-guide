import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { User, LogOut, Settings, CreditCard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
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

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutDialog(false);
  };

  if (!user) return null;

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* 用户头像按钮 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="用户菜单"
        >
          <Avatar>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {user.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>

        {/* 下拉菜单 */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="py-1">
              {/* 用户信息 */}
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>

              {/* 菜单项 */}
              <Link
                to="/user/profile"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <User className="mr-3 h-4 w-4 text-gray-400" />
                个人信息
              </Link>

              <Link
                to="/user/settings"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="mr-3 h-4 w-4 text-gray-400" />
                设置
              </Link>

              <Link
                to="/user/pricing"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <CreditCard className="mr-3 h-4 w-4 text-gray-400" />
                充值订阅
              </Link>

              <div className="border-t my-1" />

              {/* 退出登录 */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowLogoutDialog(true);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4" />
                退出登录
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 登出确认对话框 */}
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
    </>
  );
}