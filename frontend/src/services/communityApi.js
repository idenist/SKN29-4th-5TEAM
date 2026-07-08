import apiClient from './apiClient';
import { adaptCommunityPost, adaptCommunityPosts } from './adapters/communityAdapter';

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

export default {
  getPosts,
  createPost,
  getPostDetail,
  updatePost,
  deletePost
};
