import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPosts, getRelatedPosts, markdownToHtml } from '@/lib/blog';
import BlogPost from '@/components/blog/BlogPost';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://teevent.my';

interface BlogPostPageProps {
  params: { category: string; slug: string };
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const categorySlug = params.category;
  const slug = params.slug;

  // Find the actual category name from the slug
  const allPosts = getAllPosts();
  const post = allPosts.find(
    (p) =>
      p.slug === slug &&
      p.category.toLowerCase().replace(/\s+/g, '-') === categorySlug
  );

  if (!post) {
    return {
      title: 'Post Not Found - Teevent Blog',
    };
  }

  const ogImage = post.coverImage
    ? `${siteUrl}${post.coverImage}`
    : `${siteUrl}/images/landing/og-lanyard-landing.webp`;

  return {
    title: `${post.title} - Teevent Blog`,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${siteUrl}/blog/${categorySlug}/${slug}`,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
    alternates: {
      canonical: `${siteUrl}/blog/${categorySlug}/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const categorySlug = params.category;
  const slug = params.slug;

  // Find the actual category name from the slug
  const allPosts = getAllPosts();
  const post = allPosts.find(
    (p) =>
      p.slug === slug &&
      p.category.toLowerCase().replace(/\s+/g, '-') === categorySlug
  );

  if (!post) {
    notFound();
  }

  const htmlContent = await markdownToHtml(post.content);
  const relatedPosts = getRelatedPosts(post.category, post.slug, 3);

  return (
    <div className="blog-page">
      <div className="blog-content-section">
        <div className="blog-container">
          <div className="blog-layout-two-column">
            {/* Left Column - Breadcrumb (22%) */}
            <aside className="blog-category-col">
              <nav className="blog-breadcrumb blog-breadcrumb-h1">
                <Link href="/blog">Blog</Link>
                <span> / </span>
                <Link href={`/blog/category/${categorySlug}`}>{post.category}</Link>
                <span> / </span>
                <span>{post.title}</span>
              </nav>
            </aside>

            {/* Right Column - Article (78%) */}
            <main className="blog-main blog-main-single">
              <BlogPost post={post} htmlContent={htmlContent} relatedPosts={relatedPosts} />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

