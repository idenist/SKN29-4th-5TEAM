import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PopularSearchSection from './PopularSearchSection.jsx';

export default function HeroSection() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const suggestions = ['월세 지원 정책 찾아줘', '취업 준비 지원 알려줘', '창업 지원사업 있어?', '교육비 지원 받을 수 있어?'];
  const toPolicySearch = (searchKeyword) => `/policies?keyword=${encodeURIComponent(searchKeyword)}`;

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextKeyword = keyword.trim();
    navigate(nextKeyword ? toPolicySearch(nextKeyword) : '/policies');
  };

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-inner">
        <div className="home-hero-badge">
          <span aria-hidden="true" />
          New! 이젠 AI 맞춤형 추천 서비스
        </div>
        <h1 id="home-hero-title">
          청년정책,
          <br />
          헤매지 말고 물어보세요.
        </h1>
        <p>나이, 지역, 상황을 입력하면 지금 받을 수 있는 청년정책을 찾아드립니다.</p>
        <form className="home-search-panel" role="search" aria-label="정책 검색" onSubmit={handleSubmit}>
          <label htmlFor="home-policy-query">궁금한 내용을 입력하세요</label>
          <div className="home-search-row">
            <input
              id="home-policy-query"
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="예: 서울 사는 24살 직장인인데 받을 수 있는 정책 알려줘"
            />
            <button type="submit">정책 검색하기</button>
          </div>
        </form>
        <PopularSearchSection />
        <div className="home-suggestion-list" aria-label="추천 질문">
          {suggestions.map((suggestion) => (
            <Link key={suggestion} to={toPolicySearch(suggestion)} className="home-suggestion-chip">
              {suggestion}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
