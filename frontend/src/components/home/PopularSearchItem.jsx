import { Link } from 'react-router-dom';

const rankLabels = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

export default function PopularSearchItem({ keyword, rank }) {
  const rankClassName = rank <= 3 ? `top-${rank}` : 'default';
  const searchPath = `/policies?keyword=${encodeURIComponent(keyword)}`;

  return (
    <Link to={searchPath} className="home-popular-pill">
      <span className={`home-popular-rank ${rankClassName}`} aria-label={`${rank}위`}>
        {rankLabels[rank - 1] || rank}
      </span>
      <span className="home-popular-keyword">{keyword}</span>
    </Link>
  );
}
