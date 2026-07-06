import { useCallback, useEffect, useState } from 'react';
import {
  getMyNotifications,
  getMyPageSummary,
  getMyScraps,
  getMySearchHistory,
  getMyViewedPolicies,
  getMyProfile
} from '../services/mypageApi.js';
import { useAuth } from './useAuth.js';

const LOGIN_REQUIRED_MESSAGE = '로그인이 필요한 기능입니다.';

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.responseData?.message;
  const apiReason = error?.responseData?.error?.reason || error?.responseData?.error;
  return apiReason || apiMessage || error?.message || fallback;
};

export function useMyPage() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState({
    user: null,
    summary: null,
    scrappedPolicies: [],
    viewedPolicies: [],
    searchHistory: [],
    notifications: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyPage = useCallback(async () => {
    if (!isAuthenticated) {
      setData({
        user: null,
        summary: null,
        scrappedPolicies: [],
        viewedPolicies: [],
        searchHistory: [],
        notifications: []
      });
      setIsLoading(false);
      setError(LOGIN_REQUIRED_MESSAGE);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [profile, summary, scrappedPolicies, viewedPolicies, searchHistory, notificationPayload] =
        await Promise.all([
          getMyProfile(),
          getMyPageSummary(),
          getMyScraps(),
          getMyViewedPolicies(),
          getMySearchHistory(),
          getMyNotifications()
        ]);

      setData({
        user: {
          ...profile,
          ...profile.profile,
          email: profile.email,
          nickname: profile.nickname || profile.username || profile.email || '사용자'
        },
        summary: {
          ...summary.summary,
          scrapsCount: scrappedPolicies.length || summary.summary.scrapsCount,
          viewedCount: viewedPolicies.length || summary.summary.viewedCount,
          searchCount: searchHistory.length || summary.summary.searchCount,
          unreadNotifications: notificationPayload.unreadCount ?? summary.summary.unreadNotifications
        },
        scrappedPolicies,
        viewedPolicies: viewedPolicies.length ? viewedPolicies : summary.viewedPolicies,
        searchHistory: searchHistory.length ? searchHistory : summary.searchHistory,
        notifications: notificationPayload.notifications
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError, '마이페이지 정보를 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMyPage();
  }, [fetchMyPage]);

  return {
    ...data,
    isLoading,
    error,
    refetch: fetchMyPage
  };
}
