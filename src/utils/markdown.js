// src/utils/markdown.js
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const blogsDirectory = path.join(process.cwd(), 'public/blogs');

/**
 * Gets all blog post slugs from the blogs directory
 * @returns {Promise<string[]>} Array of slugs
 */
export async function getBlogSlugs() {
  try {
    const files = await fs.readdir(blogsDirectory);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace(/\.md$/, ''));
  } catch (error) {
    console.error('Error getting blog slugs:', error);
    return [];
  }
}

/**
 * Gets a blog post by its slug
 * @param {string} slug - The blog post slug
 * @returns {Promise<Object|null>} Blog post data or null if not found
 */
export async function getBlogBySlug(slug) {
  try {
    const fullPath = path.join(blogsDirectory, `${slug}.md`);
    
    // Read the file
    const fileContents = await fs.readFile(fullPath, 'utf8');
    
    // Parse the front matter
    const { data, content, excerpt } = matter(fileContents, {
      excerpt: true,
      excerpt_separator: '<!-- excerpt -->'
    });
    
    // Generate excerpt if not explicitly provided
    let postExcerpt = data.excerpt;
    if (!postExcerpt) {
      if (excerpt) {
        postExcerpt = excerpt.trim();
      } else {
        postExcerpt = content.slice(0, 150).trim() + '...';
      }
    }
    
    // Calculate reading time (average 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    // Get file stats for additional metadata
    const stats = await fs.stat(fullPath);
    
    return {
      slug,
      content,
      title: data.title || 'Untitled',
      date: data.date || stats.birthtime.toISOString(),
      updated: data.updated || stats.mtime.toISOString(), 
      tags: data.tags || [],
      excerpt: postExcerpt,
      readingTime,
      ...data, // Include all frontmatter data
    };
  } catch (error) {
    console.error(`Error getting blog for slug ${slug}:`, error);
    return null;
  }
}

/**
 * Gets all blog posts
 * @returns {Promise<Object[]>} Array of blog posts
 */
export async function getAllBlogs() {
  try {
    const slugs = await getBlogSlugs();
    const blogs = await Promise.all(slugs.map(slug => getBlogBySlug(slug)));
    
    // Filter out any null values (failed loads)
    const validBlogs = blogs.filter(blog => blog !== null);
    
    // Sort by date (newest first)
    return validBlogs.sort((a, b) => (new Date(b.date) > new Date(a.date) ? 1 : -1));
  } catch (error) {
    console.error('Error getting all blogs:', error);
    return [];
  }
}

/**
 * Gets all tags from all blog posts
 * @returns {Promise<string[]>} Array of unique tags
 */
export async function getAllTags() {
  try {
    const blogs = await getAllBlogs();
    const tags = new Set();
    
    blogs.forEach(blog => {
      if (blog.tags) {
        blog.tags.forEach(tag => tags.add(tag));
      }
    });
    
    return Array.from(tags);
  } catch (error) {
    console.error('Error getting all tags:', error);
    return [];
  }
}

/**
 * Gets blog posts by tag
 * @param {string} tag - The tag to filter by
 * @returns {Promise<Object[]>} Array of blog posts with the specified tag
 */
export async function getBlogsByTag(tag) {
  try {
    const blogs = await getAllBlogs();
    return blogs.filter(blog => blog.tags && blog.tags.includes(tag));
  } catch (error) {
    console.error(`Error getting blogs by tag ${tag}:`, error);
    return [];
  }
}