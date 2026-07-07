import { useCallback, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, UserRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { getNotifications } from '../../services/notificationApi.js';

const NOTIFICATIONS_CHANGED_EVENT = 'notifications:changed';

export default function UserMenu() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const payload = await getNotifications();
      setUnreadCount(payload.unreadCount ?? 0);
    } catch {
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  useEffect(() => {
    const handleNotificationsChanged = (event) => {
      const nextUnreadCount = event.detail?.unreadCount;

      if (typeof nextUnreadCount === 'number') {
        setUnreadCount(nextUnreadCount);
        return;
      }

      loadUnreadCount();
    };

    const handleFocus = () => {
      loadUnreadCount();
    };

    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const unreadBadgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);
  const notificationLink = (
    <NavLink to="/notifications" className="layout-icon-link layout-bell-link" aria-label="알림">
      <Bell size={18} aria-hidden="true" />
      {isAuthenticated && unreadCount > 0 ? (
        <span className="layout-bell-badge">{unreadBadgeLabel}</span>
      ) : null}
    </NavLink>
  );

  return (
    <div className="layout-user-menu" aria-label="사용자 메뉴">
      {isAuthenticated ? (
        <>
          {notificationLink}
          <NavLink to="/mypage" className="layout-icon-link" aria-label="마이페이지">
            <UserRound size={18} aria-hidden="true" />
          </NavLink>
          <button type="button" className="layout-auth-link layout-auth-button" onClick={handleLogout}>
            로그아웃
          </button>
          <span className="layout-version-badge" aria-label="현재 버전">
            ver 2.2
          </span>
        </>
      ) : (
        <>
          {notificationLink}
          <NavLink to="/login" className="layout-auth-link">
            로그인
          </NavLink>
          <span className="layout-version-badge" aria-label="현재 버전">
            ver 2.2
          </span>
        </>
      )}
    </div>
  );
}
