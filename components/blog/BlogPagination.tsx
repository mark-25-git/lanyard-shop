import Link from 'next/link';

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export default function BlogPagination({
  currentPage,
  totalPages,
  baseUrl,
}: BlogPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const getPageUrl = (page: number) => {
    if (page === 1) {
      return baseUrl;
    }
    return `${baseUrl}?page=${page}`;
  };

  return (
    <nav className="blog-pagination" aria-label="Blog pagination">
      <div className="blog-pagination-inner">
        {currentPage > 1 && (
          <Link
            href={getPageUrl(currentPage - 1)}
            className="blog-pagination-link blog-pagination-prev"
          >
            ← Previous
          </Link>
        )}

        <div className="blog-pagination-pages">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <Link
                  key={page}
                  href={getPageUrl(page)}
                  className={`blog-pagination-link blog-pagination-page ${
                    page === currentPage ? 'active' : ''
                  }`}
                >
                  {page}
                </Link>
              );
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return (
                <span key={page} className="blog-pagination-ellipsis">
                  ...
                </span>
              );
            }
            return null;
          })}
        </div>

        {currentPage < totalPages && (
          <Link
            href={getPageUrl(currentPage + 1)}
            className="blog-pagination-link blog-pagination-next"
          >
            Next →
          </Link>
        )}
      </div>
    </nav>
  );
}









