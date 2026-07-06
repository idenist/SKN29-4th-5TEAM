import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  id,
  options = [],
  placeholder = '선택',
  error,
  helpText,
  required = false,
  className = '',
  ...props
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const messageId = `${selectId}-message`;

  const selectClasses = ['ui-select', error ? 'ui-select-invalid' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ui-field">
      {label ? (
        <label className="ui-label" htmlFor={selectId}>
          {label}
          {required ? <span className="ui-required"> *</span> : null}
        </label>
      ) : null}
      <div className="ui-select-wrap">
        <select
          id={selectId}
          className={selectClasses}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error || helpText ? messageId : undefined}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="ui-select-chevron" size={18} aria-hidden="true" />
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

// Example: <Select label="지역" options={[{ value: 'seoul', label: '서울' }]} />
