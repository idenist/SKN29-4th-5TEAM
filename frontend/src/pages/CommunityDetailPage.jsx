import { useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ErrorState from '../components/common/ErrorState.jsx';
import Spinner from '../components/common/Spinner.jsx';
import CommentPanel from '../components/community/CommentPanel.jsx';
import PostActionBar from '../components/community/PostActionBar.jsx';
import PostDetail from '../components/community/PostDetail.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useCommunityPost } from '../hooks/useCommunity.js';

function getErrorMessage(error) {
  return error?.message || '요청을 처리하지 못했습니다.';
}

export default function CommunityDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user: apiUser, isAuthenticated } = useAuth();
  const {
    post: apiPost,
    isLoading,
    error,
    refetch,
    updatePost,
    deletePost,
    toggleLike,
    createComment,
    deleteComment
  } = useCommunityPost(postId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [likeError, setLikeError] = useState('');
  const [commentError, setCommentError] = useState('');

  const user = useMemo(() => {
    return apiUser || null;
  }, [apiUser]);

  const post = useMemo(() => {
    return apiPost;
  }, [apiPost]);

  const handleUpdate = async (payload) => {
    setIsSubmitting(true);
    setActionMessage('');
    setActionError('');
    try {
      if (updatePost) await updatePost(payload);
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
      if (deletePost) await deletePost();
      navigate('/community');
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    setLikeError('');

    if (!isAuthenticated) {
      setLikeError('좋아요는 로그인 후 이용할 수 있습니다.');
      return;
    }

    setIsLikeLoading(true);
    try {
      await toggleLike();
    } catch (requestError) {
      setLikeError(getErrorMessage(requestError));
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleCreateComment = async (content) => {
    setCommentError('');

    if (!isAuthenticated) {
      setCommentError('댓글은 로그인 후 작성할 수 있습니다.');
      return;
    }

    setIsCommentSubmitting(true);
    try {
      await createComment(content);
    } catch (requestError) {
      setCommentError(getErrorMessage(requestError));
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setCommentError('');

    if (!isAuthenticated) {
      setCommentError('댓글 삭제는 로그인 후 이용할 수 있습니다.');
      return;
    }

    setDeletingCommentId(commentId);
    try {
      await deleteComment(commentId);
    } catch (requestError) {
      setCommentError(getErrorMessage(requestError));
    } finally {
      setDeletingCommentId('');
    }
  };

  if (isLoading && !apiPost) {
    return (
      <div style={{ backgroundColor: 'transparent', minHeight: '100vh', padding: '40px 60px' }}>
        <Spinner label="게시글을 불러오는 중..." />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ backgroundColor: 'transparent', minHeight: '100vh', padding: '40px 60px' }}>
        <ErrorState
          title="게시글을 찾을 수 없습니다"
          description={error || '요청한 게시글이 없거나 상세 정보를 불러오지 못했습니다.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  // 🔒 [2번 항목 핵심 조건문] 현재 로그인한 유저 ID와 글의 작성자 ID(authorId)가 완벽히 부합하는지 교차 검증
  const isOwnPost = user?.id != null && post?.authorId && String(user.id) === String(post.authorId);

  return (
    <div style={{ backgroundColor: 'transparent', minHeight: '100vh', padding: '40px 60px', fontFamily: 'inherit' }}>
      
      {/* 상단 목록 이동 내비게이션 링크 버튼 */}
      <Link 
        to="/community" 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          color: '#4b5563', 
          textDecoration: 'none', 
          fontSize: '14px', 
          fontWeight: '500', 
          marginBottom: '25px',
          backgroundColor: '#fff',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        목록으로
      </Link>

      {/* 메인 게시글 상세 내용 카드 프레임 */}
      <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '35px', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.01)', marginBottom: '20px' }}>
        <PostDetail post={post} onLike={handleLike} isLikeLoading={isLikeLoading} likeError={likeError} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <CommentPanel
          comments={post.comments || []}
          isAuthenticated={isAuthenticated}
          currentUserId={user?.id}
          onSubmit={handleCreateComment}
          onDelete={handleDeleteComment}
          isSubmitting={isCommentSubmitting}
          deletingCommentId={deletingCommentId}
          error={commentError}
        />
      </div>

      {/* 🛠️ 2번 수정사항 반영 제어부: 작성자 본인(isOwnPost === true) 검증 통과 시에만 수정/삭제 바 출력 */}
      {isOwnPost ? (
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px 35px', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.01)' }}>
          <PostActionBar
            post={post}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            isSubmitting={isSubmitting}
            message={actionMessage}
            error={actionError}
          />
        </div>
      ) : (
        // 본인 글이 아닐 경우 수정/삭제 제어 바를 숨기고 정중한 안내 레이블 출력 대체
        <div style={{ textAlign: 'right', fontSize: '13px', color: '#9ca3af', paddingRight: '10px' }}>
          ℹ️ 본 커뮤니티 글의 수정 및 삭제 권한은 작성자 본인에게만 부여되어 있습니다.
        </div>
      )}
    </div>
  );
}
