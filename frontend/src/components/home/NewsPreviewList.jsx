import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Card from '../common/Card.jsx';
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
        {news.map((item) => (
          <Card key={item.id} interactive className="home-news-card">
            <div>
              <p className="home-news-source">
                {item.source} · {item.date}
              </p>
              <h3>{item.title}</h3>
            </div>
            <ArrowRight size={18} aria-hidden="true" />
          </Card>
        ))}
      </div>
    </Section>
  );
}
