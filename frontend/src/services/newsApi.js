import apiClient from './apiClient';

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
  const items = await apiClient.get('/news/', {
    params: { query: keyword, display }
  });
  return (items || []).map(formatNewsItem);
};

export default { getNaverNews };