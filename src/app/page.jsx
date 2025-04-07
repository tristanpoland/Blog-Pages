import fs from 'fs';
import path from 'path';
import BlogPost from '../components/BlogPost';

export default function Home() {
  // Read the blog index
  let blogPosts = [];
  const indexPath = path.join(process.cwd(), 'public/blog-index.json');
  
  try {
    if (fs.existsSync(indexPath)) {
      const indexData = fs.readFileSync(indexPath, 'utf8');
      blogPosts = JSON.parse(indexData);
    }
  } catch (error) {
    console.error('Error reading blog index:', error);
  }

  return (
    <div>
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Technical Blog</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Exploring web development, programming, and technology
        </p>
      </div>

      {blogPosts.length > 0 ? (
        blogPosts.map((post) => (
          <BlogPost key={post.slug} post={post} />
        ))
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No blog posts found. Add some markdown files to the /public/blogs directory to get started.
          </p>
        </div>
      )}
    </div>
  );
}
