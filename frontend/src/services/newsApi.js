const cleanText = (text) => {
  if (!text) return '';

  return text
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
};

const formatNewsItem = (item, index) => ({
  id: index + 1,
  title: cleanText(item.title),
  summary: cleanText(item.description),
  source: '네이버 뉴스',
  publishedAt: new Date(item.pubDate).toLocaleDateString('ko-KR').replace(/\.$/, ''),
  date: new Date(item.pubDate).toLocaleDateString('ko-KR').replace(/\.$/, ''),
  category: 'news',
  url: item.link
});

export const getNaverNews = async (keyword = '청년월세지원', display = 10) => {
  const response = await fetch(
    `/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=${display}&sort=date`
  );

  if (!response.ok) {
    throw new Error('API_RESPONSE_FAIL');
  }

  const data = await response.json();
  return (data.items || []).map(formatNewsItem);
};

const notImplemented = (name) => {
  const error = new Error(`${name} API is not implemented on the backend yet.`);
  error.code = 'API_NOT_IMPLEMENTED';
  error.fallback = [];
  throw error;
};

export const getNews = async () => {
  // backend/apps/news/urls.py currently has no URL patterns. Keep page-level mock data until implemented.
  return notImplemented('news');
};

export const getRecommendations = async () => {
  // backend/apps/recommendations/urls.py currently has no URL patterns. Keep page-level mock data until implemented.
  return notImplemented('recommendations');
};

export default {
  getNaverNews,
  getNews,
  getRecommendations
};
