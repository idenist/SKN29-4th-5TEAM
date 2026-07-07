import PopularSearchItem from './PopularSearchItem.jsx';
import { usePopularSearches } from '../../hooks/usePopularSearches.js';

function PopularSearchSkeleton() {
  return (
    <div className="home-popular-grid" aria-label="인기 검색어를 불러오는 중">
      {Array.from({ length: 10 }, (_, index) => (
        <div key={`popular-skeleton-${index}`} className="home-popular-skeleton" />
      ))}
    </div>
  );
}

export default function PopularSearchSection() {
  const { popularSearches, isLoading, error, refetch } = usePopularSearches();

  return (
    <section className="home-popular-searches" aria-labelledby="home-popular-title">
      <div className="home-popular-header">
        <h2 id="home-popular-title">
          <span aria-hidden="true">🔥</span>
          인기 검색어
        </h2>
        <p>많은 사용자가 검색한 정책입니다.</p>
      </div>

      {isLoading ? <PopularSearchSkeleton /> : null}

      {!isLoading && error ? (
        <div className="home-popular-state">
          <p>인기 검색어를 잠시 불러오지 못했습니다.</p>
          <button type="button" onClick={refetch}>
            재시도
          </button>
        </div>
      ) : null}

      {!isLoading && !error && popularSearches.length === 0 ? (
        <p className="home-popular-empty">아직 인기 검색어가 없습니다.</p>
      ) : null}

      {!isLoading && !error && popularSearches.length > 0 ? (
        <div className="home-popular-grid">
          {popularSearches.map((item, index) => (
            <PopularSearchItem key={item.id || item.keyword} keyword={item.keyword} rank={index + 1} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
