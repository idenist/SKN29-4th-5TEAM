import { useCallback, useMemo, useState } from 'react';
import { sendChatMessage } from '../services/chatApi.js';
import { useAuth } from './useAuth.js';

const initialMessages = [
  {
    id: 'ai-welcome',
    role: 'assistant',
    content:
      '안녕하세요. 청년 정책 AI 상담입니다. 거주 지역, 나이, 관심 분야를 알려주면 받을 수 있는 정책을 함께 찾아볼게요.',
    createdAt: new Date().toISOString()
  }
];

function createMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString()
  };
}

function getErrorMessage(error) {
  const apiMessage = error?.responseData?.message;
  const apiReason = error?.responseData?.error?.message || error?.responseData?.error?.reason;

  return apiReason || apiMessage || '답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

function buildUserProfile(user) {
  const profile = user?.profile;

  if (!profile) return undefined;

  return {
    age: profile.age || undefined,
    region: profile.region || undefined,
    interests: profile.interests?.length ? profile.interests : undefined
  };
}

export function useChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(initialMessages);
  const [recommendedPolicies, setRecommendedPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState(undefined);

  const userProfile = useMemo(() => buildUserProfile(user), [user]);

  const sendMessage = useCallback(
    async (message) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || isLoading) return;

      setError('');
      setMessages((current) => [...current, createMessage('user', trimmedMessage)]);
      setIsLoading(true);

      try {
        const response = await sendChatMessage({
          message: trimmedMessage,
          userProfile,
          topK: 3,
          conversationId
        });

        if (response.error) {
          throw Object.assign(new Error(response.error), { responseData: response.raw });
        }

        setMessages((current) => [
          ...current,
          createMessage('assistant', response.answer || '답변 내용이 비어 있습니다.')
        ]);
        setRecommendedPolicies(response.recommendedPolicies);

        const nextConversationId = response.meta?.conversation_id || response.meta?.conversationId;
        if (nextConversationId) {
          setConversationId(nextConversationId);
        }

        // TODO: Display response.sources and response.warnings in a compact support area when the design includes it.
      } catch (requestError) {
        const nextError = getErrorMessage(requestError);
        setError(nextError);
        setMessages((current) => [...current, createMessage('assistant', nextError)]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, isLoading, userProfile]
  );

  const resetChat = useCallback(() => {
    setMessages(initialMessages);
    setRecommendedPolicies([]);
    setIsLoading(false);
    setError('');
    setConversationId(undefined);
  }, []);

  return {
    messages,
    recommendedPolicies,
    isLoading,
    error,
    conversationId,
    sendMessage,
    resetChat
  };
}
