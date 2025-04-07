import { getAllTags, getBlogsByTag } from '../../../utils/markdown';
import BlogPost from '../../../components/BlogPost';
import Link from 'next/link';

export async function generateStaticParams() {
  const tags = await getAllTags();
  return Array.isArray(tags) ? tags.map((tag) => ({ tag })) : [];
}

export async function generateMetadata(context) {
  const { params } = await context;
  return {
    title: `Posts tagged with "${params.tag}"`,
    description: `Browse all blog posts tagged with "${params.tag}"`,
  };
}

export default function TagPage({ params }) {
  const { tag } = params;
  const blogs = getBlogsByTag(tag);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/tags" className="text-blue-600 dark:text-blue-400 hover:underline mb-8 inline-block">
          ← All Tags
        </Link>
        <h1 className="text-4xl font-bold mt-4">Posts tagged with "{tag}"</h1>
      </div>
      
      {blogs.length > 0 ? (
        blogs.map((blog) => (
          <BlogPost key={blog.slug} post={blog} />
        ))
      ) : (
        <p className="text-gray-600 dark:text-gray-400">
          No posts found with this tag.
        </p>
      )}
    </div>
  );
}
