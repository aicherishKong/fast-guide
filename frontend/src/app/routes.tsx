import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import LibraryPage from './pages/resume/LibraryPage';
import UploadPage from './pages/resume/UploadPage';
import DetailPage from './pages/resume/DetailPage';
import OptimizePage from './pages/resume/OptimizePage';
import ConfigPage from './pages/interview/ConfigPage';
import SessionPage from './pages/interview/SessionPage';
import ReportPage from './pages/interview/ReportPage';
import HistoryPage from './pages/interview/HistoryPage';
import PlanPage from './pages/training/PlanPage';
import ItemPage from './pages/training/ItemPage';
import RetestPage from './pages/training/RetestPage';
import KnowledgeGraphDemo from './pages/demo/KnowledgeGraphDemo';
import ProfilePage from './pages/user/ProfilePage';
import SettingsPage from './pages/user/SettingsPage';
import PricingPage from './pages/user/PricingPage';

// 路由守卫组件
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// 已登录用户访问登录页重定向
function PublicOnly({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: (
      <PublicOnly>
        <LoginPage />
      </PublicOnly>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnly>
        <RegisterPage />
      </PublicOnly>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'resumes',
        element: <LibraryPage />,
      },
      {
        path: 'resumes/upload',
        element: <UploadPage />,
      },
      {
        path: 'resumes/:id',
        element: <DetailPage />,
      },
      {
        path: 'resumes/:id/optimize',
        element: <OptimizePage />,
      },
      {
        path: 'interviews',
        element: <HistoryPage />,
      },
      {
        path: 'interviews/new',
        element: <ConfigPage />,
      },
      {
        path: 'interviews/:id/report',
        element: <ReportPage />,
      },
      {
        path: 'training/:id',
        element: <PlanPage />,
      },
      {
        path: 'training/:id/items/:item_id',
        element: <ItemPage />,
      },
      {
        path: 'training/:id/retest',
        element: <RetestPage />,
      },
      {
        path: 'demo/knowledge-graph',
        element: <KnowledgeGraphDemo />,
      },
      {
        path: 'user/profile',
        element: <ProfilePage />,
      },
      {
        path: 'user/settings',
        element: <SettingsPage />,
      },
      {
        path: 'user/pricing',
        element: <PricingPage />,
      },
    ],
  },
  {
    path: '/interviews/:id/session',
    element: (
      <RequireAuth>
        <SessionPage />
      </RequireAuth>
    ),
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-muted-foreground mb-4">页面不存在</p>
          <a href="/dashboard" className="text-blue-600 hover:underline">
            返回首页
          </a>
        </div>
      </div>
    ),
  },
]);