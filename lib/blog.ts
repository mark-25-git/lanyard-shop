import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';

// Blog post metadata interface
export interface BlogPost {
  slug: string;
  category: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  coverImage?: string;
  featured: boolean;
  content: string;
  readingTime: number;
}

// Directory where blog posts are stored
const blogDirectory = path.join(process.cwd(), 'content', 'blog');

/**
 * Get all blog posts, sorted by date (newest first)
 */
export function getAllPosts(): BlogPost[] {
  const posts: BlogPost[] = [];

  if (!fs.existsSync(blogDirectory)) {
    return posts;
  }

  // Read all category directories
  const categories = fs.readdirSync(blogDirectory, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const category of categories) {
    const categoryPath = path.join(blogDirectory, category);
    const files = fs.readdirSync(categoryPath);

    for (const file of files) {
      if (file.endsWith('.md')) {
        const slug = file.replace(/\.md$/, '');
        const filePath = path.join(categoryPath, file);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContents);

        const readingTime = calculateReadingTime(content);

        posts.push({
          slug,
          category: data.category || category,
          title: data.title || '',
          description: data.description || '',
          date: data.date || '',
          author: data.author || 'Teevent Team',
          tags: Array.isArray(data.tags) ? data.tags : [],
          coverImage: data.coverImage,
          featured: data.featured === true,
          content,
          readingTime,
        });
      }
    }
  }

  // Sort by date (newest first)
  return posts.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });
}

/**
 * Get all posts in a specific category
 */
export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter(post => 
    post.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get a single post by category and slug
 */
export function getPostBySlug(category: string, slug: string): BlogPost | null {
  const filePath = path.join(blogDirectory, category, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const readingTime = calculateReadingTime(content);

  return {
    slug,
    category: data.category || category,
    title: data.title || '',
    description: data.description || '',
    date: data.date || '',
    author: data.author || 'Teevent Team',
    tags: Array.isArray(data.tags) ? data.tags : [],
    coverImage: data.coverImage,
    featured: data.featured === true,
    content,
    readingTime,
  };
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const categories = new Set(posts.map(post => post.category));
  return Array.from(categories).sort();
}

/**
 * Get all unique tags
 */
export function getTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set<string>();
  posts.forEach(post => {
    post.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Get featured posts
 */
export function getFeaturedPosts(limit: number = 3): BlogPost[] {
  return getAllPosts()
    .filter(post => post.featured)
    .slice(0, limit);
}

/**
 * Get related posts (same category, excluding current post)
 */
export function getRelatedPosts(
  category: string,
  currentSlug: string,
  limit: number = 3
): BlogPost[] {
  return getPostsByCategory(category)
    .filter(post => post.slug !== currentSlug)
    .slice(0, limit);
}

/**
 * Convert markdown content to HTML
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(markdown);

  return result.toString();
}

/**
 * Calculate reading time in minutes
 * Based on average reading speed of 200 words per minute
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const text = content.replace(/[#*`\[\]()]/g, '').trim();
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return readingTime < 1 ? 1 : readingTime;
}

/**
 * Get paginated posts
 */
export function getPaginatedPosts(
  posts: BlogPost[],
  page: number = 1,
  postsPerPage: number = 9
): {
  posts: BlogPost[];
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
} {
  const startIndex = (page - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const paginatedPosts = posts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  return {
    posts: paginatedPosts,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}







