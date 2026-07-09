import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import Pagination from '../components/common/Pagination.jsx';
import Spinner from '../components/common/Spinner.jsx';
import CommunityToolbar from '../components/community/CommunityToolbar.jsx';
import PostEditorModal from '../components/community/PostEditorModal.jsx';
import { useCommunityPosts } from '../hooks/useCommunity.js';
import { communityCategoryLabels } from '../services/adapters/communityAdapter.js';  // ← 새로 추가


// 백엔드 CommunityPost.Category 와 동일하게 맞춘 매핑
const PAGE_SIZE = 5;

const CATEGORY_COLORS = {
  general:    { bg: '#faf5ff', color: '#8b5cf6' },
  housing:    { bg: '#eff6ff', color: '#3b82f6' },
  finance:    { bg: '#fefce8', color: '#ca8a04' },
  employment: { bg: '#ecfdf5', color: '#10b981' },
  education:  { bg: '#fdf2f8', color: '#db2777' },
  startup:    { bg: '#fff7ed', color: '#ea580c' },
  etc:        { bg: '#f1f5f9', color: '#64748b' },
};


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
    <div style={{ backgroundColor: 'transparent', minHeight: '100vh', padding: '40px 60px', fontFamily: 'inherit' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }}>커뮤니티</h1>
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
          <div className="community-table-view" style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.01)' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #edf2f7', color: '#475569', fontSize: '14px', fontWeight: '600' }}>
                    <th style={{ padding: '18px 24px', width: '100px', textAlign: 'center' }}>분류</th>
                    <th style={{ padding: '18px 24px' }}>제목</th>
                    <th style={{ padding: '18px 24px', width: '140px', textAlign: 'center' }}>작성자</th>
                    <th style={{ padding: '18px 24px', width: '100px', textAlign: 'center' }}>조회</th>
                    <th style={{ padding: '18px 24px', width: '100px', textAlign: 'center' }}>좋아요</th>
                    <th style={{ padding: '18px 24px', width: '100px', textAlign: 'center' }}>댓글</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedPosts.map((post) => {
                    // 🟢 분류 데이터 값에 따른 둥근 원형 배지 가변 스타일 분기 정의
                    const meta = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.etc;
                    const badgeStyle = { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2', backgroundColor: meta.bg, color: meta.color };
                    const categoryLabel = post.categoryLabel || communityCategoryLabels[post.category] || '기타';

                    return (
                      <tr key={post.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '15px', color: '#334155' }}>
                        {/* 분류 배지 (원형 세로 정렬 분기) */}
                        <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                          <span style={badgeStyle}>
                            {categoryLabel[0]}<br/>{categoryLabel[1]}
                          </span>
                        </td>
                        {/* 제목 링크 */}
                        <td style={{ padding: '14px 24px', fontWeight: '500', color: '#1e293b' }}>
                          <Link
                            to={`/community/${post.id}`}
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            {post.title}
                          </Link>
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
                        <td style={{ padding: '14px 24px', textAlign: 'center', color: '#64748b' }}>
                          {post.commentsCount !== undefined ? post.commentsCount.toLocaleString() : '0'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="community-card-view">
            {pagedPosts.map((post) => {
              const meta = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.etc;
              const badgeStyle = { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2', backgroundColor: meta.bg, color: meta.color, flexShrink: 0 };
              const categoryLabel = post.categoryLabel || communityCategoryLabels[post.category] || '기타';

              return (
                <Link key={post.id} to={`/community/${post.id}`} className="community-card-item">
                  <div className="community-card-top">
                    <span style={badgeStyle}>
                      {categoryLabel[0]}<br/>{categoryLabel[1]}
                    </span>
                    <h3>{post.title}</h3>
                  </div>
                  <div className="community-card-meta-row">
                    <span>{post.authorName || post.author || '청년유저'}</span>
                    <span>조회 {post.views !== undefined ? post.views.toLocaleString() : '0'}</span>
                    <span>좋아요 {post.likes !== undefined ? post.likes.toLocaleString() : '0'}</span>
                    <span>댓글 {post.commentsCount !== undefined ? post.commentsCount.toLocaleString() : '0'}</span>
                  </div>
                </Link>
              );
            })}
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
