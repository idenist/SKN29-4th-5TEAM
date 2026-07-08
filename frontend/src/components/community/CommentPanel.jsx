import { useState } from 'react';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';

function formatDate(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export default function CommentPanel({
  comments = [],
  isAuthenticated = false,
  currentUserId = '',
  onSubmit,
  onDelete,
  isSubmitting = false,
  deletingCommentId = '',
  error = ''
}) {
  const [content, setContent] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || isSubmitting) return;

    await onSubmit?.(trimmedContent);
    setContent('');
  };

  return (
    <Card className="community-comments">
      <header className="community-comments-header">
        <h2>댓글</h2>
        <span>{comments.length}개</span>
      </header>

      <div className="community-comment-list">
        {comments.length > 0 ? (
          comments.map((comment) => {
            const canDelete = currentUserId && String(comment.authorId) === String(currentUserId);

            return (
              <article key={comment.id} className="community-comment-item">
                <div className="community-comment-meta">
                  <div>
                    <strong>{comment.author}</strong>
                    <time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
                  </div>
                  {canDelete ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(comment.id)}
                      disabled={String(deletingCommentId) === String(comment.id)}
                    >
                      삭제
                    </Button>
                  ) : null}
                </div>
                <p>{comment.content}</p>
              </article>
            );
          })
        ) : (
          <p className="community-comment-empty">아직 댓글이 없습니다.</p>
        )}
      </div>

      <form className="community-comment-form" onSubmit={handleSubmit}>
        <label htmlFor="community-comment-content">댓글 작성</label>
        <textarea
          id="community-comment-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={isAuthenticated ? '댓글을 입력하세요' : '로그인 후 댓글을 작성할 수 있습니다.'}
          rows={3}
          disabled={!isAuthenticated || isSubmitting}
        />
        {error ? (
          <p className="community-comment-message" role="alert">
            {error}
          </p>
        ) : null}
        <div>
          <Button type="submit" disabled={!isAuthenticated || isSubmitting || content.trim().length === 0}>
            댓글 등록
          </Button>
        </div>
      </form>
    </Card>
  );
}
