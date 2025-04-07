// src/utils/blog-indexer.js
// This module handles scanning markdown files, extracting metadata, and building the JSON index

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Constants
const BLOGS_DIRECTORY = path.join(process.cwd(), 'public/blogs');
const INDEX_PATH = path.join(process.cwd(), 'public/blog-index.json');

/**
 * Scans the blogs directory, extracts metadata from markdown files,
 * and generates a searchable JSON index
 */
function generateBlogIndex() {
  console.log('Generating blog index...');
  
  // Ensure the blogs directory exists
  if (!fs.existsSync(BLOGS_DIRECTORY)) {
    console.log('Creating blogs directory...');
    fs.mkdirSync(BLOGS_DIRECTORY, { recursive: true });
  }
  
  // Get all markdown files in the blogs directory
  const files = fs.readdirSync(BLOGS_DIRECTORY)
    .filter(filename => filename.endsWith('.md'));
    
  console.log(`Found ${files.length} markdown files`);
  
  // Process each file to extract metadata
  const blogPosts = files.map(filename => {
    const filePath = path.join(BLOGS_DIRECTORY, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Parse frontmatter and content
    const { data, content } = matter(fileContent);
    
    // Create slug from filename (remove .md extension)
    const slug = filename.replace(/\.md$/, '');
    
    // Extract first paragraph for excerpt if not provided in frontmatter
    const excerpt = data.excerpt || extractExcerpt(content);
    
    // Calculate reading time (average reading speed: 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    // Return structured blog post data
    return {
      slug,
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
      excerpt,
      readingTime,
      lastModified: fs.statSync(filePath).mtime.toISOString()
    };
  });
  
  // Sort blog posts by date (newest first)
  blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Generate tag index
  const tags = {};
  blogPosts.forEach(post => {
    post.tags.forEach(tag => {
      if (!tags[tag]) {
        tags[tag] = [];
      }
      tags[tag].push(post.slug);
    });
  });
  
  // Create the full index
  const index = {
    posts: blogPosts,
    tags,
    lastUpdated: new Date().toISOString()
  };
  
  // Write index to file
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  console.log(`Generated blog index with ${blogPosts.length} posts and ${Object.keys(tags).length} tags`);
  
  return index;
}

/**
 * Extracts the first paragraph from markdown content
 */
function extractExcerpt(content, maxLength = 150) {
  // Remove markdown headers
  const withoutHeaders = content.replace(/#{1,6}\s.+/g, '');
  
  // Find the first paragraph
  const match = withoutHeaders.match(/(?:^|\n)([^\n]+)/);
  if (!match) return '';
  
  const firstParagraph = match[1].trim();
  
  // Truncate if necessary and add ellipsis
  if (firstParagraph.length <= maxLength) {
    return firstParagraph;
  }
  
  return firstParagraph.slice(0, maxLength) + '...';
}

/**
 * React hook to load the blog index in client components
 */
function useBlogIndex() {
  const [index, setIndex] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    async function loadIndex() {
      try {
        const res = await fetch('/blog-index.json');
        if (!res.ok) {
          throw new Error(`Failed to load blog index: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setIndex(data);
      } catch (err) {
        console.error('Error loading blog index:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadIndex();
  }, []);
  
  return { index, loading, error };
}

// For NodeJS environment (build scripts)
if (typeof module !== 'undefined') {
  module.exports = { generateBlogIndex };
}

// For client-side React
if (typeof window !== 'undefined') {
  exports.useBlogIndex = useBlogIndex;
}