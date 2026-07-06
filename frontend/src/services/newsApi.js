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
  getNews,
  getRecommendations
};
