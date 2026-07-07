export default function HomeStats({ stats = [] }) {
  return (
    <section className="home-stats" aria-label="서비스 현황">
      {stats.map((stat) => (
        <div key={stat.label} className="home-stat-card">
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </section>
  );
}
