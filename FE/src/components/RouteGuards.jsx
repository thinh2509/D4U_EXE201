import { Navigate, useLocation } from 'react-router-dom';
import { LoadingState } from './StateViews.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export function roleHome(role) {
  if (role === 'STUDENT') return '/student/dashboard';
  if (role === 'SME') return '/sme/dashboard';
  if (role === 'ADMIN') return '/admin/dashboard';
  return '/login';
}

export function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState label="Đang kiểm tra phiên đăng nhập..." />;
  if (user) return <Navigate to={roleHome(user.role)} replace />;
  return children;
}

export function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState label="Đang kiểm tra quyền truy cập..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles?.length && !roles.includes(user.role)) return <Navigate to="/forbidden" replace />;
  return children;
}
