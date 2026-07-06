import apiClient from './apiClient';
import {
  adaptMe,
  adaptMyNotifications,
  adaptMyPageSummary,
  adaptMyScraps,
  adaptMySearchHistory,
  adaptMyViewedPolicies,
  adaptProfile
} from './adapters/mypageAdapter';

export const getMyPageSummary = async () => {
  const summary = await apiClient.get('/mypage/');
  return adaptMyPageSummary(summary);
};

export const getMyProfile = async () => {
  const profile = await apiClient.get('/mypage/profile/');
  return adaptMe(profile);
};

export const updateMyProfile = async (payload) => {
  const profile = await apiClient.patch('/mypage/profile/update/', payload);
  return adaptProfile(profile);
};

export const getMyScraps = async () => {
  const scraps = await apiClient.get('/mypage/scraps/');
  return adaptMyScraps(scraps);
};

export const getMySearchHistory = async () => {
  const history = await apiClient.get('/mypage/search-history/');
  return adaptMySearchHistory(history);
};

export const getMyViewedPolicies = async () => {
  const viewedPolicies = await apiClient.get('/mypage/viewed-policies/');
  return adaptMyViewedPolicies(viewedPolicies);
};

export const getMyNotifications = async () => {
  const notifications = await apiClient.get('/mypage/notifications/');
  return adaptMyNotifications(notifications);
};

export default {
  getMyPageSummary,
  getMyProfile,
  updateMyProfile,
  getMyScraps,
  getMySearchHistory,
  getMyViewedPolicies,
  getMyNotifications
};
