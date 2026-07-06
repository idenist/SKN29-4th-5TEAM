import { ExternalLink, Play } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';

export default function VideoCard({ item }) {
  return (
    <Card interactive className="media-card video-card">
      <div className="video-thumb" aria-label={`${item.title} 썸네일`}>
        <Play size={28} aria-hidden="true" />
        <strong>{item.thumbnail}</strong>
        <span>{item.duration}</span>
      </div>
      <div className="media-card-meta">
        <Badge variant="primary">{item.category}</Badge>
        <span>{item.channel}</span>
        <time dateTime={item.publishedAt}>{item.publishedAt}</time>
      </div>
      <div className="media-card-body">
        <h2>{item.title}</h2>
        <p>{item.description}</p>
      </div>
      <div className="media-tag-list">
        {item.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
      {item.url ? (
        <a href={item.url} target="_blank" rel="noreferrer" className="ui-button ui-button-secondary ui-button-sm media-external-link">
          영상 보기
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      ) : null}
    </Card>
  );
}
