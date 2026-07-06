import { Search } from 'lucide-react';
import Button from './Button.jsx';

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = '검색어를 입력하세요',
  buttonLabel = '검색',
  label = '검색어',
  name = 'q',
  disabled = false
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form className="ui-search" role="search" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={name}>
        {label}
      </label>
      <span className="ui-search-icon">
        <Search size={18} aria-hidden="true" />
      </span>
      <input
        id={name}
        name={name}
        className="ui-search-input"
        type="search"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <Button type="submit" disabled={disabled}>
        {buttonLabel}
      </Button>
    </form>
  );
}

// Example: <SearchBar value={keyword} onChange={setKeyword} onSubmit={handleSearch} />
