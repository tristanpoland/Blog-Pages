'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkEmoji from 'remark-emoji';
import remarkFootnotes from 'remark-footnotes';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import slugify from 'slugify';
import copy from 'copy-to-clipboard';
import 'katex/dist/katex.min.css';

// Simple Markdown Renderer component that handles any markdown content
export default function MarkdownRenderer({ 
  content, 
  darkMode = true, 
  sanitize = true,
  footnotes = true,
  tableOfContents = false,
  copyable = true,
  mathSupport = true,
  customContainers = true,
  maxImageWidth = '100%',
  maxImageHeight = 'auto',
  highlightedLines = [] 
}) {
  const [copied, setCopied] = useState(false);
  const [headings, setHeadings] = useState([]);
  const [codeBlocks, setCodeBlocks] = useState({});
  
  // If no content is provided, return null
  if (!content) {
    return null;
  }
  
  // Parse content for headings to generate table of contents
  useEffect(() => {
    if (tableOfContents) {
      const headingMatches = content.match(/^(#{1,6})\s+(.+)$/gm) || [];
      const extractedHeadings = headingMatches.map(heading => {
        const level = heading.match(/^(#{1,6})/)[0].length;
        const text = heading.replace(/^#{1,6}\s+/, '');
        const id = slugify(text, { lower: true });
        return { level, text, id };
      });
      setHeadings(extractedHeadings);
    }
  }, [content, tableOfContents]);

  // Choose syntax highlighting theme based on dark mode
  const codeStyle = darkMode ? vscDarkPlus : prism;

  // Handle copying code to clipboard
  const handleCopyCode = (code, id) => {
    copy(code);
    
    // Set the copied state for this specific code block
    setCodeBlocks(prev => ({ 
      ...prev, 
      [id]: true 
    }));
    
    // Reset after 2 seconds
    setTimeout(() => {
      setCodeBlocks(prev => ({ 
        ...prev, 
        [id]: false 
      }));
    }, 2000);
  };

  // Generate plugins array based on props
  const remarkPlugins = [remarkGfm];
  const rehypePlugins = [rehypeRaw];
  
  // Add footnotes support
  remarkPlugins.push([remarkFootnotes, { inlineNotes: true }]);
  
  // Add emoji support
  remarkPlugins.push(remarkEmoji);
  
  if (mathSupport) {
    remarkPlugins.push(remarkMath);
    rehypePlugins.push(rehypeKatex);
  }
  
  if (sanitize) {
    rehypePlugins.push(rehypeSanitize);
  }

          // Add custom container support
          useEffect(() => {
            if (customContainers && window.document) {
              // Process custom containers after rendering
              const markdownContent = document.querySelector('.markdown-content');
              if (markdownContent) {
                // Find all container start markers like ::: info
                const containerStarts = Array.from(markdownContent.querySelectorAll('p'))
                  .filter(p => /^:::(\s+)?([a-zA-Z0-9_-]+)/.test(p.textContent.trim()));
                
                containerStarts.forEach(startP => {
                  const type = startP.textContent.trim().match(/^:::(\s+)?([a-zA-Z0-9_-]+)/)[2];
                  let currentNode = startP.nextSibling;
                  const nodesToWrap = [];
                  
                  // Collect all nodes until we find the closing marker
                  while (currentNode) {
                    if (currentNode.nodeType === 1 && 
                        currentNode.tagName === 'P' && 
                        currentNode.textContent.trim() === ':::') {
                      // Found the closing marker
                      const endNode = currentNode;
                      // Remove start and end markers
                      startP.remove();
                      endNode.remove();
                      
                      // Create container
                      const container = document.createElement('div');
                      container.className = `custom-container custom-container-${type}`;
                      container.setAttribute('data-type', type);
                      
                      // Add title if appropriate
                      const title = document.createElement('div');
                      title.className = 'custom-container-title';
                      title.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                      container.appendChild(title);
                      
                      // Add content
                      const content = document.createElement('div');
                      content.className = 'custom-container-content';
                      nodesToWrap.forEach(node => content.appendChild(node));
                      container.appendChild(content);
                      
                      // Insert container into DOM
                      startP.parentNode.insertBefore(container, currentNode);
                      break;
                    } else {
                      // Add this node to the list to wrap
                      const nextNode = currentNode.nextSibling;
                      nodesToWrap.push(currentNode);
                      currentNode = nextNode;
                    }
                  }
                });
              }
            }
          }, [content, customContainers]);
  return (
    <div className={`markdown-content ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      {tableOfContents && headings.length > 0 && (
        <div className="table-of-contents mb-6 p-4 border rounded bg-gray-50 dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-2">Table of Contents</h2>
          <ul className="toc-list">
            {headings.map((heading, index) => (
              <li 
                key={index} 
                className={`ml-${(heading.level - 1) * 4} py-1`}
                style={{ marginLeft: `${(heading.level - 1) * 1}rem` }}
              >
                <a 
                  href={`#${heading.id}`} 
                  className="text-blue-600 hover:underline"
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={{
          // Handle code blocks with syntax highlighting
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : null;
            const codeContent = String(children).replace(/\n$/, '');
            const codeId = `code-${Math.random().toString(36).substring(2, 9)}`;
            
            // Check if this code block should have highlighted lines
            const shouldHighlight = highlightedLines.some(h => 
              (h.language === language) && h.lines && h.lines.length
            );
            
            const lineProps = shouldHighlight ? (lineNumber) => {
              const highlight = highlightedLines
                .filter(h => h.language === language)
                .some(h => h.lines.includes(lineNumber));
                
              return {
                style: highlight ? { 
                  backgroundColor: 'rgba(255, 255, 0, 0.2)', 
                  display: 'block',
                  width: '100%'
                } : {},
                className: highlight ? 'highlighted-line' : ''
              };
            } : undefined;

            return !inline && language ? (
              <div className="code-block-container relative">
                <div className="code-header flex justify-between items-center px-3 py-1 bg-gray-800 text-white rounded-t">
                  <span className="language-badge text-xs">{language}</span>
                  {copyable && (
                    <button
                      onClick={() => handleCopyCode(codeContent, codeId)}
                      className="copy-button text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                    >
                      {codeBlocks[codeId] ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
                <SyntaxHighlighter
                  style={codeStyle}
                  language={language}
                  PreTag="div"
                  showLineNumbers={language !== 'markdown'}
                  wrapLines={shouldHighlight}
                  lineProps={lineProps}
                  {...props}
                >
                  {codeContent}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={`${className} bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded`} {...props}>
                {children}
              </code>
            );
          },
// Add custom component handling for other elements as needed
          h1: ({ node, children, ...props }) => {
            const id = tableOfContents ? slugify(String(children), { lower: true }) : undefined;
            return <h1 id={id} className="text-3xl font-bold my-4 scroll-mt-16" {...props}>{children}</h1>;
          },
          h2: ({ node, children, ...props }) => {
            const id = tableOfContents ? slugify(String(children), { lower: true }) : undefined;
            return <h2 id={id} className="text-2xl font-bold my-3 scroll-mt-16" {...props}>{children}</h2>;
          },
          h3: ({ node, children, ...props }) => {
            const id = tableOfContents ? slugify(String(children), { lower: true }) : undefined;
            return <h3 id={id} className="text-xl font-bold my-2 scroll-mt-16" {...props}>{children}</h3>;
          },
          h4: ({ node, children, ...props }) => {
            const id = tableOfContents ? slugify(String(children), { lower: true }) : undefined;
            return <h4 id={id} className="text-lg font-bold my-2 scroll-mt-16" {...props}>{children}</h4>;
          },
          h5: ({ node, children, ...props }) => {
            const id = tableOfContents ? slugify(String(children), { lower: true }) : undefined;
            return <h5 id={id} className="text-md font-bold my-2 scroll-mt-16" {...props}>{children}</h5>;
          },
          h6: ({ node, children, ...props }) => {
            const id = tableOfContents ? slugify(String(children), { lower: true }) : undefined;
            return <h6 id={id} className="text-sm font-bold my-2 scroll-mt-16" {...props}>{children}</h6>;
          },
          p: ({ node, ...props }) => <p className="my-2" {...props} />,
          a: ({ node, href, ...props }) => {
            // Handle internal anchor links
            const isInternal = href && href.startsWith('#');
            return (
              <a 
                className={`${isInternal ? 'text-blue-500' : 'text-blue-600'} hover:underline`} 
                href={href}
                target={!isInternal && href && href.startsWith('http') ? '_blank' : undefined}
                rel={!isInternal && href && href.startsWith('http') ? 'noopener noreferrer' : undefined}
                {...props} 
              />
            );
          },
          ul: ({ node, ordered, ...props }) => (
            <ul className="list-disc pl-6 my-2" {...props} />
          ),
          ol: ({ node, ordered, ...props }) => (
            <ol className="list-decimal pl-6 my-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="my-1" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic bg-gray-50 dark:bg-gray-800 py-2" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-gray-100 dark:bg-gray-700" {...props} />,
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => <tr className="border-b border-gray-300 dark:border-gray-600" {...props} />,
          th: ({ node, ...props }) => <th className="px-4 py-2 text-left font-semibold border-r border-gray-300 dark:border-gray-600 last:border-r-0" {...props} />,
          td: ({ node, ...props }) => <td className="px-4 py-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0" {...props} />,
          img: ({ node, src, alt, ...props }) => (
            <img 
              className="my-2 rounded" 
              src={src} 
              alt={alt || ''} 
              style={{ 
                maxWidth: maxImageWidth, 
                maxHeight: maxImageHeight,
                display: 'block',
                margin: '1rem auto' 
              }} 
              loading="lazy"
              {...props} 
            />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-t border-gray-300 dark:border-gray-600" {...props} />
          ),
          // Details/summary for collapsible content
          details: ({ node, ...props }) => (
            <details className="my-2 p-2 border border-gray-200 dark:border-gray-700 rounded" {...props} />
          ),
          summary: ({ node, ...props }) => (
            <summary className="font-semibold cursor-pointer py-1" {...props} />
          ),
          // Emphasized and strong text
          em: ({ node, ...props }) => (
            <em className="italic" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold" {...props} />
          ),
          // Definition lists
          dl: ({ node, ...props }) => (
            <dl className="my-4" {...props} />
          ),
          dt: ({ node, ...props }) => (
            <dt className="font-bold mt-2" {...props} />
          ),
          dd: ({ node, ...props }) => (
            <dd className="ml-4 mb-2" {...props} />
          ),
          // Superscript and subscript
          sup: ({ node, ...props }) => (
            <sup className="text-xs align-super" {...props} />
          ),
          sub: ({ node, ...props }) => (
            <sub className="text-xs align-sub" {...props} />
          ),
          // Mark (highlighted text)
          mark: ({ node, ...props }) => (
            <mark className="bg-yellow-200 px-1" {...props} />
          ),
          // Keyboard input
          kbd: ({ node, ...props }) => (
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs" {...props} />
          ),
          // Add special components for trademark, copyright, registered symbols
          text: ({ node, children }) => {
            // Replace trademark, copyright, registered symbols
            if (typeof children === 'string') {
              const withSymbols = children
                .replace(/\(C\)/g, '©')
                .replace(/\(c\)/g, '©')
                .replace(/\(R\)/g, '®')
                .replace(/\(r\)/g, '®')
                .replace(/\(TM\)/g, '™')
                .replace(/\(tm\)/g, '™');
              
              return withSymbols;
            }
            return children;
          }
        }}
      >
        {content}
      </ReactMarkdown>
      
      {/* Add footnotes section if enabled */}

    </div>
  );
}