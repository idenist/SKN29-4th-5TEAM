import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ErrorState from '../components/common/ErrorState.jsx';
import Spinner from '../components/common/Spinner.jsx';
import PostActionBar from '../components/community/PostActionBar.jsx';
import PostDetail from '../components/community/PostDetail.jsx';
import { useCommunityPost } from '../hooks/useCommunity.js';

function getErrorMessage(error) {
  return error?.message || '요청을 처리하지 못했습니다.';
}

export default function CommunityDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { post, isLoading, error, refetch, updatePost, deletePost } = useCommunityPost(postId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const handleUpdate = async (payload) => {
    setIsSubmitting(true);
    setActionMessage('');
    setActionError('');

    try {
      await updatePost(payload);
      setActionMessage('게시글을 수정했습니다.');
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setActionMessage('');
    setActionError('');

    try {
      await deletePost();
      navigate('/community');
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="community-detail-page">
        <Link to="/community" className="ui-button ui-button-ghost ui-button-sm community-back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          목록으로
        </Link>
        <Spinner label="게시글을 불러오는 중..." />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="community-detail-page">
        <Link to="/community" className="ui-button ui-button-ghost ui-button-sm community-back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          목록으로
        </Link>
        <ErrorState
          title="게시글을 찾을 수 없습니다"
          description={error || '요청한 게시글이 없거나 상세 정보를 불러오지 못했습니다.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="community-detail-page">
      <Link to="/community" className="ui-button ui-button-ghost ui-button-sm community-back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        목록으로
      </Link>
      <PostDetail post={post} />
      <PostActionBar
        post={post}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        isSubmitting={isSubmitting}
        message={actionMessage}
        error={actionError}
      />
    </div>
  );
}
