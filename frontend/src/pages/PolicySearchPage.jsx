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

const PAGE_SIZE = 10;

const initialFilters = {
  age: '',
  category: '전체',
  region: '전체',
  includeClosed: false,   // 상태 드롭다운 대신 토글
  income: '전체'
};

function getFiltersFromSearchParams(searchParams) {
  return {
    age: searchParams.get('age') || initialFilters.age,
    category: searchParams.get('category') || initialFilters.category,
    region: searchParams.get('region') || initialFilters.region,
    includeClosed: searchParams.get('includeClosed') === 'true',
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
  if (filters.includeClosed) nextParams.set('includeClosed', 'true');
  if (filters.income !== initialFilters.income) nextParams.set('income', filters.income);
  if (page > 1) nextParams.set('page', String(page));

  return nextParams;
}

export default function PolicySearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const keywordParam = searchParams.get('keyword') || '';

  const [keyword, setKeyword] = useState(keywordParam);
  const [submittedKeyword, setSubmittedKeyword] = useState(keywordParam);
  const [filters, setFilters] = useState(() => getFiltersFromSearchParams(searchParams));
  const [page, setPage] = useState(() => getPageFromSearchParams(searchParams));

  const queryParams = useMemo(() => {
  return {
    keyword: submittedKeyword,
    age: filters.age,
    region: filters.region,
    category: filters.category,
    includeClosed: filters.includeClosed,
    income: filters.income,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    enabled: true
    };
  }, [
    submittedKeyword,
    filters.age,
    filters.category,
    filters.region,
    filters.includeClosed,
    filters.income,
    page
  ]);

  const { policies, totalCount, isLoading, error, refetch } = usePolicyList(queryParams);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const resultStart = totalCount > 0 ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const resultEnd = totalCount > 0 ? resultStart + policies.length - 1 : 0;

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
        description="검색어, 나이, 분야, 지역, 소득조건을 조합해 정책을 찾아볼 수 있습니다."
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
              <strong>총 {totalCount}개 정책</strong>
              {totalCount > 0 && (
                <span>{resultStart}-{resultEnd}번째 결과를 표시 중입니다.</span>
              )}
            </div>
            <div
              className="policy-condition-toggle-field policy-result-toggle"
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <label htmlFor="policy-include-closed-toggle">마감 정책 포함</label>
              <button
                id="policy-include-closed-toggle"
                type="button"
                role="switch"
                aria-checked={filters.includeClosed}
                className={`policy-toggle-switch ${filters.includeClosed ? 'is-on' : ''}`}
                onClick={() => handleFilterChange({ ...filters, includeClosed: !filters.includeClosed })}
              >
                <span className="policy-toggle-knob" />
              </button>
            </div>
          </Toolbar>

          {isLoading ? (
            <Spinner label="정책을 불러오는 중..." />
          ) : error ? (
            <ErrorState title="정책 목록을 불러오지 못했습니다" description={error} onRetry={refetch} />
          ) : policies.length > 0 ? (
            <>
              <PolicyList policies={policies} />
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