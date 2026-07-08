import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, UserRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useNotifications } from '../../hooks/useNotifications.js';
import { formatDate } from '../../utils/dateFormat.js';

export default function UserMenu() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const { isAuthenticated, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    if (!isNotificationsOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotificationsOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBellClick = () => {
    setIsNotificationsOpen((current) => !current);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsNotificationsOpen(false);
  };

  const visibleNotifications = notifications.slice(0, 5);
  const unreadBadgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div className="layout-user-menu" aria-label="사용자 메뉴">
      <div className="layout-notification-menu" ref={menuRef}>
        <button
          type="button"
          className="layout-icon-link layout-auth-button layout-bell-link"
          aria-label="알림"
          aria-expanded={isNotificationsOpen}
          onClick={handleBellClick}
        >
          <Bell size={18} aria-hidden="true" />
          {isAuthenticated && unreadCount > 0 ? (
            <span className="layout-bell-badge">{unreadBadgeLabel}</span>
          ) : null}
        </button>

        {isNotificationsOpen ? (
          <section className="layout-notification-popover" aria-label="알림 목록">
            <header className="layout-notification-header">
              <div>
                <strong>알림</strong>
                <span>{isAuthenticated ? `읽지 않음 ${unreadCount}개` : '로그인이 필요합니다'}</span>
              </div>
              {isAuthenticated && unreadCount > 0 ? (
                <button type="button" onClick={markAllAsRead}>
                  모두 읽음
                </button>
              ) : null}
            </header>

            {!isAuthenticated ? (
              <div className="layout-notification-empty">
                <p>알림을 확인하려면 로그인해 주세요.</p>
                <Link to="/login" onClick={() => setIsNotificationsOpen(false)}>
                  로그인
                </Link>
              </div>
            ) : loading ? (
              <div className="layout-notification-empty">
                <p>알림을 불러오는 중...</p>
              </div>
            ) : error ? (
              <div className="layout-notification-empty">
                <p>알림을 불러오지 못했습니다.</p>
              </div>
            ) : visibleNotifications.length > 0 ? (
              <div className="layout-notification-list">
                {visibleNotifications.map((notification) => {
                  const content = (
                    <>
                      <div className="layout-notification-item-main">
                        <strong>{notification.title}</strong>
                        <p>{notification.message}</p>
                        <time dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time>
                      </div>
                      <div className="layout-notification-actions">
                        {!notification.isRead ? (
                          <button
                            type="button"
                            aria-label="읽음 처리"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check size={14} aria-hidden="true" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          aria-label="삭제"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </>
                  );

                  return notification.link ? (
                    <Link
                      key={notification.id}
                      to={notification.link}
                      className={notification.isRead ? 'layout-notification-item is-read' : 'layout-notification-item'}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      key={notification.id}
                      type="button"
                      className={notification.isRead ? 'layout-notification-item is-read' : 'layout-notification-item'}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="layout-notification-empty">
                <p>표시할 알림이 없습니다.</p>
              </div>
            )}
          </section>
        ) : null}
      </div>

      {isAuthenticated ? (
        <>
          <NavLink to="/mypage" className="layout-icon-link" aria-label="마이페이지">
            <UserRound size={18} aria-hidden="true" />
          </NavLink>
          <button type="button" className="layout-auth-link layout-auth-button" onClick={handleLogout}>
            로그아웃
          </button>
          <span className="layout-version-badge" aria-label="현재 버전">
            ver 2.8
          </span>
        </>
      ) : (
        <>
          <NavLink to="/login" className="layout-auth-link">
            로그인
          </NavLink>
          <span className="layout-version-badge" aria-label="현재 버전">
            ver 2.8
          </span>
        </>
      )}
    </div>
  );
}
