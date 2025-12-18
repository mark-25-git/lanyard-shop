import Link from 'next/link';
import { getAllCategories, getTags, getFeaturedPosts } from '@/lib/blog';

export default function BlogSidebar() {
  const categories = getAllCategories();
  const tags = getTags();
  const featuredPosts = getFeaturedPosts(3);

  return (
    <aside className="blog-sidebar">
      <div className="blog-sidebar-section">
        <h3>Categories</h3>
        <ul className="blog-sidebar-list">
          {categories.map((category) => {
            const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
            return (
              <li key={category}>
                <Link href={`/blog/category/${categorySlug}`}>
                  {category}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {tags.length > 0 && (
        <div className="blog-sidebar-section">
          <h3>Tags</h3>
          <div className="blog-sidebar-tags">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="blog-sidebar-tag"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {featuredPosts.length > 0 && (
        <div className="blog-sidebar-section">
          <h3>Featured Posts</h3>
          <ul className="blog-sidebar-featured">
            {featuredPosts.map((post) => {
              const categorySlug = post.category.toLowerCase().replace(/\s+/g, '-');
              return (
                <li key={`${post.category}-${post.slug}`}>
                  <Link href={`/blog/${categorySlug}/${post.slug}`}>
                    {post.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
}









