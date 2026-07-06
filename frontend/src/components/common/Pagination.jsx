import { ChevronLeft, ChevronRight } from 'lucide-react';

function getPageNumbers(page, totalPages, siblingCount) {
  const start = Math.max(1, page - siblingCount);
  const end = Math.min(totalPages, page + siblingCount);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  siblingCount = 2,
  ariaLabel = '페이지 이동'
}) {
  const safeTotalPages = Math.max(1, totalPages);
  const pages = getPageNumbers(page, safeTotalPages, siblingCount);

  const goToPage = (nextPage) => {
    if (nextPage >= 1 && nextPage <= safeTotalPages && nextPage !== page) {
      onPageChange?.(nextPage);
    }
  };

  return (
    <nav className="ui-pagination" aria-label={ariaLabel}>
      <button
        type="button"
        className="ui-pagination-button"
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        aria-label="이전 페이지"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          className={pageNumber === page ? 'ui-pagination-button ui-pagination-active' : 'ui-pagination-button'}
          onClick={() => goToPage(pageNumber)}
          aria-current={pageNumber === page ? 'page' : undefined}
        >
          {pageNumber}
        </button>
      ))}
      <button
        type="button"
        className="ui-pagination-button"
        onClick={() => goToPage(page + 1)}
        disabled={page >= safeTotalPages}
        aria-label="다음 페이지"
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}

// Example: <Pagination page={page} totalPages={10} onPageChange={setPage} />
