import { formatDate } from '../../utils/dateFormat.js';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <article className={isUser ? 'chat-message chat-message-user' : 'chat-message chat-message-ai'}>
      <div className="chat-message-bubble">
        <p>{message.content}</p>
      </div>
      <time dateTime={message.createdAt}>{formatDate(message.createdAt, '')}</time>
    </article>
  );
}
