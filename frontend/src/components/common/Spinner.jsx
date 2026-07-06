export default function Spinner({ label = '불러오는 중', size = 'md', showLabel = true }) {
  return (
    <span className={`ui-spinner ui-spinner-${size}`} role="status" aria-live="polite">
      <span className="ui-spinner-mark" aria-hidden="true" />
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </span>
  );
}

// Example: <Spinner label="정책을 불러오는 중" />
