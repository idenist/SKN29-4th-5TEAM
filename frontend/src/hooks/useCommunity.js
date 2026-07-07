import { useCallback, useEffect, useState } from 'react';
import {
  createPost as createPostRequest,
  deletePost as deletePostRequest,
  getPostDetail,
  getPosts,
  updatePost as updatePostRequest
} from '../services/communityApi.js';
import { useAuth } from './useAuth.js';

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.responseData?.message;
  const apiReason = error?.responseData?.error?.reason || error?.responseData?.error;

  return apiReason || apiMessage || fallback;
};

export function useCommunityPosts() {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const nextPosts = await getPosts();
      setPosts(nextPosts);
    } catch (requestError) {
      setPosts([]);
      setError(getErrorMessage(requestError, '게시글 목록을 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = useCallback(
    async ({ title, content, category }) => {
      if (!isAuthenticated) {
        throw new Error('로그인이 필요한 기능입니다.');
      }

      const post = await createPostRequest({ title, content, category });
      await fetchPosts();
      return post;
    },
    [fetchPosts, isAuthenticated]
  );

  return {
    posts,
    isLoading,
    error,
    fetchPosts,
    refetch: fetchPosts,
    createPost
  };
}

export function useCommunityPost(postId) {
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPostDetail = useCallback(async (config = {}) => {
    if (!postId) return;

    setIsLoading(true);
    setError('');

    let isCanceled = false;

    try {
      const nextPost = await getPostDetail(postId, config);
      setPost(nextPost);
    } catch (requestError) {
      if (requestError.name === 'CanceledError' || requestError.code === 'ERR_CANCELED') {
        isCanceled = true;
        return;
      }
      setPost(null);
      setError(getErrorMessage(requestError, '게시글을 찾을 수 없습니다.'));
    } finally {
      if (!isCanceled) {
        setIsLoading(false);
      }
    }
  }, [postId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchPostDetail({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchPostDetail]);

  const updatePost = useCallback(
    async (payload) => {
      if (!isAuthenticated) {
        throw new Error('로그인이 필요한 기능입니다.');
      }

      const nextPost = await updatePostRequest(postId, payload);
      setPost(nextPost);
      return nextPost;
    },
    [isAuthenticated, postId]
  );

  const deletePost = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('로그인이 필요한 기능입니다.');
    }

    await deletePostRequest(postId);
  }, [isAuthenticated, postId]);

  return {
    post,
    isLoading,
    error,
    fetchPostDetail,
    refetch: fetchPostDetail,
    updatePost,
    deletePost
  };
}
