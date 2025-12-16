import Link from 'next/link';
import { BlogPost } from '@/lib/blog';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const categorySlug = post.category.toLowerCase().replace(/\s+/g, '-');
  const postUrl = `/blog/${categorySlug}/${post.slug}`;

  return (
    <article className="blog-card">
      <Link href={postUrl} className="blog-card-link">
        <div className="blog-card-content">
          <h3 className="blog-card-title">{post.title}</h3>
          <p className="blog-card-description">{post.description}</p>
          <div className="blog-card-meta">
            <span className="blog-card-category">{post.category}</span>
            <span className="blog-card-separator"> • </span>
            <span className="blog-card-date">
              {new Date(post.date).toLocaleDateString('en-MY', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

