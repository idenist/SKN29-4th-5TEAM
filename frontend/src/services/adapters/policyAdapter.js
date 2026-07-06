const EMPTY_TEXT = '정보 없음';

const asArray = (value) => (Array.isArray(value) ? value : []);

const firstText = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';

const toList = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  if (typeof value !== 'string' || !value.trim()) {
    return [EMPTY_TEXT];
  }

  return value
    .split(/\r?\n|[;•]/)
    .map((item) => item.replace(/^[-\d.)\s]+/, '').trim())
    .filter(Boolean);
};

export const mapDeadlineStatus = (status) => {
  const statusMap = {
    upcoming: '예정',
    ongoing: '신청가능',
    closing_soon: '마감임박',
    closed: '마감',
    unknown: '확인필요'
  };

  return statusMap[status] || status || '확인필요';
};

export const mapSourceCategory = (sourceCategory) => {
  const categoryMap = {
    policy: '정책',
    startup_notice: '창업',
    training: '교육'
  };

  return categoryMap[sourceCategory] || sourceCategory || EMPTY_TEXT;
};

export const adaptPolicyListItem = (policy = {}) => ({
  id: policy.item_id || policy.id || '',
  itemId: policy.item_id || policy.id || '',
  title: policy.title || EMPTY_TEXT,
  category: policy.domain || mapSourceCategory(policy.source_category),
  sourceCategory: policy.source_category || '',
  region: asArray(policy.region_codes).join(', ') || policy.location || EMPTY_TEXT,
  organization: policy.organization || EMPTY_TEXT,
  status: mapDeadlineStatus(policy.deadline_status),
  deadlineStatus: policy.deadline_status || 'unknown',
  deadline: policy.application_end_date || EMPTY_TEXT,
  period: policy.application_period_text || (policy.application_end_date ? `~ ${policy.application_end_date}` : EMPTY_TEXT),
  age: policy.participation_target || EMPTY_TEXT,
  income: policy.income_condition || EMPTY_TEXT,
  support: firstText(policy.benefit_text, policy.policy_summary, policy.participation_target, EMPTY_TEXT),
  description: firstText(policy.policy_summary, policy.participation_target, EMPTY_TEXT),
  tags: [policy.domain, mapSourceCategory(policy.source_category), mapDeadlineStatus(policy.deadline_status)].filter(Boolean),
  infoScore: policy.info_score ?? 0,
  raw: policy
});

export const adaptPolicyDetail = (policy = {}) => ({
  ...adaptPolicyListItem(policy),
  originalId: policy.original_id || '',
  sourceName: policy.source_name || '',
  summary: policy.policy_summary || EMPTY_TEXT,
  support: firstText(policy.benefit_text, policy.policy_summary, EMPTY_TEXT),
  requirements: toList(policy.participation_target),
  applyMethod: toList(policy.application_method || policy.application_period_text),
  documents: toList(policy.raw_data?.required_documents || policy.raw_data?.documents),
  contact: policy.contact || EMPTY_TEXT,
  applyUrl: policy.application_url || policy.source_url || policy.source_url_2 || '',
  sourceUrl: policy.source_url || '',
  sourceUrl2: policy.source_url_2 || '',
  period: policy.application_period_text || EMPTY_TEXT,
  programPeriod: policy.program_period_text || EMPTY_TEXT,
  age: [policy.age_min, policy.age_max].filter((value) => value !== null && value !== undefined).join('~') || policy.participation_target || EMPTY_TEXT,
  income: policy.income_condition || EMPTY_TEXT,
  location: policy.location || EMPTY_TEXT,
  relatedPolicies: [],
  raw: policy
});

export const adaptScrap = (scrap = {}) => ({
  id: scrap.id,
  policyId: scrap.policy,
  createdAt: scrap.created_at || '',
  policy: adaptPolicyListItem(scrap.policy_detail || {}),
  raw: scrap
});

export const adaptSearchHistory = (history = {}) => ({
  id: history.id,
  keyword: history.keyword || '',
  searchedAt: history.created_at || '',
  raw: history
});

export const adaptViewedPolicy = (viewed = {}) => ({
  id: viewed.id,
  policyId: viewed.policy,
  viewedAt: viewed.viewed_at || '',
  policy: adaptPolicyListItem(viewed.policy_detail || {}),
  raw: viewed
});

export const adaptPolicies = (policies = []) => asArray(policies).map(adaptPolicyListItem);
export const adaptScraps = (scraps = []) => asArray(scraps).map(adaptScrap);
export const adaptSearchHistories = (items = []) => asArray(items).map(adaptSearchHistory);
export const adaptViewedPolicies = (items = []) => asArray(items).map(adaptViewedPolicy);
