import apiClient from './apiClient';
import { adaptMe, adaptProfile } from './adapters/mypageAdapter';

export const signup = ({ email, username, password, passwordConfirm }) =>
  apiClient.post('/auth/signup/', {
    email,
    username,
    password,
    password_confirm: passwordConfirm
  });

export const login = ({ email, password }) =>
  apiClient.post('/auth/login/', {
    email,
    password
  });

export const refreshToken = (refresh) =>
  apiClient.post('/auth/token/refresh/', {
    refresh
  });

export const getMe = async () => {
  const me = await apiClient.get('/auth/me/');
  return adaptMe(me);
};

export const updateProfile = async (payload) => {
  const profile = await apiClient.patch('/auth/profile/', payload);
  return adaptProfile(profile);
};

export default {
  signup,
  login,
  refreshToken,
  getMe,
  updateProfile
};
