import Link from 'next/link';
import { getAllTags } from '../../utils/markdown';

export default function TagsPage() {
  const tags = Array.isArray(getAllTags()) ? getAllTags() : (getAllTags() ? [getAllTags()] : []);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Tags</h1>
      
      <div className="flex flex-wrap gap-4">
        {tags.map(tag => (
          <Link 
            key={tag} 
            href={`/tags/${tag}`}
            className="px-6 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-lg">{tag}</span>
          </Link>
        ))}
      </div>
      
      {tags.length === 0 && (
        <p className="text-gray-600 dark:text-gray-400">
          No tags found. Add some blog posts with tags to see them here.
        </p>
      )}
    </div>
  );
}
