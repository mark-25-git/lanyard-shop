'use client';

import { useEffect } from 'react';
import { BlogPost as BlogPostType } from '@/lib/blog';
import Link from 'next/link';

interface BlogPostProps {
  post: BlogPostType;
  htmlContent: string;
  relatedPosts?: BlogPostType[];
}

export default function BlogPost({ post, htmlContent, relatedPosts = [] }: BlogPostProps) {
  const categorySlug = post.category.toLowerCase().replace(/\s+/g, '-');

  useEffect(() => {
    // Add smooth scroll behavior for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const id = target.getAttribute('href')?.slice(1);
        const element = document.getElementById(id || '');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <article className="blog-post">
      <header className="blog-post-header">
        <h1 className="blog-post-title">{post.title}</h1>
        <div className="blog-post-meta">
          <span className="blog-post-date">
            {new Date(post.date).toLocaleDateString('en-MY', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span> by </span>
          <span className="blog-post-author">{post.author}</span>
        </div>
      </header>

      <div
        className="blog-post-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {relatedPosts.length > 0 && (
        <aside className="blog-post-related">
          <h2>Related Articles</h2>
          <div className="blog-post-related-list">
            {relatedPosts.map((relatedPost) => {
              const relatedCategorySlug = relatedPost.category.toLowerCase().replace(/\s+/g, '-');
              return (
                <Link
                  key={`${relatedPost.category}-${relatedPost.slug}`}
                  href={`/blog/${relatedCategorySlug}/${relatedPost.slug}`}
                  className="blog-post-related-item"
                >
                  <h3>{relatedPost.title}</h3>
                  <p>{relatedPost.description}</p>
                </Link>
              );
            })}
          </div>
        </aside>
      )}
    </article>
  );
}

