import apiClient from './apiClient';

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

export const getPopularSearches = async () => {
  const searches = await apiClient.get('/policies/popular-searches/');

  return toArray(searches)
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `popular-search-${index}-${item}`,
          keyword: item,
          count: 0
        };
      }

      const keyword = item?.keyword || item?.search || item?.term || '';

      return {
        id: `popular-search-${index}-${keyword}`,
        keyword,
        count: Number(item?.count || 0),
        lastSearchedAt: item?.last_searched_at || item?.lastSearchedAt || ''
      };
    })
    .filter((item) => item.keyword)
    .slice(0, 10);
};

export default {
  getPopularSearches
};
