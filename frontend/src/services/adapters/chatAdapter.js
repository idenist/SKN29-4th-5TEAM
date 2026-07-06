const asArray = (value) => (Array.isArray(value) ? value : []);

export const adaptChatRecommendation = (policy = {}) => {
  const itemId = policy.item_id || policy.policy_id || policy.id || '';

  return {
    id: itemId,
    itemId,
    title: policy.title || policy.policy_name || '추천 정책',
    category: policy.domain || policy.source_category || '정책',
    support: policy.benefit_summary || policy.support_content || policy.summary || '상세 내용을 확인해 주세요.',
    reason: policy.personalized_reason || policy.match_reason || policy.reason || '질문과 관련성이 높은 정책입니다.',
    applicationUrl: policy.application_url || policy.action_url || policy.source_url || '',
    badges: asArray(policy.badges),
    raw: policy
  };
};

export const adaptChatResponse = (response = {}) => ({
  answer: response.answer || '',
  recommendedPolicies: asArray(response.recommendations).map(adaptChatRecommendation),
  recommendations: asArray(response.recommendations).map(adaptChatRecommendation),
  sources: asArray(response.sources),
  warnings: asArray(response.warnings),
  error: response.error || null,
  meta: response.meta || {},
  raw: response
});

export const toChatRequest = ({ message, userProfile, topK = 3, conversationId } = {}) => ({
  message,
  user_profile: userProfile,
  top_k: topK,
  conversation_id: conversationId
});
