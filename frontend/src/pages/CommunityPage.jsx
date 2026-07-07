import { useMemo, useState } from 'react';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Pagination from '../components/common/Pagination.jsx';
import Spinner from '../components/common/Spinner.jsx';
import CommunityToolbar from '../components/community/CommunityToolbar.jsx';
import PostEditorModal from '../components/community/PostEditorModal.jsx';
import PostList from '../components/community/PostList.jsx';
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
    <div className="community-page">
      <PageHeader
        kicker="Community"
        title="청년 커뮤니티"
        description="정책 후기, 질문, 정보를 함께 나눠보세요."
      />

      <CommunityToolbar
        keyword={keyword}
        onKeywordChange={setKeyword}
        onSearch={handleSearch}
        category={category}
        onCategoryChange={handleCategoryChange}
        onWriteClick={handleWriteClick}
      />

      <section className="community-summary" aria-label="검색 결과 요약">
        <strong>{filteredPosts.length}개 게시글</strong>
        <span>{submittedKeyword ? `검색어: ${submittedKeyword}` : '전체 게시글을 표시 중입니다.'}</span>
      </section>

      {isLoading ? (
        <Spinner label="게시글을 불러오는 중..." />
      ) : error ? (
        <ErrorState title="게시글 목록을 불러오지 못했습니다" description={error} onRetry={refetch} />
      ) : filteredPosts.length > 0 ? (
        <>
          <PostList posts={pagedPosts} />
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
