import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const ACCESS_TOKEN_KEY = 'accessToken';
export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data;

    if (payload && typeof payload === 'object' && 'success' in payload) {
      if (payload.success) {
        return payload.data;
      }

      const error = new Error(payload.message || 'API request failed');
      error.responseData = payload;
      error.status = response.status;
      error.apiError = payload.error;
      throw error;
    }

    // SimpleJWT refresh responses are not wrapped with { success, data, message, error }.
    return payload;
  },
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(ACCESS_TOKEN_KEY)) {
      window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
    }

    const payload = error.response?.data;

    if (payload && typeof payload === 'object' && 'success' in payload) {
      const normalizedError = new Error(payload.message || 'API request failed');
      normalizedError.responseData = payload;
      normalizedError.status = error.response?.status;
      normalizedError.apiError = payload.error;
      return Promise.reject(normalizedError);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
