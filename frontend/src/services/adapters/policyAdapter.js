import { formatDate, formatDateText } from '../../utils/dateFormat.js';

const EMPTY_TEXT = '정보 없음';

const asArray = (value) => (Array.isArray(value) ? value : []);

const firstText = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';

const toValidAge = (value) => {
  if (value === null || value === undefined || value === '') return null;

  const age = Number(value);
  return Number.isFinite(age) && age >= 0 && age <= 120 ? age : null;
};

const formatAge = (policy = {}) => {
  const minAge = toValidAge(policy.age_min);
  const maxAge = toValidAge(policy.age_max);

  if (minAge !== null && maxAge !== null) {
    return minAge === maxAge ? `${minAge}세` : `${minAge}세 ~ ${maxAge}세`;
  }

  if (minAge !== null) return `${minAge}세 이상`;
  if (maxAge !== null) return `${maxAge}세 이하`;

  const targetText = String(policy.participation_target || '').trim();
  if (!targetText) return EMPTY_TEXT;
  if (/연령\s*제한\s*없음|나이\s*제한\s*없음/.test(targetText)) return '연령 제한 없음';

  const numericRangeMatch = targetText.match(/^(\d{1,3})\s*(?:~|-)\s*(\d{1,3})$/);
  if (numericRangeMatch) {
    return `${numericRangeMatch[1]}세 ~ ${numericRangeMatch[2]}세`;
  }

  const numericAgeMatch = targetText.match(/^\d{1,3}$/);
  if (numericAgeMatch) {
    return `${targetText}세`;
  }

  const ageRangeMatch = targetText.match(/(?:만\s*)?\d{1,3}\s*세\s*(?:~|-|부터|이상)\s*(?:만\s*)?\d{1,3}\s*세?/);
  if (ageRangeMatch) {
    return ageRangeMatch[0].replace(/\s+/g, ' ').trim();
  }

  const singleAgeMatch = targetText.match(/(?:만\s*)?\d{1,3}\s*세/);
  if (singleAgeMatch) {
    const age = singleAgeMatch[0].replace(/\s+/g, ' ').trim();
    return age.startsWith('만') ? age : `만 ${age}`;
  }

  return EMPTY_TEXT;
};

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

const regionPrefixLabels = {
  11: '서울',
  26: '부산',
  27: '대구',
  28: '인천',
  29: '광주',
  30: '대전',
  31: '울산',
  36: '세종',
  41: '경기',
  42: '강원',
  43: '충북',
  44: '충남',
  45: '전북',
  46: '전남',
  47: '경북',
  48: '경남',
  50: '제주',
  51: '강원',
  52: '전북'
};

const regionCityLabels = {
  11110: '서울 종로구',
  11140: '서울 중구',
  11170: '서울 용산구',
  11200: '서울 성동구',
  11215: '서울 광진구',
  11230: '서울 동대문구',
  11260: '서울 중랑구',
  11290: '서울 성북구',
  11305: '서울 강북구',
  11320: '서울 도봉구',
  11350: '서울 노원구',
  11380: '서울 은평구',
  11410: '서울 서대문구',
  11440: '서울 마포구',
  11470: '서울 양천구',
  11500: '서울 강서구',
  11530: '서울 구로구',
  11545: '서울 금천구',
  11560: '서울 영등포구',
  11590: '서울 동작구',
  11620: '서울 관악구',
  11650: '서울 서초구',
  11680: '서울 강남구',
  11710: '서울 송파구',
  11740: '서울 강동구',
  44130: '충남 천안시',
  44150: '충남 공주시',
  44180: '충남 보령시',
  44200: '충남 아산시',
  44210: '충남 서산시',
  44230: '충남 논산시',
  44250: '충남 계룡시',
  44270: '충남 당진시',
  51110: '강원 춘천시',
  51130: '강원 원주시',
  51150: '강원 강릉시',
  51170: '강원 동해시',
  51190: '강원 태백시',
  51210: '강원 속초시',
  51230: '강원 삼척시'
};

const normalizeRegionCode = (code) => String(code ?? '').trim();

