import { Eye, MessageCircle, ThumbsUp } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import { formatDate } from '../../utils/dateFormat.js';

export default function PostDetail({ post, onLike, isLikeLoading = false, likeError = '' }) {
  return (
    <Card className="community-detail-card">
      <header className="community-detail-header">
        <Badge variant="primary">{post.categoryLabel}</Badge>
        <h1>{post.title}</h1>
        <div className="community-detail-meta">
          <span>{post.author}</span>
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          <span>
            <Eye size={15} aria-hidden="true" />
            {post.views}
          </span>
          <button
            type="button"
            className={post.isLiked ? 'community-like-button is-liked' : 'community-like-button'}
            onClick={onLike}
            disabled={isLikeLoading}
            aria-pressed={post.isLiked}
          >
            <ThumbsUp size={15} aria-hidden="true" fill={post.isLiked ? 'currentColor' : 'none'} />
            {post.likes}
          </button>
          <span>
            <MessageCircle size={15} aria-hidden="true" />
            {post.commentsCount}
          </span>
        </div>
      </header>
      <div className="community-detail-content">
        <p>{post.content}</p>
      </div>
      {likeError ? (
        <p className="community-detail-message" role="alert">
          {likeError}
        </p>
      ) : null}
      <div className="community-detail-tags">
        {post.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
    </Card>
  );
}
