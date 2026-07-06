import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe as fetchMe } from '../services/authApi';

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

  const login = useCallback((tokens) => {
    saveTokens(tokens);
    setAccessToken(tokens.access || '');
    setRefreshToken(tokens.refresh || '');
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setAccessToken('');
    setRefreshToken('');
    setUser(null);
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

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      user,
      isLoadingUser,
      isAuthenticated: Boolean(accessToken),
      login,
      logout,
      loadMe
    }),
    [accessToken, refreshToken, user, isLoadingUser, login, logout, loadMe]
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
