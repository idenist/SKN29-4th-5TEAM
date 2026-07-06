import { Bookmark } from 'lucide-react';
import Button from '../common/Button.jsx';

export default function ScrapButton({ isScrapped = false, isLoading = false, onToggle }) {
  return (
    <Button
      type="button"
      variant={isScrapped ? 'secondary' : 'ghost'}
      leftIcon={<Bookmark size={18} fill={isScrapped ? 'currentColor' : 'none'} aria-hidden="true" />}
      onClick={onToggle}
      aria-pressed={isScrapped}
      disabled={isLoading}
    >
      {isLoading ? '처리 중...' : isScrapped ? '스크랩됨' : '스크랩'}
    </Button>
  );
}
