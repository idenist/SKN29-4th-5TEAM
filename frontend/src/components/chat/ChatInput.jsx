import { useState } from 'react';
import { Send } from 'lucide-react';
import Button from '../common/Button.jsx';

export default function ChatInput({ onSubmit, disabled = false }) {
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmedValue = value.trim();
    if (!trimmedValue || disabled) return;

    onSubmit?.(trimmedValue);
    setValue('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="chat-message">
        챗봇에게 질문하기
      </label>
      <textarea
        id="chat-message"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="예: 청년 월세 지원 알려줘"
        rows={2}
        disabled={disabled}
      />
      <Button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        rightIcon={<Send size={17} aria-hidden="true" />}
      >
        전송
      </Button>
    </form>
  );
}
