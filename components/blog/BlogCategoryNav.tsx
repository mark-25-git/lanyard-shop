import Link from 'next/link';

interface BlogCategoryNavProps {
  categories: string[];
  activeCategorySlug?: string | null;
}

/**
 * Renders a left-hand navigation similar to the reference layout:
 * - "All Posts" link
 * - Category links
 * Highlights the active category when provided.
 */
export default function BlogCategoryNav({
  categories,
  activeCategorySlug = null,
}: BlogCategoryNavProps) {
  return (
    <nav className="blog-category-nav" aria-label="Blog categories">
      <Link
        href="/blog"
        className={`blog-category-link ${!activeCategorySlug ? 'active' : ''}`}
      >
        All Posts
      </Link>

      <div className="blog-category-list">
        {categories.map((category) => {
          const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
          const isActive = activeCategorySlug === categorySlug;
          return (
            <Link
              key={category}
              href={`/blog/category/${categorySlug}`}
              className={`blog-category-link ${isActive ? 'active' : ''}`}
            >
              {category}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

