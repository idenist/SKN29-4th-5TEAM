import { AlertCircle } from 'lucide-react';
import Button from './Button.jsx';

export default function ErrorState({
  title = '문제가 발생했습니다',
  description = '잠시 후 다시 시도해 주세요.',
  onRetry,
  retryLabel = '다시 시도'
}) {
  return (
    <section className="ui-error-state" role="alert">
      <span className="ui-error-icon">
        <AlertCircle size={22} aria-hidden="true" />
      </span>
      <h2 className="ui-error-title">{title}</h2>
      <p className="ui-error-description">{description}</p>
      {onRetry ? (
        <Button type="button" variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </section>
  );
}

// Example: <ErrorState onRetry={refetch} />
