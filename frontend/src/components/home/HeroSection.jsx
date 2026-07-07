import { Link } from 'react-router-dom';
import PopularSearchSection from './PopularSearchSection.jsx';

export default function HeroSection() {
  const suggestions = ['월세 지원 정책 찾아줘', '취업 준비 지원 알려줘', '창업 지원사업 있어?', '교육비 지원 받을 수 있어?'];

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
        <div className="home-search-panel" role="search" aria-label="AI 정책 질문">
          <label htmlFor="home-policy-query">궁금한 내용을 입력하세요</label>
          <div className="home-search-row">
            <input
              id="home-policy-query"
              type="text"
              placeholder="예: 서울 사는 24살 직장인인데 받을 수 있는 정책 알려줘"
            />
            <Link to="/chat">AI에게 물어보기</Link>
          </div>
        </div>
        <PopularSearchSection />
        <div className="home-suggestion-list" aria-label="추천 질문">
          {suggestions.map((suggestion) => (
            <Link key={suggestion} to="/chat" className="home-suggestion-chip">
              {suggestion}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
