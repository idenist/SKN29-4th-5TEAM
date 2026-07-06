export default function TypingIndicator() {
  return (
    <div className="chat-typing" role="status" aria-live="polite">
      <span />
      <span />
      <span />
      <p>AI가 답변을 작성 중입니다</p>
    </div>
  );
}
