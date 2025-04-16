'use client';

import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Inter } from 'next/font/google';
import { useEffect, useState } from 'react';
import mermaid from 'mermaid';

const inter = Inter({ subsets: ['latin'] });

const metadata = {
  title: 'Tech Blog',
  description: 'A technical blog built with Next.js and React',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Detect user/system theme
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
    });
  }, []);

  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
