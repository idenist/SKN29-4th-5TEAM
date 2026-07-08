const EMPTY_DATE = '정보 없음';

const pad2 = (value) => String(value).padStart(2, '0');

const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

export const formatDate = (value, fallback = EMPTY_DATE) => {
  if (!value) return fallback;

  if (value instanceof Date) {
    return isValidDate(value)
      ? `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`
      : fallback;
  }

  const valueText = String(value).trim();
  if (!valueText) return fallback;

  const compactMatch = valueText.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;
  }

  const separatedMatch = valueText.match(/^(\d{4})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/);
  if (separatedMatch) {
    return `${separatedMatch[1]}-${pad2(separatedMatch[2])}-${pad2(separatedMatch[3])}`;
  }

  const parsedDate = new Date(valueText);
  if (isValidDate(parsedDate)) {
    return `${parsedDate.getFullYear()}-${pad2(parsedDate.getMonth() + 1)}-${pad2(parsedDate.getDate())}`;
  }

  return fallback;
};

export const formatDateText = (value, fallback = EMPTY_DATE) => {
  if (!value) return fallback;

  const valueText = String(value).trim();
  if (!valueText) return fallback;

  const normalized = valueText
    .replace(/\b(\d{4})(\d{2})(\d{2})\b/g, '$1-$2-$3')
    .replace(/\b(\d{4})[./](\d{1,2})[./](\d{1,2})\.?\b/g, (_, year, month, day) => (
      `${year}-${pad2(month)}-${pad2(day)}`
    ))
    .replace(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/g, (_, year, month, day) => (
      `${year}-${pad2(month)}-${pad2(day)}`
    ));

  return normalized || fallback;
};
