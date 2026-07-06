import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createScrap,
  deleteScrap,
  getPolicies,
  getPolicyDetail,
  getScraps
} from '../services/policyApi.js';
import { useAuth } from './useAuth.js';

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.responseData?.message;
  const apiReason = error?.responseData?.error?.reason;

  return apiReason || apiMessage || fallback;
};

export function usePolicyList(params = {}) {
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const stableParams = useMemo(() => params, [params.keyword, params.region, params.sourceCategory, params.category, params.age]);

  const fetchPolicies = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const nextPolicies = await getPolicies(stableParams);
      setPolicies(nextPolicies);
    } catch (requestError) {
      setPolicies([]);
      setError(getErrorMessage(requestError, '정책 목록을 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, [stableParams]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  return {
    policies,
    isLoading,
    error,
    refetch: fetchPolicies
  };
}

export function usePolicyDetail(itemId) {
  const { isAuthenticated } = useAuth();
  const [policy, setPolicy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isScrapped, setIsScrapped] = useState(false);
  const [isScrapLoading, setIsScrapLoading] = useState(false);
  const [scrapMessage, setScrapMessage] = useState('');

  const fetchPolicy = useCallback(async () => {
    if (!itemId) return;

    setIsLoading(true);
    setError('');

    try {
      const nextPolicy = await getPolicyDetail(itemId);
      setPolicy(nextPolicy);
    } catch (requestError) {
      setPolicy(null);
      setError(getErrorMessage(requestError, '정책을 찾을 수 없습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  const fetchScrapState = useCallback(async () => {
    if (!isAuthenticated || !itemId) {
      setIsScrapped(false);
      return;
    }

    try {
      const scraps = await getScraps();
      setIsScrapped(scraps.some((scrap) => scrap.policyId === itemId || scrap.policy?.itemId === itemId));
    } catch {
      setIsScrapped(false);
    }
  }, [isAuthenticated, itemId]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  useEffect(() => {
    fetchScrapState();
  }, [fetchScrapState]);

  const toggleScrap = useCallback(async () => {
    setScrapMessage('');

    if (!isAuthenticated) {
      setScrapMessage('로그인이 필요한 기능입니다.');
      return;
    }

    const nextScrapped = !isScrapped;
    setIsScrapped(nextScrapped);
    setIsScrapLoading(true);

    try {
      if (nextScrapped) {
        await createScrap(itemId);
        setScrapMessage('스크랩했습니다.');
      } else {
        await deleteScrap(itemId);
        setScrapMessage('스크랩을 해제했습니다.');
      }
    } catch (requestError) {
      setIsScrapped(!nextScrapped);
      setScrapMessage(getErrorMessage(requestError, '스크랩 처리 중 문제가 발생했습니다.'));
    } finally {
      setIsScrapLoading(false);
    }
  }, [isAuthenticated, isScrapped, itemId]);

  return {
    policy,
    isLoading,
    error,
    refetch: fetchPolicy,
    isScrapped,
    isScrapLoading,
    scrapMessage,
    toggleScrap
  };
}
