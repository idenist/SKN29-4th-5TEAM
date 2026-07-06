import { useId } from 'react';

export default function Input({
  label,
  id,
  error,
  helpText,
  required = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const messageId = `${inputId}-message`;

  const inputClasses = [
    'ui-input',
    leftIcon ? 'ui-input-has-left' : '',
    rightIcon ? 'ui-input-has-right' : '',
    error ? 'ui-input-invalid' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ui-field">
      {label ? (
        <label className="ui-label" htmlFor={inputId}>
          {label}
          {required ? <span className="ui-required"> *</span> : null}
        </label>
      ) : null}
      <div className="ui-input-wrap">
        {leftIcon ? <span className="ui-input-icon ui-input-icon-left">{leftIcon}</span> : null}
        <input
          id={inputId}
          className={inputClasses}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error || helpText ? messageId : undefined}
          {...props}
        />
        {rightIcon ? <span className="ui-input-icon ui-input-icon-right">{rightIcon}</span> : null}
      </div>
      {error ? (
        <p id={messageId} className="ui-error">
          {error}
        </p>
      ) : helpText ? (
        <p id={messageId} className="ui-help">
          {helpText}
        </p>
      ) : null}
    </div>
  );
}

// Example: <Input label="이메일" type="email" placeholder="you@example.com" />
