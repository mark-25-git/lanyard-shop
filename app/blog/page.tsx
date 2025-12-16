import { Metadata } from 'next';
import { getAllPosts, getPaginatedPosts, getAllCategories } from '@/lib/blog';
import BlogList from '@/components/blog/BlogList';
import BlogPagination from '@/components/blog/BlogPagination';
import BlogCategoryNav from '@/components/blog/BlogCategoryNav';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://teevent.my';
const POSTS_PER_PAGE = 9;

export const metadata: Metadata = {
  title: 'Blog - Teevent | Custom Lanyards & Event Merchandise Malaysia',
  description: 'Learn about custom lanyards, event merchandise, and get tips for organizing successful events in Malaysia.',
  openGraph: {
    title: 'Blog - Teevent',
    description: 'Learn about custom lanyards, event merchandise, and get tips for organizing successful events in Malaysia.',
    url: `${siteUrl}/blog`,
  },
};

interface BlogPageProps {
  searchParams: { page?: string; tag?: string };
}

export default function BlogPage({ searchParams }: BlogPageProps) {
  const currentPage = parseInt(searchParams.page || '1', 10);
  const selectedTag = searchParams.tag;

  let allPosts = getAllPosts();

  // Filter by tag if provided
  if (selectedTag) {
    allPosts = allPosts.filter((post) =>
      post.tags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase())
    );
  }

  const { posts, totalPages, hasNextPage, hasPrevPage } = getPaginatedPosts(
    allPosts,
    currentPage,
    POSTS_PER_PAGE
  );

  const categories = getAllCategories();

  return (
    <div className="blog-page">
      {/* Breadcrumb Section - Full Screen Width (Styled as H1) */}
      <div className="blog-breadcrumb-section">
        <div className="blog-container">
          <nav className="blog-breadcrumb blog-breadcrumb-h1">
            <span>Blog</span>
          </nav>
        </div>
      </div>

      {/* Two Column Layout Section */}
      <div className="blog-content-section">
        <div className="blog-container">
          <div className="blog-layout-two-column">
            {/* Left Column - Categories (22%) */}
            <aside className="blog-category-col">
              <BlogCategoryNav categories={categories} activeCategorySlug={null} />
            </aside>

            {/* Right Column - Blog Articles (78%) */}
            <main className="blog-main">
              {selectedTag && (
                <div className="blog-filter-tag">
                  <span>
                    Filtered by tag: <strong>{selectedTag}</strong>
                  </span>
                  <a href="/blog" className="blog-filter-clear">
                    Clear filter
                  </a>
                </div>
              )}

              <BlogList posts={posts} />
              <BlogPagination currentPage={currentPage} totalPages={totalPages} baseUrl="/blog" />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

