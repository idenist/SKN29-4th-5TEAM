import { useMemo, useState } from 'react';
import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import Select from '../components/common/Select.jsx';
import NewsList from '../components/news/NewsList.jsx';
import { newsCategories, newsMock } from '../data/newsMock.js';

const categoryOptions = newsCategories.map((category) => ({ value: category, label: category }));

function matchesKeyword(item, keyword) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return true;
  return [item.title, item.summary, ...item.tags].join(' ').toLowerCase().includes(normalized);
}

export default function NewsPage() {
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [category, setCategory] = useState('전체');

  const filteredNews = useMemo(() => {
    return newsMock.filter((item) => {
      const categoryMatched = category === '전체' || item.category === category;
      return categoryMatched && matchesKeyword(item, submittedKeyword);
    });
  }, [category, submittedKeyword]);

  return (
    <div className="media-page">
      <PageHeader
        kicker="News"
        title="청년 정책 뉴스"
        description="정책 변화와 신청 일정을 mock data 기반으로 정리했습니다."
      />

      <section className="media-toolbar" aria-label="뉴스 검색과 필터">
        <SearchBar
          value={keyword}
          onChange={setKeyword}
          onSubmit={() => setSubmittedKeyword(keyword)}
          placeholder="뉴스 제목, 요약, 태그로 검색"
          label="뉴스 검색어"
        />
        <Select
          label="카테고리"
          value={category}
          options={categoryOptions}
          placeholder=""
          onChange={(event) => setCategory(event.target.value)}
        />
      </section>

      <section className="media-result-summary">
        <strong>{filteredNews.length}개 뉴스</strong>
        <span>{submittedKeyword ? `검색어: ${submittedKeyword}` : '전체 뉴스를 표시 중입니다.'}</span>
      </section>

      {filteredNews.length > 0 ? (
        <NewsList news={filteredNews} />
      ) : (
        <EmptyState title="뉴스가 없습니다" description="검색어를 줄이거나 카테고리를 전체로 변경해 보세요." />
      )}
    </div>
  );
}
