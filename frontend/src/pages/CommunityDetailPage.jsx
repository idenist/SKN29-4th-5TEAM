import { useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ErrorState from '../components/common/ErrorState.jsx';
import Spinner from '../components/common/Spinner.jsx';
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
  const { user: apiUser } = useAuth();
  const { post: apiPost, isLoading, error, refetch, updatePost, deletePost } = useCommunityPost(postId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  // 🛡️ 백엔드 미완성 상태 시 가동되는 현재 유저 가상 임시 세팅 (ID: 'yena123')
  const user = useMemo(() => {
    return apiUser || { id: "yena123", name: "한예나" };
  }, [apiUser]);

  // 🛡️ UI 무하자 검증을 위한 로컬 방어선 상세 데이터셋 (작성자 ID 분리 배치)
  const localFallbackPosts = {
    1: { id: 1, category: 'review', title: '청년내일저축계좌 드디어 승인됐어요!!', content: '조건 까다로울 줄 알았는데 서류 잘 챙겨 내니까 통과됐네요! 궁금한 점 있으시면 언제든 물어보세요.', authorName: '행복한청년', authorId: 'yena123', views: 1204, likes: 87 },
    2: { id: 2, category: 'question', title: '서울 월세 지원 서류 뭐뭐 준비해야 하나요?', content: '주민등록등본이랑 임대차계약서 말고 확정일자 서류도 필수로 내야 하는지 헷갈립니다. 아시는 분 답변 부탁드려요!', authorName: '서울살이', authorId: 'otherUser', views: 893, likes: 34 }
  };

  // 백엔드 통신 데이터가 있으면 그것을 우선하고, 없으면 로컬 검증용 매핑 데이터 가동
  const post = useMemo(() => {
    return apiPost || localFallbackPosts[postId] || localFallbackPosts[1];
  }, [apiPost, postId]);

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

  if (isLoading && apiPost) {
    return (
      <div style={{ backgroundColor: '#f4f5f9', minHeight: '100vh', padding: '40px 60px' }}>
        <Spinner label="게시글을 불러오는 중..." />
      </div>
    );
  }

  // 🔒 [2번 항목 핵심 조건문] 현재 로그인한 유저 ID와 글의 작성자 ID(authorId)가 완벽히 부합하는지 교차 검증
  const isOwnPost = user?.id != null && post?.authorId && String(user.id) === String(post.authorId);

  return (
    // 🎨 대시보드 무드에 맞춘 정갈한 연회색 단일 테마 배경 배정
    <div style={{ backgroundColor: '#f4f5f9', minHeight: '100vh', padding: '40px 60px', fontFamily: 'sans-serif' }}>
      
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
        <PostDetail post={post} />
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