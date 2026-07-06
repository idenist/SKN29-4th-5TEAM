import { Link } from 'react-router-dom';
import { Bot, Search, ShieldCheck, Sparkles } from 'lucide-react';
import Badge from '../common/Badge.jsx';

export default function HeroSection() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-copy">
        <Badge variant="primary">청년 정책 통합 탐색</Badge>
        <h1 id="home-hero-title">나에게 맞는 청년 정책을 더 쉽고 안전하게</h1>
        <p>
          복잡한 지원 조건은 줄이고, 필요한 정책 검색과 AI 상담, 마감 알림까지 한 화면에서 이어갈 수 있습니다.
        </p>
        <div className="home-hero-actions">
          <Link to="/policies" className="ui-button ui-button-primary ui-button-md">
            <Search size={18} aria-hidden="true" />
            <span>정책 검색하기</span>
          </Link>
          <Link to="/chat" className="ui-button ui-button-secondary ui-button-md">
            <Bot size={18} aria-hidden="true" />
            <span>AI 챗봇 시작하기</span>
          </Link>
        </div>
      </div>
      <div className="home-hero-visual" aria-label="서비스 주요 기능 미리보기">
        <div className="home-visual-card home-visual-card-main">
          <div className="home-visual-icon">
            <ShieldCheck size={24} aria-hidden="true" />
          </div>
          <div>
            <p className="home-visual-label">맞춤 정책 추천</p>
            <strong>주거, 취업, 금융 지원을 한 번에 비교</strong>
          </div>
        </div>
        <div className="home-visual-grid">
          <div className="home-visual-mini">
            <span>마감 알림</span>
            <strong>D-7</strong>
          </div>
          <div className="home-visual-mini accent">
            <span>AI 답변</span>
            <strong>빠른 상담</strong>
          </div>
        </div>
        <div className="home-visual-note">
          <Sparkles size={18} aria-hidden="true" />
          <span>프로필 기반으로 놓치기 쉬운 정책을 먼저 보여줘요.</span>
        </div>
      </div>
    </section>
  );
}
