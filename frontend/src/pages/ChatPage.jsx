import PageHeader from '../components/common/PageHeader.jsx';
import ChatInput from '../components/chat/ChatInput.jsx';
import ChatShell from '../components/chat/ChatShell.jsx';
import ChatWindow from '../components/chat/ChatWindow.jsx';
import RecommendedPolicyList from '../components/chat/RecommendedPolicyList.jsx';
import { useChat } from '../hooks/useChat.js';

const exampleQuestions = [
  '청년 월세 지원 알려줘',
  '취업 준비 중인데 받을 수 있는 정책이 있을까?',
  '서울에 사는 20대 금융 지원을 추천해줘',
  '마감 임박한 청년 정책을 알려줘'
];

export default function ChatPage() {
  const {
    messages,
    recommendedPolicies,
    isLoading,
    error,
    sendMessage
  } = useChat();

  return (
    <div className="chat-page">
      <PageHeader
        kicker="AI Chat"
        title="AI 안쉼 챗봇"
        description="질문을 입력하면 실제 AI 정책 상담 API를 통해 답변과 추천 정책을 받아옵니다."
      />

      <ChatShell
        examples={exampleQuestions}
        onExampleClick={sendMessage}
        sideContent={<RecommendedPolicyList policies={recommendedPolicies} />}
      >
        <ChatWindow messages={messages} isLoading={isLoading} error={error} />
        <ChatInput onSubmit={sendMessage} disabled={isLoading} />
      </ChatShell>
    </div>
  );
}
