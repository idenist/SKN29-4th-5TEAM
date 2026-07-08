import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Pagination from '../components/common/Pagination.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import Spinner from '../components/common/Spinner.jsx';
import PolicyFilterPanel from '../components/policy/PolicyFilterPanel.jsx';
import PolicyList from '../components/policy/PolicyList.jsx';
import Toolbar from '../components/layout/Toolbar.jsx';
import { usePolicyList } from '../hooks/usePolicies.js';

const PAGE_SIZE = 4;

const initialFilters = {
  age: '',
  category: '전체',
  region: '전체',
  status: '전체',
  income: '전체'
};

function getFiltersFromSearchParams(searchParams) {
  return {
    age: searchParams.get('age') || initialFilters.age,
    category: searchParams.get('category') || initialFilters.category,
    region: searchParams.get('region') || initialFilters.region,
    status: searchParams.get('status') || initialFilters.status,
    income: searchParams.get('income') || initialFilters.income
  };
}

function getPageFromSearchParams(searchParams) {
  const pageParam = Number(searchParams.get('page'));
  return Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
}

function buildPolicySearchParams(keyword, filters, page = 1) {
  const nextParams = new URLSearchParams();
  const nextKeyword = keyword.trim();

  if (nextKeyword) nextParams.set('keyword', nextKeyword);
  if (filters.age) nextParams.set('age', filters.age);
  if (filters.category !== initialFilters.category) nextParams.set('category', filters.category);
  if (filters.region !== initialFilters.region) nextParams.set('region', filters.region);
  if (filters.status !== initialFilters.status) nextParams.set('status', filters.status);
  if (filters.income !== initialFilters.income) nextParams.set('income', filters.income);
  if (page > 1) nextParams.set('page', String(page));

  return nextParams;
}

function isDefaultFilters(filters) {
  return (
    !filters.age &&
    filters.category === initialFilters.category &&
    filters.region === initialFilters.region &&
    filters.status === initialFilters.status &&
    filters.income === initialFilters.income
  );
}

function matchesFilter(value, selected) {
  return selected === '전체' || value === selected;
}

function matchesIncome(value, selected) {
  return selected === '전체' || value.includes(selected);
}

export default function PolicySearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keywordParam = searchParams.get('keyword') || '';
  const [keyword, setKeyword] = useState(keywordParam);
  const [submittedKeyword, setSubmittedKeyword] = useState(keywordParam);
  const [filters, setFilters] = useState(() => getFiltersFromSearchParams(searchParams));
  const [page, setPage] = useState(() => getPageFromSearchParams(searchParams));
  const hasSearchCondition = Boolean(submittedKeyword.trim()) || !isDefaultFilters(filters);

  const queryParams = useMemo(
    () => ({
      keyword: submittedKeyword,
      age: filters.age,
      region: filters.region,
      category: filters.category,
      status: filters.status,
      income: filters.income,
      limit: 100,
      enabled: hasSearchCondition
    }),
    [submittedKeyword, filters.age, filters.category, filters.region, filters.status, filters.income, hasSearchCondition]
  );

  const { policies, isLoading, error, refetch } = usePolicyList(queryParams);

  const filteredPolicies = useMemo(() => {
    if (!hasSearchCondition) return [];

    return policies.filter((policy) => {
      return (
        matchesFilter(policy.category, filters.category) &&
        matchesFilter(policy.status, filters.status) &&
        matchesIncome(policy.income, filters.income)
      );
    });
  }, [hasSearchCondition, policies, filters.status, filters.income]);

  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedPolicies = filteredPolicies.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setKeyword(keywordParam);
    setSubmittedKeyword(keywordParam);
    setFilters(getFiltersFromSearchParams(searchParams));
    setPage(getPageFromSearchParams(searchParams));
  }, [keywordParam, searchParams]);

  const handleSearch = () => {
    const nextKeyword = keyword.trim();
    setSubmittedKeyword(nextKeyword);
    setSearchParams(buildPolicySearchParams(nextKeyword, filters));
    setPage(1);
  };

  const handleFilterChange = (nextFilters) => {
    setFilters(nextFilters);
    setSearchParams(buildPolicySearchParams(submittedKeyword, nextFilters));
    setPage(1);
  };

  const resetFilters = () => {
    setKeyword('');
    setSubmittedKeyword('');
    setSearchParams({});
    setFilters(initialFilters);
    setPage(1);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    setSearchParams(buildPolicySearchParams(submittedKeyword, filters, nextPage));
  };

  return (
    <div className="policy-search-page">
      <PageHeader
        kicker="Policy Search"
        title="청년 정책 검색"
        description="검색어, 나이, 분야, 지역, 상태, 소득조건을 조합해 정책을 찾아볼 수 있습니다."
      />

      <div className="policy-search-layout">
        <PolicyFilterPanel filters={filters} onChange={handleFilterChange} onReset={resetFilters} />

        <section className="policy-results" aria-label="정책 검색 결과">
          <SearchBar
            value={keyword}
            onChange={setKeyword}
            onSubmit={handleSearch}
            placeholder="정책명, 설명으로 검색"
            label="정책 검색어"
          />

          <Toolbar className="policy-result-toolbar">
            <div>
              {hasSearchCondition ? (
                <>
                  <strong>{filteredPolicies.length}개 정책</strong>
                  <span>이 조건에 맞습니다.</span>
                </>
              ) : (
                <>
                  <strong>검색 결과 없음</strong>
                  <span>검색어를 입력하거나 필터를 선택해 주세요.</span>
                </>
              )}
            </div>
            {hasSearchCondition ? (
              submittedKeyword ? <p>검색어: {submittedKeyword}</p> : <p>선택한 필터 조건으로 검색 중입니다.</p>
            ) : (
              <p>아직 검색 조건이 없습니다.</p>
            )}
          </Toolbar>

          {!hasSearchCondition ? (
            <EmptyState
              title="검색 결과가 없습니다"
              description="검색어를 입력하거나 조건 입력 필터를 적용하면 정책을 찾아볼 수 있습니다."
            />
          ) : isLoading ? (
            <Spinner label="정책을 불러오는 중..." />
          ) : error ? (
            <ErrorState title="정책 목록을 불러오지 못했습니다" description={error} onRetry={refetch} />
          ) : filteredPolicies.length > 0 ? (
            <>
              <PolicyList policies={pagedPolicies} />
              <Pagination page={safePage} totalPages={totalPages} onPageChange={handlePageChange} />
            </>
          ) : (
            <EmptyState
              title="검색 결과가 없습니다"
              description="검색어를 줄이거나 필터 조건을 전체로 변경해 보세요."
            />
          )}
        </section>
      </div>
    </div>
  );
}
