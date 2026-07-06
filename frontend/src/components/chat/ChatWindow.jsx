import EmptyState from '../common/EmptyState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import ChatMessage from './ChatMessage.jsx';
import TypingIndicator from './TypingIndicator.jsx';

export default function ChatWindow({ messages = [], isLoading = false, error = '' }) {
  return (
    <div className="chat-window" aria-live="polite">
      {messages.length === 0 ? (
        <EmptyState title="아직 대화가 없습니다" description="질문을 입력하면 AI 상담 흐름이 시작됩니다." />
      ) : (
        <div className="chat-message-list">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading ? <TypingIndicator /> : null}
        </div>
      )}
      {error ? <ErrorState title="답변 생성 실패" description={error} /> : null}
    </div>
  );
}
