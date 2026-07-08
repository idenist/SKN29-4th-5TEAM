import { adaptNotificationList } from './notificationAdapter';
import { adaptPolicyListItem, adaptSearchHistories } from './policyAdapter';
import { formatDate } from '../../utils/dateFormat.js';

const asArray = (value) => (Array.isArray(value) ? value : []);

export const adaptProfile = (profile = {}) => ({
  age: profile.age ?? '',
  region: profile.region || '',
  interests: asArray(profile.interests),
  profileImage: profile.profile_image_url || '',
  profileImageUrl: profile.profile_image_url || '',
  createdAt: formatDate(profile.created_at, ''),
  updatedAt: formatDate(profile.updated_at, ''),
  raw: profile
});

export const adaptMe = (me = {}) => {
  const profile = adaptProfile(me.profile || {});

  return {
    id: me.id,
    email: me.email || '',
    username: me.username || '',
    name: me.username || '',
    nickname: me.username || me.email || '사용자',
    region: profile.region || '지역 미설정',
    age: profile.age,
    interests: profile.interests,
    profileImage: profile.profileImage,
    profile,
    dateJoined: formatDate(me.date_joined, ''),
    raw: me
  };
};

export const adaptMyPageSummary = (summary = {}) => ({
  profile: adaptProfile(summary.profile || {}),
  summary: {
    scrapsCount: summary.scrap_count ?? 0,
    viewedCount: asArray(summary.recent_viewed_policies).length,
    searchCount: asArray(summary.recent_searches).length,
    unreadNotifications: summary.unread_notification_count ?? 0
  },
  searchHistory: asArray(summary.recent_searches).map((keyword, index) => ({
    id: `search-${index}-${keyword}`,
    keyword,
    searchedAt: ''
  })),
  viewedPolicies: asArray(summary.recent_viewed_policies).map((policy) => ({
    id: policy.item_id || '',
    itemId: policy.item_id || '',
    title: policy.title || '정책',
    category: '정책',
    viewedAt: formatDate(policy.viewed_at, ''),
    raw: policy
  })),
  raw: summary
});

export const adaptMyScraps = (scraps = []) =>
  asArray(scraps).map((scrap) => ({
    ...adaptPolicyListItem(scrap.policy_detail || {}),
    scrapId: scrap.id,
    createdAt: formatDate(scrap.created_at, ''),
    raw: scrap
  }));

export const adaptMySearchHistory = adaptSearchHistories;

export const adaptMyViewedPolicies = (items = []) =>
  asArray(items).map((viewed) => ({
    ...adaptPolicyListItem(viewed.policy_detail || {}),
    viewedAt: formatDate(viewed.viewed_at, ''),
    raw: viewed
  }));

export const adaptMyNotifications = (payload = {}) => {
  const adapted = adaptNotificationList(payload);

  return {
    ...adapted,
    notifications: adapted.notifications.map((notification) => ({
      ...notification,
      content: notification.message
    }))
  };
};
