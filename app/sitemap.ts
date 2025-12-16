import { MetadataRoute } from 'next';
import { getAllPosts, getAllCategories } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://teevent.my';
  const currentDate = new Date().toISOString().split('T')[0];

  // Base pages
  const basePages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/customize`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/checkout`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/track`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Blog category pages
  const categories = getAllCategories();
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => {
    const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
    return {
      url: `${siteUrl}/blog/category/${categorySlug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    };
  });

  // Blog post pages
  const posts = getAllPosts();
  const blogPostPages: MetadataRoute.Sitemap = posts.map((post) => {
    const categorySlug = post.category.toLowerCase().replace(/\s+/g, '-');
    return {
      url: `${siteUrl}/blog/${categorySlug}/${post.slug}`,
      lastModified: post.date,
      changeFrequency: 'monthly',
      priority: 0.6,
    };
  });

  return [...basePages, ...categoryPages, ...blogPostPages];
}

