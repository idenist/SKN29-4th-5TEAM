import { ExternalLink } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';

export default function NewsCard({ item }) {
  return (
    <Card interactive className="media-card news-card">
      <div className="media-card-meta">
        <Badge variant="primary">{item.category}</Badge>
        <span>{item.source}</span>
        <time dateTime={item.publishedAt}>{item.publishedAt}</time>
      </div>
      <div className="media-card-body">
        <h2>{item.title}</h2>
        <p>{item.summary}</p>
      </div>
      <div className="media-tag-list">
        {item.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
      {item.url ? (
        <a href={item.url} target="_blank" rel="noreferrer" className="ui-button ui-button-secondary ui-button-sm media-external-link">
          원문 보기
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      ) : null}
    </Card>
  );
}
