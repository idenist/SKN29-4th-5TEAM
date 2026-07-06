import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Card from '../common/Card.jsx';
import Section from '../layout/Section.jsx';

export default function QuickMenu({ items = [] }) {
  return (
    <Section title="빠른 시작" description="자주 쓰는 기능으로 바로 이동하세요.">
      <div className="home-quick-grid">
        {items.map((item) => (
          <Link key={item.title} to={item.to} className="home-quick-link">
            <Card interactive className="home-quick-card">
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <ArrowRight size={18} aria-hidden="true" />
            </Card>
          </Link>
        ))}
      </div>
    </Section>
  );
}
