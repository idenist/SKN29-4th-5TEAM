import { Outlet } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  // TODO: useAuth 연동 후 인증되지 않은 사용자는 /login으로 redirect 처리.
  return children || <Outlet />;
}
