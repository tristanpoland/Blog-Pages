'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import 'katex/dist/katex.min.css';
import { defaultSchema } from 'hast-util-sanitize';

const customSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [
      ...(defaultSchema.attributes?.div || []),
      ['className', 'mermaid'], // Allow mermaid class
    ],
  },
};

export default function MarkdownRenderer({ 
  content, 
  darkMode = true
}) {
  const [copied, setCopied] = useState({});
  const [isMounted, setIsMounted] = useState(false);
  
  // Set isMounted to true when component is mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Handle copying code to clipboard
  const handleCopyCode = useCallback((code, id) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(code).then(() => {
        // Use a more targeted state update to avoid re-rendering Mermaid diagrams
        setCopied(prev => {
          const newState = { ...prev };
          newState[id] = true;
          return newState;
        });
        
        setTimeout(() => {
          // Use a more targeted state update to avoid re-rendering Mermaid diagrams
          setCopied(prev => {
            const newState = { ...prev };
            newState[id] = false;
            return newState;
          });
        }, 2000);
      });
    }
  }, []);

  // Initialize mermaid when the component mounts
useEffect(() => {
  if (!isMounted) return;

  import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: true,
      theme: darkMode ? 'dark' : 'default',
      securityLevel: 'loose',
    });

    const render = () => {
      requestAnimationFrame(() => {
        const nodes = document.querySelectorAll('div.mermaid:not(:has(svg))');
        if (nodes.length > 0) {
          mermaid.run({ querySelector: 'div.mermaid:not(:has(svg))' });
        }
      });
    };

    render();

    const id = setTimeout(render, 300); // 2nd try
    return () => clearTimeout(id);
  });
}, [isMounted, content, darkMode]); // <-- ensure content is part of deps


  // Process custom containers after ReactMarkdown has rendered
  useEffect(() => {
    if (!isMounted) return;
    
    // Create a function that's safe to call multiple times
    const processCustomContainers = () => {
      try {
        const markdownContent = document.querySelector('.markdown-content');
        if (!markdownContent) return;
        
        // Find all container start markers like ::: info
        // that haven't already been processed (look for those without a custom-block parent)
        const containerStarts = Array.from(markdownContent.querySelectorAll('p'))
          .filter(p => 
            /^:::(\s+)?([a-zA-Z0-9_-]+)/.test(p.textContent.trim()) && 
            !p.closest('.custom-block')
          );
        
        if (containerStarts.length === 0) return;
        
        // Track if we made any changes
        let changesMade = false;
        
        containerStarts.forEach(startP => {
          const match = startP.textContent.trim().match(/^:::(\s+)?([a-zA-Z0-9_-]+)/);
          if (!match) return;
          
          const type = match[2];
          let currentNode = startP.nextSibling;
          const nodesToWrap = [];
          let endNodeFound = false;
          
          // Collect all nodes until we find the closing marker
          while (currentNode) {
            if (currentNode.nodeType === 1 && 
                currentNode.tagName === 'P' && 
                currentNode.textContent.trim() === ':::') {
              // Found the closing marker
              endNodeFound = true;
              const endNode = currentNode;
              
              // Clone the nodes to wrap to prevent issues with removing them from the DOM
              const clonedNodes = nodesToWrap.map(node => node.cloneNode(true));
              
              // Create container
              const container = document.createElement('div');
              container.className = `custom-block custom-block-${type}`;
              
              // Add title
              const title = document.createElement('div');
              title.className = 'custom-block-title';
              title.textContent = type.charAt(0).toUpperCase() + type.slice(1);
              container.appendChild(title);
              
              // Add content
              const content = document.createElement('div');
              content.className = 'custom-block-content';
              clonedNodes.forEach(node => content.appendChild(node));
              container.appendChild(content);
              
              // Insert container before the end marker
              endNode.parentNode.insertBefore(container, endNode);
              
              // Remove the original nodes now that they've been cloned and added to the container
              nodesToWrap.forEach(node => {
                if (node.parentNode) {
                  node.parentNode.removeChild(node);
                }
              });
              
              // Remove start and end markers
              if (startP.parentNode) startP.parentNode.removeChild(startP);
              if (endNode.parentNode) endNode.parentNode.removeChild(endNode);
              
              changesMade = true;
              break;
            } else {
              // Add this node to the list to wrap
              const nextNode = currentNode.nextSibling;
              nodesToWrap.push(currentNode);
              currentNode = nextNode;
            }
          }
          
          // If we didn't find an end node, clean up any temporary state
          if (!endNodeFound) {
            console.warn('No closing ::: found for container', type);
          }
        });
        
        // If we made changes, trigger Mermaid to re-render the diagrams
        // but don't do this by re-calling the function directly to avoid infinite loops
        if (changesMade) {
          console.log('Custom containers processed, triggering Mermaid rendering');
          
          // Dispatch a custom event that our Mermaid observer can listen for
          const event = new CustomEvent('custom-containers-processed');
          document.dispatchEvent(event);
        }
      } catch (error) {
        console.error('Error processing custom containers:', error);
      }
    };
    
    // Run initially after a small delay to ensure ReactMarkdown has rendered
    const initialTimer = setTimeout(processCustomContainers, 100);
    
    // Set up a MutationObserver to detect content changes
    const observer = new MutationObserver((mutations) => {
      // Only process if there might be custom containers to handle
      const hasRelevantChanges = mutations.some(mutation => 
        [...(mutation.addedNodes || [])].some(node => 
          node.nodeType === 1 && 
          (node.tagName === 'P' || node.querySelector?.('p'))
        )
      );
      
      if (hasRelevantChanges) {
        // Debounce the processing to avoid multiple rapid updates
        clearTimeout(processTimer);
        processTimer = setTimeout(processCustomContainers, 50);
      }
    });
    
    let processTimer;
    
    // Start observing the document
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Cleanup
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(processTimer);
      observer.disconnect();
    };
  }, [isMounted]); // Remove content dependency to avoid reprocessing on every content change

  if (!content) return null;

  // Choose syntax highlighting theme based on dark mode
  const codeStyle = darkMode ? vscDarkPlus : prism;

  // Only render ReactMarkdown on the client side
  return (
    <div className={`markdown-content ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      {isMounted ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[
            rehypeRaw,
            [rehypeSanitize, customSchema],
            rehypeKatex,
          ]}
          components={{
            // Handle code blocks with syntax highlighting and Mermaid diagrams
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : null;
              const codeContent = String(children).replace(/\n$/, '');
              const codeId = `code-${Math.random().toString(36).substring(2, 9)}`;
              
              // Handle Mermaid diagrams
              if (language === 'mermaid') {
                return (
                  <div className="mermaid-diagram-container">
                    <div className="mermaid">{codeContent}</div>
                  </div>
                );
              }
              
              // Handle regular code blocks
              if (!inline && language) {
                return (
                  <div className="code-block-container">
                    <div className="code-header">
                      <span className="language-badge">{language}</span>
                      <button
                        onClick={() => handleCopyCode(codeContent, codeId)}
                        className="copy-button"
                      >
                        {copied[codeId] ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <SyntaxHighlighter
                      style={codeStyle}
                      language={language}
                      PreTag="div"
                      showLineNumbers={language !== 'markdown'}
                      {...props}
                    >
                      {codeContent}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              
              // Inline code
              return (
                <code className={`${className || ''} inline-code`} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      ) : (
        <div>Loading Markdown Content and Renderer...</div>
      )}
      
      <style jsx global>{`
        /* Math styling */
        .katex {
          font-size: 1.1em !important;
          font-family: 'KaTeX_Main', serif;
        }
        
        .katex-display {
          overflow-x: auto;
          overflow-y: hidden;
          padding: 1em 0;
          margin: 1.2em 0 !important;
        }
        
        .dark-theme .katex {
          color: #e4e4e7;
        }
        
        /* Code block styling */
        .code-block-container {
          margin: 1.5em 0;
          border-radius: 0.5em;
          overflow: hidden;
          border: 1px solid ${darkMode ? '#444' : '#ddd'};
        }
        
        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5em 1em;
          background-color: ${darkMode ? '#343434' : '#f3f3f3'};
          border-bottom: 1px solid ${darkMode ? '#444' : '#ddd'};
        }
        
        .language-badge {
          font-size: 0.8em;
          color: ${darkMode ? '#bbb' : '#555'};
        }
        
        .copy-button {
          font-size: 0.8em;
          padding: 0.25em 0.5em;
          background-color: ${darkMode ? '#555' : '#ddd'};
          border: none;
          border-radius: 0.25em;
          color: ${darkMode ? '#eee' : '#333'};
          cursor: pointer;
        }
        
        .copy-button:hover {
          background-color: ${darkMode ? '#666' : '#ccc'};
        }
        
        /* Inline code */
        .inline-code {
          background-color: ${darkMode ? '#2d2d2d' : '#f1f1f1'};
          border-radius: 0.25em;
          padding: 0.2em 0.4em;
          font-family: monospace;
        }
        
        /* Mermaid styling */
        .mermaid-diagram-container {
          margin: 1.5em 0;
          text-align: center;
          background-color: ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
          padding: 1em;
          border-radius: 0.5em;
        }
        
        /* Custom containers */
        .custom-block {
          margin: 1.5em 0;
          padding: 1em;
          border-left: 4px solid;
          border-radius: 0.25em;
        }
        
        .custom-block-title {
          font-weight: bold;
          margin-bottom: 0.5em;
        }
        
        .custom-block.custom-block-info { 
          border-color: #3498db; 
          background-color: ${darkMode ? 'rgba(52, 152, 219, 0.2)' : 'rgba(52, 152, 219, 0.1)'}; 
        }
        .custom-block.custom-block-warning { 
          border-color: #f39c12; 
          background-color: ${darkMode ? 'rgba(243, 156, 18, 0.2)' : 'rgba(243, 156, 18, 0.1)'}; 
        }
        .custom-block.custom-block-danger { 
          border-color: #e74c3c; 
          background-color: ${darkMode ? 'rgba(231, 76, 60, 0.2)' : 'rgba(231, 76, 60, 0.1)'}; 
        }
        .custom-block.custom-block-tip { 
          border-color: #2ecc71; 
          background-color: ${darkMode ? 'rgba(46, 204, 113, 0.2)' : 'rgba(46, 204, 113, 0.1)'}; 
        }
        .custom-block.custom-block-success { 
          border-color: #2ecc71; 
          background-color: ${darkMode ? 'rgba(46, 204, 113, 0.2)' : 'rgba(46, 204, 113, 0.1)'}; 
        }
      `}</style>
    </div>
  );
}