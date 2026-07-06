import { Eye, MessageCircle, ThumbsUp } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';

function formatDate(value) {
  if (!value) return '날짜 없음';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export default function PostDetail({ post }) {
  return (
    <Card className="community-detail-card">
      <header className="community-detail-header">
        <Badge variant="primary">{post.category}</Badge>
        <h1>{post.title}</h1>
        <div className="community-detail-meta">
          <span>{post.author}</span>
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          <span>
            <Eye size={15} aria-hidden="true" />
            {post.views}
          </span>
          <span>
            <ThumbsUp size={15} aria-hidden="true" />
            {post.likes}
          </span>
          <span>
            <MessageCircle size={15} aria-hidden="true" />
            {post.commentsCount}
          </span>
        </div>
      </header>
      <div className="community-detail-content">
        <p>{post.content}</p>
      </div>
      <div className="community-detail-tags">
        {post.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
    </Card>
  );
}
