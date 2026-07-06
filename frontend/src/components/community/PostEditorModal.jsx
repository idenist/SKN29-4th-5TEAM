import { useEffect, useState } from 'react';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Modal from '../common/Modal.jsx';

export default function PostEditorModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error = '',
  initialTitle = '',
  initialContent = '',
  submitLabel = '저장',
  title = '게시글 작성',
  description = '제목과 내용을 입력해 게시글을 작성합니다.'
}) {
  const [postTitle, setPostTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPostTitle(initialTitle);
      setContent(initialContent);
      setMessage('');
    }
  }, [initialContent, initialTitle, isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!postTitle.trim() || !content.trim()) {
      setMessage('제목과 내용을 입력해 주세요.');
      return;
    }

    setMessage('');
    await onSubmit?.({ title: postTitle.trim(), content: content.trim() });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <form className="community-editor-form" onSubmit={handleSubmit}>
        <Input label="제목" value={postTitle} onChange={(event) => setPostTitle(event.target.value)} required />
        <label className="community-editor-textarea">
          <span>내용</span>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={7} />
        </label>
        {message ? <p className="community-editor-message">{message}</p> : null}
        {error ? <p className="community-editor-message" role="alert">{error}</p> : null}
        <div className="community-editor-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            닫기
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
