"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BlogPost from '../../components/BlogPost';
import Link from 'next/link';

// Create a client component that uses useSearchParams
function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      try {
        const basePath = process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || '';
        console.log('Fetching posts from:', `${basePath}/blog-index.json`);
        const res = await fetch(`${basePath}/blog-index.json`);
        const posts = await res.json();
        
        // Simple search implementation
        const filteredPosts = posts.filter(post => {
          const searchContent = `${post.title} ${post.excerpt} ${post.tags?.join(' ') || ''}`.toLowerCase();
          return searchContent.includes(query.toLowerCase());
        });
        
        setResults(filteredPosts);
      } catch (error) {
        console.error('Error searching posts:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    if (query) {
      fetchResults();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query]);

  return (
    <>
      <div className="mb-8">
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {query ? `Showing results for "${query}"` : 'Enter a search term to find blog posts'}
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <>
          {results.length > 0 ? (
            <>
              <p className="mb-4 text-gray-600 dark:text-gray-400">Found {results.length} result(s)</p>
              {results.map((post) => (
                <BlogPost key={post.slug} post={post} />
              ))}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {query ? 'No results found. Try a different search term.' : 'Enter a search term to find blog posts.'}
              </p>
              {query && (
                <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                  View all posts
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

// Loading fallback for Suspense
function SearchFallback() {
  return (
    <div className="flex justify-center py-12">
      <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
}

// Main page component that wraps SearchResults in Suspense
export default function SearchPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mb-8 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold mt-4">Search Results</h1>
      </div>
      
      <Suspense fallback={<SearchFallback />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}