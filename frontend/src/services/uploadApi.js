import apiClient from './apiClient';

export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  return apiClient.post('/uploads/profile-image/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const deleteProfileImage = () => apiClient.delete('/uploads/profile-image/');

export default {
  uploadProfileImage,
  deleteProfileImage
};
