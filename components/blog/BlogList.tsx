import { BlogPost } from '@/lib/blog';
import BlogCard from './BlogCard';

interface BlogListProps {
  posts: BlogPost[];
  showFeatured?: boolean;
}

export default function BlogList({ posts, showFeatured = false }: BlogListProps) {
  if (posts.length === 0) {
    return (
      <div className="blog-empty">
        <p>No blog posts found.</p>
      </div>
    );
  }

  return (
    <div className="blog-list">
      {posts.map((post) => (
        <BlogCard key={`${post.category}-${post.slug}`} post={post} />
      ))}
    </div>
  );
}









