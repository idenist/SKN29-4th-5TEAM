import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Section from '../layout/Section.jsx';

export default function NewsPreviewList({ news = [] }) {
  return (
    <Section
      title="정책 뉴스"
      description="청년 정책 흐름을 빠르게 확인하세요."
      actions={
        <Link to="/news" className="ui-button ui-button-secondary ui-button-sm">
          뉴스 더보기
        </Link>
      }
    >
      <div className="home-news-list">
        {news.length > 0 ? (
          news.map((item) => {
            const CardTag = item.url ? 'a' : Link;
            const linkProps = item.url
              ? { href: item.url, target: '_blank', rel: 'noreferrer' }
              : { to: '/news' };

            return (
              <CardTag key={item.id} {...linkProps} className="ui-card ui-card-interactive home-news-card">
                <div>
                  <p className="home-news-source">
                    {item.source} · {item.date || item.publishedAt}
                  </p>
                  <h3>{item.title}</h3>
                </div>
                <ArrowRight size={18} aria-hidden="true" />
              </CardTag>
            );
          })
        ) : (
          <div className="ui-card home-news-card">
            <div>
              <p className="home-news-source">뉴스</p>
              <h3>정책 뉴스를 불러오는 중입니다.</h3>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
