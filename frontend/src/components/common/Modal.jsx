import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  title,
  description,
  children,
  onClose,
  closeLabel = '닫기',
  width = '520px'
}) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ui-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        style={{ '--modal-width': width }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="ui-modal-header">
          <div>
            {title ? (
              <h2 id={titleId} className="ui-modal-title">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id={descriptionId} className="ui-modal-description">
                {description}
              </p>
            ) : null}
          </div>
          <button type="button" className="ui-modal-close" onClick={onClose} aria-label={closeLabel}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="ui-modal-body">{children}</div>
      </section>
    </div>
  );
}

// Example: <Modal isOpen={open} title="확인" onClose={() => setOpen(false)}>내용</Modal>
