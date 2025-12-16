import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllCategories, getPostsByCategory, getPaginatedPosts } from '@/lib/blog';
import BlogList from '@/components/blog/BlogList';
import BlogPagination from '@/components/blog/BlogPagination';
import BlogCategoryNav from '@/components/blog/BlogCategoryNav';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://teevent.my';
const POSTS_PER_PAGE = 9;

interface CategoryPageProps {
  params: { category: string };
  searchParams: { page?: string };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const categorySlug = params.category;
  const categories = getAllCategories();
  const category = categories.find(
    (cat) => cat.toLowerCase().replace(/\s+/g, '-') === categorySlug
  );

  if (!category) {
    return {
      title: 'Category Not Found - Teevent Blog',
    };
  }

  return {
    title: `${category} - Teevent Blog`,
    description: `Browse all articles in the ${category} category.`,
    openGraph: {
      title: `${category} - Teevent Blog`,
      description: `Browse all articles in the ${category} category.`,
      url: `${siteUrl}/blog/category/${categorySlug}`,
    },
  };
}

export default function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const categorySlug = params.category;
  const currentPage = parseInt(searchParams.page || '1', 10);

  const categories = getAllCategories();
  const category = categories.find(
    (cat) => cat.toLowerCase().replace(/\s+/g, '-') === categorySlug
  );

  if (!category) {
    notFound();
  }

  const categoryPosts = getPostsByCategory(category);
  const { posts, totalPages } = getPaginatedPosts(
    categoryPosts,
    currentPage,
    POSTS_PER_PAGE
  );

  return (
    <div className="blog-page">
      {/* Breadcrumb Section - Full Screen Width (Styled as H1) */}
      <div className="blog-breadcrumb-section">
        <div className="blog-container">
          <nav className="blog-breadcrumb blog-breadcrumb-h1">
            <a href="/blog">Blog</a>
            <span> / </span>
            <span>{category}</span>
          </nav>
        </div>
      </div>

      {/* Two Column Layout Section */}
      <div className="blog-content-section">
        <div className="blog-container">
          <div className="blog-layout-two-column">
            {/* Left Column - Categories (22%) */}
            <aside className="blog-category-col">
              <BlogCategoryNav categories={categories} activeCategorySlug={categorySlug} />
            </aside>

            {/* Right Column - Blog Articles (78%) */}
            <main className="blog-main">
              <BlogList posts={posts} />
              <BlogPagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl={`/blog/category/${categorySlug}`}
              />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

