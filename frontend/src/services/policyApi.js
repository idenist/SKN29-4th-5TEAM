import apiClient from './apiClient';
import {
  adaptPolicies,
  adaptPolicyDetail,
  adaptScrap,
  adaptScraps,
  adaptSearchHistories,
  adaptViewedPolicies
} from './adapters/policyAdapter';

const allValues = new Set(['전체', '', undefined, null]);

const sourceCategoryMap = {
  정책: 'policy',
  주거: 'policy',
  금융: 'policy',
  복지: 'policy',
  창업: 'startup_notice',
  취업: 'training',
  교육: 'training',
  policy: 'policy',
  startup_notice: 'startup_notice',
  training: 'training'
};

const regionCodeMap = {
  서울: '11000',
  부산: '26000',
  대구: '27000',
  인천: '28000',
  광주: '29000',
  대전: '30000',
  울산: '31000',
  세종: '36000',
  경기: '41000',
  강원: '42000',
  충북: '43000',
  충남: '44000',
  전북: '45000',
  전남: '46000',
  경북: '47000',
  경남: '48000',
  제주: '50000'
};

const deadlineStatusMap = {
  예정: 'upcoming',
  신청가능: 'ongoing',
  마감임박: 'closing_soon',
  마감: 'closed',
  확인필요: 'unknown'
};

const normalizeSourceCategoryParam = (value) => {
  if (allValues.has(value)) return undefined;
  return sourceCategoryMap[value] || value;
};

const normalizeRegionParam = (value) => {
  if (allValues.has(value)) return undefined;
  return regionCodeMap[value] || value;
};

const normalizeDeadlineStatusParam = (value) => {
  if (allValues.has(value)) return undefined;
  return deadlineStatusMap[value] || value;
};

const toPolicyParams = (params = {}) => ({
  keyword: params.keyword || params.search || undefined,
  region: normalizeRegionParam(params.region),
  source_category: normalizeSourceCategoryParam(params.sourceCategory || params.source_category),
  domain: allValues.has(params.domain || params.category) ? undefined : params.domain || params.category,
  age: params.age || undefined,
  income_condition: allValues.has(params.incomeCondition || params.income_condition || params.income)
    ? undefined
    : params.incomeCondition || params.income_condition || params.income,
  deadline_status: normalizeDeadlineStatusParam(params.deadlineStatus || params.deadline_status || params.status),
  limit: params.limit || undefined,
  offset: params.offset || undefined
});

export const getPolicies = async (params = {}) => {
  const policies = await apiClient.get('/policies/', { params: toPolicyParams(params) });
  return adaptPolicies(policies);
};

export const getPolicyDetail = async (itemId) => {
  const policy = await apiClient.get(`/policies/${itemId}/`);
  return adaptPolicyDetail(policy);
};

export const getScraps = async () => {
  const scraps = await apiClient.get('/policies/scraps/');
  return adaptScraps(scraps);
};

export const createScrap = async (itemId) => {
  const scrap = await apiClient.post('/policies/scraps/', { policy: itemId });
  return adaptScrap(scrap);
};

export const deleteScrap = (itemId) => apiClient.delete(`/policies/scraps/${itemId}/`);

export const getSearchHistory = async () => {
  const history = await apiClient.get('/policies/search-history/');
  return adaptSearchHistories(history);
};

export const getViewedPolicies = async () => {
  const viewedPolicies = await apiClient.get('/policies/viewed/');
  return adaptViewedPolicies(viewedPolicies);
};

export default {
  getPolicies,
  getPolicyDetail,
  getScraps,
  createScrap,
  deleteScrap,
  getSearchHistory,
  getViewedPolicies
};
