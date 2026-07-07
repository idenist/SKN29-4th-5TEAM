import apiClient from './apiClient';
import { adaptMe, adaptProfile } from './adapters/mypageAdapter';

export const signup = ({ email, username, password, passwordConfirm, verificationCode }) =>
  apiClient.post('/auth/signup/', {
    email,
    username,
    password,
    password_confirm: passwordConfirm,
    verification_code: verificationCode
  });

export const sendSignupVerificationEmail = ({ email }) =>
  apiClient.post('/auth/signup/email/send/', {
    email
  });

export const confirmSignupVerificationEmail = ({ email, code }) =>
  apiClient.post('/auth/signup/email/confirm/', {
    email,
    code
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

export const sendPasswordResetEmail = ({ email }) =>
  apiClient.post('/auth/password-reset/email/send/', {
    email
  });

export const resetPassword = ({ email, code, newPassword, newPasswordConfirm }) =>
  apiClient.post('/auth/password-reset/', {
    email,
    code,
    new_password: newPassword,
    new_password_confirm: newPasswordConfirm
  });

export const changePassword = ({ currentPassword, newPassword, newPasswordConfirm }) =>
  apiClient.post('/auth/password-change/', {
    current_password: currentPassword,
    new_password: newPassword,
    new_password_confirm: newPasswordConfirm
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
  sendSignupVerificationEmail,
  confirmSignupVerificationEmail,
  login,
  refreshToken,
  sendPasswordResetEmail,
  resetPassword,
  changePassword,
  getMe,
  updateProfile
};
