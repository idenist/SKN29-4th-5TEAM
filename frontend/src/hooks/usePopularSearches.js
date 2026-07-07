import { useCallback, useEffect, useState } from 'react';
import { getPopularSearches } from '../services/popularSearchApi.js';

const getErrorMessage = (error) => {
  return (
    error?.responseData?.error?.reason ||
    error?.responseData?.message ||
    error?.message ||
    '인기 검색어를 불러오지 못했습니다.'
  );
};

export function usePopularSearches() {
  const [popularSearches, setPopularSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPopularSearches = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const nextPopularSearches = await getPopularSearches();
      setPopularSearches(nextPopularSearches);
    } catch (requestError) {
      setPopularSearches([]);
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPopularSearches();
  }, [fetchPopularSearches]);

  return {
    popularSearches,
    isLoading,
    error,
    refetch: fetchPopularSearches
  };
}
