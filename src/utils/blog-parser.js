import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOGS_DIRECTORY = path.join(process.cwd(), 'public/blogs');
const BLOG_INDEX_PATH = path.join(process.cwd(), 'public/blog-index.json');

function parseBlogPosts() {
  // Ensure the blogs directory exists
  if (!fs.existsSync(BLOGS_DIRECTORY)) {
    fs.mkdirSync(BLOGS_DIRECTORY, { recursive: true });
  }

  // Get all markdown files from the blogs directory
  const fileNames = fs.readdirSync(BLOGS_DIRECTORY)
    .filter(fileName => /\.md$/.test(fileName));

  // Parse each markdown file
  const blogPosts = fileNames.map(fileName => {
    const filePath = path.join(BLOGS_DIRECTORY, fileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Extract metadata and content
    const { data, content } = matter(fileContents);
    
    // Create a slug from the file name
    const slug = fileName.replace(/\.md$/, '');
    
    return {
      slug,
      ...data,
      excerpt: content.slice(0, 150) + '...',
      // Calculate reading time (avg reading speed: 200 words per minute)
      readingTime: Math.ceil(content.split(/\s+/).length / 200),
      fileName,
    };
  });

  // Sort by date (newest first)
  blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Write the index to a JSON file
  fs.writeFileSync(
    BLOG_INDEX_PATH,
    JSON.stringify(blogPosts, null, 2)
  );

  console.log(`✅ Generated blog index with ${blogPosts.length} posts`);
  return blogPosts;
}

export { parseBlogPosts };
