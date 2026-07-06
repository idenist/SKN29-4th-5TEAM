import apiClient from './apiClient';
import { adaptChatResponse, toChatRequest } from './adapters/chatAdapter';

export const sendChatMessage = async ({ message, userProfile, topK = 3, conversationId } = {}) => {
  const response = await apiClient.post('/ai/chat/', toChatRequest({
    message,
    userProfile,
    topK,
    conversationId
  }));

  return adaptChatResponse(response);
};

export default {
  sendChatMessage
};
