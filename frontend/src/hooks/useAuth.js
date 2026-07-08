import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe as fetchMe } from '../services/authApi';
import { AUTH_SESSION_EXPIRED_EVENT } from '../services/apiClient';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const AuthContext = createContext(null);

const readToken = (key) => localStorage.getItem(key) || '';

const saveTokens = ({ access, refresh }) => {
  if (access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
  }

  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
};

const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => readToken(ACCESS_TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState(() => readToken(REFRESH_TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [sessionMessage, setSessionMessage] = useState('');

  const login = useCallback((tokens) => {
    saveTokens(tokens);
    setAccessToken(tokens.access || '');
    setRefreshToken(tokens.refresh || '');
    setSessionMessage('');
  }, []);

  const logout = useCallback((message = '') => {
    clearTokens();
    setAccessToken('');
    setRefreshToken('');
    setUser(null);
    setSessionMessage(message);
  }, []);

  const loadMe = useCallback(async () => {
    if (!readToken(ACCESS_TOKEN_KEY)) return null;

    setIsLoadingUser(true);

    try {
      const me = await fetchMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      loadMe();
    }
  }, [accessToken, loadMe]);

  useEffect(() => {
    const handleSessionExpired = () => {
      logout('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [logout]);

  const clearSessionMessage = useCallback(() => {
    setSessionMessage('');
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      user,
      isLoadingUser,
      isAuthenticated: Boolean(accessToken),
      sessionMessage,
      login,
      logout,
      loadMe,
      clearSessionMessage
    }),
    [accessToken, refreshToken, user, isLoadingUser, sessionMessage, login, logout, loadMe, clearSessionMessage]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
