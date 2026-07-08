import { useMemo, useState } from 'react';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Pagination from '../components/common/Pagination.jsx';
import Spinner from '../components/common/Spinner.jsx';
import CommunityToolbar from '../components/community/CommunityToolbar.jsx';
import PostEditorModal from '../components/community/PostEditorModal.jsx';
import { useCommunityPosts } from '../hooks/useCommunity.js';

const PAGE_SIZE = 4;

function matchesKeyword(post, keyword) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return true;

  return [post.title, post.summary, post.content, ...post.tags].join(' ').toLowerCase().includes(normalized);
}

function getErrorMessage(error) {
  return error?.message || '게시글을 저장하지 못했습니다.';
}

export default function CommunityPage() {
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorError, setEditorError] = useState('');
  const { posts, isLoading, error, refetch, createPost } = useCommunityPosts();

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const categoryMatched = category === 'all' || post.category === category;
      return categoryMatched && matchesKeyword(post, submittedKeyword);
    });
  }, [category, posts, submittedKeyword]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedPosts = filteredPosts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = () => {
    setSubmittedKeyword(keyword);
    setPage(1);
  };

  const handleCategoryChange = (nextCategory) => {
    setCategory(nextCategory);
    setPage(1);
  };

  const handleWriteClick = () => {
    setEditorError('');
    setIsEditorOpen(true);
  };

  const handleCreatePost = async (payload) => {
    setIsSubmitting(true);
    setEditorError('');

    try {
      await createPost(payload);
      setIsEditorOpen(false);
    } catch (requestError) {
      setEditorError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // 🎨 image_7559a2.png 기반 전체 레이아웃 테마 동기화 (연회색 배경)
    <div style={{ backgroundColor: '#f4f5f9', minHeight: '100vh', padding: '40px 60px', fontFamily: 'sans-serif' }}>
      
      {/* 🏷️ 타이틀 및 요구사항 배지 영역 (REQ-F-09 및 관리 버튼셋 포함) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>커뮤니티</h1>
          <span style={{ display: 'inline-block', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontWeight: 'bold' }}>
            REQ-F-09
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
            🔒 공개
          </button>
          <button style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#4b5563' }}>
            ⚙️ MVT ∨
          </button>
        </div>
      </div>

      <CommunityToolbar
        keyword={keyword}
        onKeywordChange={setKeyword}
        onSearch={handleSearch}
        category={category}
        onCategoryChange={handleCategoryChange}
        onWriteClick={handleWriteClick}
      />

      <section style={{ margin: '20px 0 15px 0', fontSize: '14px', color: '#4b5563' }} aria-label="검색 결과 요약">
        <strong style={{ color: '#111827' }}>{filteredPosts.length}개 게시글</strong>
        <span style={{ marginLeft: '8px', color: '#6b7280' }}>
          {submittedKeyword ? `검색어: ${submittedKeyword}` : '전체 게시글을 표시 중입니다.'}
        </span>
      </section>

      {isLoading ? (
        <Spinner label="게시글을 불러오는 중..." />
      ) : error ? (
        <ErrorState title="게시글 목록을 불러오지 못했습니다" description={error} onRetry={refetch} />
      ) : filteredPosts.length > 0 ? (
        <>
          {/* 📊 image_7559a2.png 지정 리스트 테이블 포맷 직접 구현 파트 */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.01)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #edf2f7', color: '#475569', fontSize: '14px', fontWeight: '600' }}>
                  <th style={{ padding: '18px 24px', width: '100px', textAlign: 'center' }}>분류</th>
                  <th style={{ padding: '18px 24px' }}>제목</th>
                  <th style={{ padding: '18px 24px', width: '140px', textAlign: 'center' }}>작성자</th>
                  <th style={{ padding: '18px 24px', width: '100px', textAlign: 'center' }}>조회</th>
                  <th style={{ padding: '18px 24px', width: '100px', textAlign: 'center' }}>좋아요</th>
                </tr>
              </thead>
              <tbody>
                {pagedPosts.map((post) => {
                  // 🟢 분류 데이터 값에 따른 둥근 원형 배지 가변 스타일 분기 정의
                  let badgeStyle = { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2' };
                  let categoryLabel = "정보";

                  if (post.category === 'review' || post.category === '후기') {
                    badgeStyle.backgroundColor = '#ecfdf5';
                    badgeStyle.color = '#10b981';
                    categoryLabel = "후기";
                  } else if (post.category === 'question' || post.category === '질문') {
                    badgeStyle.backgroundColor = '#eff6ff';
                    badgeStyle.color = '#3b82f6';
                    categoryLabel = "질문";
                  } else {
                    badgeStyle.backgroundColor = '#faf5ff';
                    badgeStyle.color = '#8b5cf6';
                    categoryLabel = "정보";
                  }

                  return (
                    <tr key={post.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '15px', color: '#334155' }}>
                      {/* 분류 배지 (원형 세로 정렬 분기) */}
                      <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                        <span style={badgeStyle}>
                          {categoryLabel[0]}<br/>{categoryLabel[1]}
                        </span>
                      </td>
                      {/* 제목 링크 */}
                      <td style={{ padding: '14px 24px', fontWeight: '500', color: '#1e293b', cursor: 'pointer' }}>
                        {post.title}
                      </td>
                      {/* 작성자 */}
                      <td style={{ padding: '14px 24px', textAlign: 'center', color: '#475569' }}>
                        {post.authorName || post.author || '청년유저'}
                      </td>
                      {/* 조회수 안전 처리 */}
                      <td style={{ padding: '14px 24px', textAlign: 'center', color: '#64748b' }}>
                        {post.views !== undefined ? post.views.toLocaleString() : '0'}
                      </td>
                      {/* 좋아요수 안전 처리 */}
                      <td style={{ padding: '14px 24px', textAlign: 'center', color: '#64748b' }}>
                        {post.likes !== undefined ? post.likes.toLocaleString() : '0'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState title="게시글이 없습니다" description="검색어를 줄이거나 카테고리를 전체로 변경해 보세요." />
      )}

      <PostEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSubmit={handleCreatePost}
        isSubmitting={isSubmitting}
        error={editorError}
        submitLabel="작성"
      />
    </div>
  );
}