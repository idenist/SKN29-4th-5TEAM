import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, UserRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

export default function UserMenu() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="layout-user-menu" aria-label="사용자 메뉴">
      {isAuthenticated ? (
        <>
          <NavLink to="/notifications" className="layout-icon-link layout-bell-link" aria-label="알림">
            <Bell size={18} aria-hidden="true" />
            <span className="layout-bell-badge">2</span>
          </NavLink>
          <NavLink to="/mypage" className="layout-icon-link" aria-label="마이페이지">
            <UserRound size={18} aria-hidden="true" />
          </NavLink>
          <button type="button" className="layout-auth-link layout-auth-button" onClick={handleLogout}>
            로그아웃
          </button>
          <span className="layout-version-badge" aria-label="현재 버전">
            ver 2.0
          </span>
        </>
      ) : (
        <>
          <NavLink to="/notifications" className="layout-icon-link layout-bell-link" aria-label="알림">
            <Bell size={18} aria-hidden="true" />
            <span className="layout-bell-badge">2</span>
          </NavLink>
          <NavLink to="/login" className="layout-auth-link">
            로그인
          </NavLink>
          <span className="layout-version-badge" aria-label="현재 버전">
            ver 2.0
          </span>
        </>
      )}
    </div>
  );
}
