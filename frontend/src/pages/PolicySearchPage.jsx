import { useMemo, useState } from 'react';
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
  category: '전체',
  region: '전체',
  status: '전체',
  income: '전체'
};

function matchesFilter(value, selected) {
  return selected === '전체' || value === selected;
}

function matchesIncome(value, selected) {
  return selected === '전체' || value.includes(selected);
}

export default function PolicySearchPage() {
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);

  const queryParams = useMemo(
    () => ({
      keyword: submittedKeyword,
      region: filters.region,
      sourceCategory: filters.category
    }),
    [submittedKeyword, filters.category, filters.region]
  );

  const { policies, isLoading, error, refetch } = usePolicyList(queryParams);

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      return (
        matchesFilter(policy.status, filters.status) &&
        matchesIncome(policy.income, filters.income)
      );
    });
  }, [policies, filters.status, filters.income]);

  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedPolicies = filteredPolicies.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = () => {
    setSubmittedKeyword(keyword);
    setPage(1);
  };

  const handleFilterChange = (nextFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const resetFilters = () => {
    setKeyword('');
    setSubmittedKeyword('');
    setFilters(initialFilters);
    setPage(1);
  };

  return (
    <div className="policy-search-page">
      <PageHeader
        kicker="Policy Search"
        title="청년 정책 검색"
        description="실제 정책 API를 기준으로 검색어, 분야, 지역, 상태, 소득조건을 조합해 정책을 찾아볼 수 있습니다."
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
              <strong>{filteredPolicies.length}개 정책</strong>
              <span>이 조건에 맞습니다.</span>
            </div>
            {submittedKeyword ? <p>검색어: {submittedKeyword}</p> : <p>전체 정책을 표시 중입니다.</p>}
          </Toolbar>

          {isLoading ? (
            <Spinner label="정책을 불러오는 중..." />
          ) : error ? (
            <ErrorState title="정책 목록을 불러오지 못했습니다" description={error} onRetry={refetch} />
          ) : filteredPolicies.length > 0 ? (
            <>
              <PolicyList policies={pagedPolicies} />
              <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
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
