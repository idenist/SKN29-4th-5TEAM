import { Link } from 'react-router-dom';
import { Eye, MessageCircle, ThumbsUp } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';

function formatDate(value) {
  if (!value) return '날짜 없음';

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));
}

export default function PostCard({ post }) {
  return (
    <Link to={`/community/${post.id}`} className="community-post-link">
      <Card interactive className="community-post-card">
        <div className="community-post-top">
          <Badge variant="primary">{post.category}</Badge>
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
        </div>
        <div className="community-post-body">
          <h2>{post.title}</h2>
          <p>{post.summary}</p>
        </div>
        <div className="community-post-tags">
          {post.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
        <div className="community-post-meta">
          <span>{post.author}</span>
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
      </Card>
    </Link>
  );
}
