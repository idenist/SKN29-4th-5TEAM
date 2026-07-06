import { Inbox } from 'lucide-react';

export default function EmptyState({
  title = '표시할 내용이 없습니다',
  description,
  icon = <Inbox size={22} aria-hidden="true" />,
  action
}) {
  return (
    <section className="ui-empty" aria-live="polite">
      <span className="ui-empty-icon">{icon}</span>
      <h2 className="ui-empty-title">{title}</h2>
      {description ? <p className="ui-empty-description">{description}</p> : null}
      {action}
    </section>
  );
}

// Example: <EmptyState title="검색 결과가 없습니다" />
