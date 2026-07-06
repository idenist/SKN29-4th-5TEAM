const asArray = (value) => (Array.isArray(value) ? value : []);

export const adaptCommunityPost = (post = {}) => ({
  id: String(post.id ?? ''),
  title: post.title || '제목 없음',
  category: post.category || '일반',
  author: post.author_email || post.author || '익명',
  authorEmail: post.author_email || '',
  createdAt: post.created_at || '',
  updatedAt: post.updated_at || '',
  content: post.content || post.content_preview || '',
  summary: post.content_preview || post.content || '',
  views: post.view_count ?? post.views ?? 0,
  likes: post.likes ?? 0,
  commentsCount: post.commentsCount ?? post.comments_count ?? 0,
  tags: asArray(post.tags),
  raw: post
});

export const adaptCommunityPosts = (posts = []) => asArray(posts).map(adaptCommunityPost);
