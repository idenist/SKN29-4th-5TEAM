const EMPTY_TEXT = '정보 없음';

const asArray = (value) => (Array.isArray(value) ? value : []);

const firstText = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';

const regionCodeLabels = {
  11000: '서울',
  26000: '부산',
  27000: '대구',
  28000: '인천',
  29000: '광주',
  30000: '대전',
  31000: '울산',
  36000: '세종',
  41000: '경기',
  42000: '강원',
  43000: '충북',
  44000: '충남',
  45000: '전북',
  46000: '전남',
  47000: '경북',
  48000: '경남',
  50000: '제주'
};

const formatRegion = (policy = {}) => {
  if (policy.location && String(policy.location).trim()) {
    return String(policy.location).trim();
  }

  const regions = asArray(policy.region_codes)
    .map((code) => regionCodeLabels[String(code)] || String(code))
    .filter(Boolean);

  return regions.join(', ') || EMPTY_TEXT;
};

const toList = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  if (typeof value !== 'string' || !value.trim()) {
    return [EMPTY_TEXT];
  }

  return value
    .split(/\r?\n|[;ㆍ]/)
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
  region: formatRegion(policy),
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
  location: formatRegion(policy),
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
