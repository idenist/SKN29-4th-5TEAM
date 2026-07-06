function formatTime(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <article className={isUser ? 'chat-message chat-message-user' : 'chat-message chat-message-ai'}>
      <div className="chat-message-bubble">
        <p>{message.content}</p>
      </div>
      <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
    </article>
  );
}
