const asArray = (value) => (Array.isArray(value) ? value : []);

export const communityCategoryLabels = {
  general: '일반',
  housing: '주거',
  finance: '금융',
  employment: '취업',
  education: '교육',
  startup: '창업',
  etc: '기타'
};

export const communityCategoryOptions = Object.entries(communityCategoryLabels).map(([value, label]) => ({
  value,
  label
}));

export const adaptCommunityComment = (comment = {}) => ({
  id: String(comment.id ?? ''),
  postId: String(comment.post ?? ''),
  authorId: comment.author_id != null ? String(comment.author_id) : comment.author != null ? String(comment.author) : '',
  author: comment.author_name || comment.author_email || comment.author || '익명',
  content: comment.content || '',
  createdAt: comment.created_at || '',
  updatedAt: comment.updated_at || '',
  raw: comment
});

export const adaptCommunityPost = (post = {}) => ({
  id: String(post.id ?? ''),
  title: post.title || '제목 없음',
  category: post.category || 'general',
  categoryLabel: post.category_label || communityCategoryLabels[post.category] || '일반',
  authorId: post.author_id != null ? String(post.author_id) : post.author != null ? String(post.author) : '',
  author: post.author_name || post.author_email || post.author || '익명',
  authorEmail: post.author_email || '',
  createdAt: post.created_at || '',
  updatedAt: post.updated_at || '',
  content: post.content || post.content_preview || '',
  summary: post.content_preview || post.content || '',
  views: post.view_count ?? post.views ?? 0,
  likes: post.likes ?? post.like_count ?? 0,
  isLiked: Boolean(post.is_liked ?? post.isLiked),
  commentsCount: post.commentsCount ?? post.comment_count ?? post.comments_count ?? 0,
  comments: asArray(post.comments).map(adaptCommunityComment),
  tags: asArray(post.tags),
  raw: post
});

export const adaptCommunityPosts = (posts = []) => asArray(posts).map(adaptCommunityPost);
export const adaptCommunityComments = (comments = []) => asArray(comments).map(adaptCommunityComment);
