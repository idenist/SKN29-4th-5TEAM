import Card from '../common/Card.jsx';

export default function HomeStats({ stats = [] }) {
  return (
    <section className="home-stats" aria-label="서비스 현황">
      {stats.map((stat) => (
        <Card key={stat.label} className="home-stat-card">
          <p>{stat.label}</p>
          <strong>{stat.value}</strong>
          <span>{stat.caption}</span>
        </Card>
      ))}
    </section>
  );
}
