import { useCallback, useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile } from '../services/mypageApi.js';
import { deleteProfileImage, uploadProfileImage } from '../services/uploadApi.js';
import { useAuth } from './useAuth.js';

const LOGIN_REQUIRED_MESSAGE = '로그인이 필요한 기능입니다.';

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.responseData?.message;
  const apiReason = error?.responseData?.error?.reason || error?.responseData?.error;
  return apiReason || apiMessage || error?.message || fallback;
};

export function useProfile() {
  const { isAuthenticated, loadMe } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setIsLoading(false);
      setError(LOGIN_REQUIRED_MESSAGE);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const nextProfile = await getMyProfile();
      setProfile(nextProfile);
    } catch (requestError) {
      setError(getErrorMessage(requestError, '프로필을 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = useCallback(
    async (payload) => {
      if (!isAuthenticated) {
        setError(LOGIN_REQUIRED_MESSAGE);
        return null;
      }

      setIsSubmitting(true);
      setError('');
      setMessage('');

      try {
        const updatedProfile = await updateMyProfile(payload);
        setProfile((current) => ({
          ...current,
          ...updatedProfile,
          profile: updatedProfile,
          region: updatedProfile.region,
          interests: updatedProfile.interests,
          profileImage: updatedProfile.profileImage
        }));
        setMessage('프로필을 저장했습니다.');
        await loadMe();
        return updatedProfile;
      } catch (requestError) {
        setError(getErrorMessage(requestError, '프로필 저장에 실패했습니다.'));
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isAuthenticated, loadMe]
  );

  const uploadImage = useCallback(
    async (file) => {
      if (!isAuthenticated) {
        setError(LOGIN_REQUIRED_MESSAGE);
        return null;
      }

      setIsSubmitting(true);
      setError('');
      setMessage('');

      try {
        const result = await uploadProfileImage(file);
        setProfile((current) => ({
          ...current,
          profileImage: result.profile_image_url,
          profileImageUrl: result.profile_image_url,
          profile: {
            ...(current?.profile || {}),
            profileImage: result.profile_image_url,
            profileImageUrl: result.profile_image_url
          }
        }));
        setMessage('프로필 이미지를 업로드했습니다.');
        await loadMe();
        return result;
      } catch (requestError) {
        setError(getErrorMessage(requestError, '이미지 업로드에 실패했습니다.'));
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isAuthenticated, loadMe]
  );

  const deleteImage = useCallback(async () => {
    if (!isAuthenticated) {
      setError(LOGIN_REQUIRED_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      await deleteProfileImage();
      setProfile((current) => ({
        ...current,
        profileImage: '',
        profileImageUrl: '',
        profile: {
          ...(current?.profile || {}),
          profileImage: '',
          profileImageUrl: ''
        }
      }));
      setMessage('프로필 이미지를 삭제했습니다.');
      await loadMe();
    } catch (requestError) {
      setError(getErrorMessage(requestError, '이미지 삭제에 실패했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, loadMe]);

  return {
    profile,
    isLoading,
    isSubmitting,
    error,
    message,
    refetch: fetchProfile,
    saveProfile,
    uploadImage,
    deleteImage
  };
}
