import apiClient from './apiClient';
import { adaptCommunityComment, adaptCommunityPost, adaptCommunityPosts } from './adapters/communityAdapter';

export const getPosts = async () => {
  const posts = await apiClient.get('/community/posts/');
  return adaptCommunityPosts(posts);
};

export const createPost = async ({ title, content, category = 'general' }) => {
  const post = await apiClient.post('/community/posts/', { title, content, category });
  return adaptCommunityPost(post);
};

export const getPostDetail = async (postId, config = {}) => {
  const post = await apiClient.get(`/community/posts/${postId}/`, config);
  return adaptCommunityPost(post);
};

export const updatePost = async (postId, payload) => {
  const post = await apiClient.patch(`/community/posts/${postId}/`, payload);
  return adaptCommunityPost(post);
};

export const deletePost = (postId) => apiClient.delete(`/community/posts/${postId}/`);

export const togglePostLike = async (postId) => {
  const payload = await apiClient.post(`/community/posts/${postId}/like/`);
  return {
    postId: String(payload.post_id ?? postId),
    likes: payload.likes ?? 0,
    isLiked: Boolean(payload.is_liked)
  };
};

export const createComment = async (postId, content) => {
  const comment = await apiClient.post(`/community/posts/${postId}/comments/`, { content });
  return adaptCommunityComment(comment);
};

export default {
  getPosts,
  createPost,
  getPostDetail,
  updatePost,
  deletePost,
  togglePostLike,
  createComment
};
