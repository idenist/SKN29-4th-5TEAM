import { useState } from 'react';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import PostEditorModal from './PostEditorModal.jsx';

export default function PostActionBar({
  post,
  onUpdate,
  onDelete,
  isSubmitting = false,
  message = '',
  error = ''
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleUpdate = async (payload) => {
    await onUpdate?.(payload);
    setIsEditOpen(false);
  };

  return (
    <Card className="community-action-bar">
      <div>
        <h2>게시글 관리</h2>
        <p>수정/삭제는 로그인 및 작성자 권한 확인 후 처리됩니다.</p>
      </div>
      <div className="community-action-buttons">
        <Button type="button" variant="secondary" onClick={() => setIsEditOpen(true)}>
          수정
        </Button>
        <Button type="button" variant="danger" onClick={onDelete} disabled={isSubmitting}>
          {isSubmitting ? '처리 중...' : '삭제'}
        </Button>
      </div>
      {message ? <p className="community-action-message">{message}</p> : null}
      {error ? <p className="community-action-message" role="alert">{error}</p> : null}

      <PostEditorModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        error={error}
        initialTitle={post?.title || ''}
        initialContent={post?.content || ''}
        submitLabel="수정"
        title="게시글 수정"
        description="제목과 내용을 수정합니다."
      />
    </Card>
  );
}
