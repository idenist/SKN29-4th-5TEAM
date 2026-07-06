import Button from '../common/Button.jsx';

export default function ChatShell({ children, examples = [], onExampleClick, sideContent }) {
  return (
    <div className="chat-layout">
      <section className="chat-main-panel" aria-label="AI 챗봇 대화">
        <div className="chat-examples" aria-label="추천 질문">
          <p>추천 질문</p>
          <div>
            {examples.map((question) => (
              <Button key={question} type="button" variant="secondary" size="sm" onClick={() => onExampleClick?.(question)}>
                {question}
              </Button>
            ))}
          </div>
        </div>
        {children}
      </section>
      <aside className="chat-side-panel" aria-label="추천 정책">
        {sideContent}
      </aside>
    </div>
  );
}
