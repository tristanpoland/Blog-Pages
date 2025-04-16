import Link from 'next/link';
import SearchBar from './SearchBar';

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-md">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
            Tech Blog
          </Link>
          
          <div className="w-full md:w-auto md:ml-4">
            <SearchBar />
          </div>
          
          <nav className="flex mt-4 md:mt-0">
            <Link href="/" className="mx-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">
              Home
            </Link>
            {/* <Link href="/tags" className="mx-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">
              Tags
            </Link> */}
            <Link href="/about" className="mx-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
