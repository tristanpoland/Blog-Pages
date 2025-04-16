import Link from 'next/link';
import { formatDate } from '../utils/date-formatter';

export default function BlogPost({ post }) {
  return (
    <div className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-2">
        <Link href={`/blog/${post.slug}`} className="text-blue-600 dark:text-blue-400 hover:underline">
          {post.title}
        </Link>
      </h2>
      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <span>{formatDate(post.date)}</span>
        <span>{post.readingTime} min read</span>
      </div>
      {post.tags && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map(tag => (
            <span 
              key={tag} 
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="mb-4 text-gray-700 dark:text-gray-300">{post.excerpt}</p>
      <Link href={`/blog/${post.slug}`} className="text-blue-600 dark:text-blue-400 hover:underline">
        Read more →
      </Link>
    </div>
  );
}