const parseRegionCodes = (value) => {
  if (value === null || value === undefined || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(parseRegionCodes);
  }

  if (typeof value === 'object') {
    return Object.values(value).flatMap(parseRegionCodes);
  }

  const valueText = String(value).trim();
  if (!valueText) return [];

  if (valueText.startsWith('[') && valueText.endsWith(']')) {
    try {
      const parsed = JSON.parse(valueText);
      return parseRegionCodes(parsed);
    } catch {
      // Fall through and parse as a plain delimited string.
    }
  }

  if (!/^[\d\s,;|/]+$/.test(valueText)) {
    return [];
  }

  return valueText
    .split(/[\s,;|/]+/)
    .map(normalizeRegionCode)
    .filter(Boolean);
};

const getBroadRegionLabel = (code) => {
  const normalizedCode = normalizeRegionCode(code);
  return regionCodeLabels[normalizedCode] || regionPrefixLabels[normalizedCode.slice(0, 2)] || '';
};

const getRegionLabel = (code, useBroadOnly = false) => {
  const normalizedCode = normalizeRegionCode(code);
  if (!normalizedCode) return '';

  if (useBroadOnly) {
    return getBroadRegionLabel(normalizedCode) || normalizedCode;
  }

  return (
    regionCityLabels[normalizedCode]
    || regionCodeLabels[normalizedCode]
    || regionPrefixLabels[normalizedCode.slice(0, 2)]
    || normalizedCode
  );
};

const formatRegion = (policy = {}) => {
  const locationText = String(policy.location ?? '').trim();
  const locationCodes = parseRegionCodes(locationText);

  if (locationText && locationCodes.length === 0) {
    return locationText;
  }

  const regionCodes = [
    ...locationCodes,
    ...parseRegionCodes(policy.region_codes),
    ...parseRegionCodes(policy.region)
  ];
  const broadRegions = [...new Set(regionCodes.map(getBroadRegionLabel).filter(Boolean))];
  const useBroadOnly = regionCodes.length > 1 && broadRegions.length === 1;
  const regions = regionCodes
    .map((code) => getRegionLabel(code, useBroadOnly))
    .filter(Boolean);

  const uniqueRegions = [...new Set(regions)];
  if (uniqueRegions.length > 4) {
    return `${uniqueRegions.slice(0, 4).join(', ')} 외 ${uniqueRegions.length - 4}`;
  }

  return uniqueRegions.join(', ') || EMPTY_TEXT;
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
  deadline: formatDate(policy.application_end_date),
  period: formatDateText(policy.application_period_text || (policy.application_end_date ? `~ ${policy.application_end_date}` : EMPTY_TEXT)),
  age: formatAge(policy),
  income: policy.income_condition || EMPTY_TEXT,
  support: firstText(policy.benefit_text, policy.policy_summary, policy.participation_target, EMPTY_TEXT),
  description: firstText(policy.policy_summary, policy.participation_target, EMPTY_TEXT),
  tags: [policy.domain, mapSourceCategory(policy.source_category), mapDeadlineStatus(policy.deadline_status)].filter(Boolean),
  infoScore: policy.info_score ?? 0,
  applyUrl: policy.application_url || '',
  sourceUrl: policy.source_url || '',
  sourceUrl2: policy.source_url_2 || '',
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
  period: formatDateText(policy.application_period_text || EMPTY_TEXT),
  programPeriod: formatDateText(policy.program_period_text || EMPTY_TEXT),
  age: formatAge(policy),
  income: policy.income_condition || EMPTY_TEXT,
  location: formatRegion(policy),
  relatedPolicies: [],
  raw: policy
});

export const adaptScrap = (scrap = {}) => ({
  id: scrap.id,
  policyId: scrap.policy,
  createdAt: formatDate(scrap.created_at, ''),
  policy: adaptPolicyListItem(scrap.policy_detail || {}),
  raw: scrap
});

export const adaptSearchHistory = (history = {}) => ({
  id: history.id,
  keyword: history.keyword || '',
  searchedAt: formatDate(history.created_at, ''),
  raw: history
});

export const adaptViewedPolicy = (viewed = {}) => ({
  id: viewed.id,
  policyId: viewed.policy,
  viewedAt: formatDate(viewed.viewed_at, ''),
  policy: adaptPolicyListItem(viewed.policy_detail || {}),
  raw: viewed
});

export const adaptPolicies = (policies = []) => asArray(policies).map(adaptPolicyListItem);
export const adaptScraps = (scraps = []) => asArray(scraps).map(adaptScrap);
export const adaptSearchHistories = (items = []) => asArray(items).map(adaptSearchHistory);
export const adaptViewedPolicies = (items = []) => asArray(items).map(adaptViewedPolicy);
