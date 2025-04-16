'use client';

import React, { useEffect, useState } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import rehypePrism from 'rehype-prism-plus';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSanitize from 'rehype-sanitize';
import 'katex/dist/katex.min.css';
import 'prismjs/themes/prism-tomorrow.css';
import { visit } from 'unist-util-visit';

// Import Prism - but don't access window during import
import Prism from 'prismjs';

// Core languages
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-regex';

// Safe browser-only functionality
const isBrowser = typeof window !== 'undefined';

export default function MarkdownRenderer({ 
  content, 
  darkMode = true,
}) {
  const [html, setHtml] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  
  // Set isMounted to true once component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Initialize PrismJS - only in browser
  useEffect(() => {
    if (!isMounted) return;
    
    // Safe to access window/document here
    try {
      // Log available languages - only in browser
      console.log('Available languages:', Object.keys(Prism.languages));
      
      // Apply highlighting to any existing code
      Prism.highlightAll();
    } catch (error) {
      console.error('Error initializing Prism:', error);
    }
  }, [isMounted]);

  useEffect(() => {
    if (!content) return;
    
    const processMarkdown = async () => {
      try {
        // Create a remark plugin to handle mermaid code blocks
        function remarkMermaid() {
          return (tree) => {
            const mermaidBlocks = [];
            let mermaidCounter = 0;
            
            // Visit all code blocks in the AST
            visit(tree, 'code', (node) => {
              // Check if this is a mermaid code block
              if (node.lang === 'mermaid') {
                // Generate a unique ID for this mermaid diagram
                const id = `mermaid-${mermaidCounter++}`;
                
                // Store the mermaid code for later processing
                mermaidBlocks.push({ id, code: node.value.trim() });
                
                // Replace the code node with a HTML node containing a placeholder
                node.type = 'html';
                node.value = `<div class="mermaid-diagram" data-diagram-id="${id}" data-diagram-code="${encodeURIComponent(node.value.trim())}"></div>`;
                
                // Remove the language property to prevent further processing by rehype-prism
                delete node.lang;
              }
              // Ensure other code blocks have a language
              else if (!node.lang) {
                node.lang = 'text';
              }
            });
            
            // Store the mermaid blocks in the tree.data
            tree.data = tree.data || {};
            tree.data.mermaidBlocks = mermaidBlocks;
          };
        }
        
        const processor = unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkMath)
          .use(remarkMermaid) // Add our custom plugin
          .use(remarkRehype, { allowDangerousHtml: true })
          .use(rehypeSanitize, {
            // Allow our mermaid placeholders
            extend: [
              {
                tagNames: ['div'],
                attributes: {
                  'class': ['mermaid-diagram'],
                  'data-diagram-id': [/.*/],
                  'data-diagram-code': [/.*/]
                }
              }
            ]
          })
          .use(rehypeKatex, { 
            throwOnError: false,
            errorColor: '#FF6188',
            trust: true,
            strict: false,
            output: 'htmlAndMathml',
            macros: {
              "\\R": "\\mathbb{R}",
              "\\N": "\\mathbb{N}",
              "\\Z": "\\mathbb{Z}",
              "\\Q": "\\mathbb{Q}",
              "\\C": "\\mathbb{C}",
            }
          })
          .use(rehypePrism, {
            ignoreMissing: true, // Skip unknown languages
          })
          .use(rehypeSlug)
          .use(rehypeAutolinkHeadings)
          .use(rehypeStringify, { allowDangerousHtml: true });
          
        const result = await processor.process(content);
          
        // Get mermaid blocks from the result data
        const mermaidBlocks = result.data.mermaidBlocks || [];
        
        // Process custom containers
        let htmlContent = String(result);
        const containerRegex = /<p>:::\s*(\w+)([\s\S]*?):::<\/p>/g;
        
        htmlContent = htmlContent.replace(containerRegex, (match, type, content) => {
          return `<div class="custom-block custom-block-${type}">
                    <div class="custom-block-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                    <div class="custom-block-content">${content.trim()}</div>
                  </div>`;
        });
        
        // Store the HTML and mermaid blocks
        setHtml({ content: htmlContent, mermaidBlocks });
      } catch (error) {
        console.error('Error rendering markdown:', error);
        setHtml({ 
          content: `<p>Error rendering markdown: ${error.message}</p>`, 
          mermaidBlocks: [] 
        });
      }
    };
    
    processMarkdown();
  }, [content]);
  
  // Initialize mermaid and render diagrams - only in browser and when component is mounted
  useEffect(() => {
    if (!isMounted || !html?.content || !html?.mermaidBlocks?.length) return;
    
    const renderMermaidDiagrams = async () => {
      try {
        // Dynamic import of mermaid (only on client)
        const mermaid = (await import('mermaid')).default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: darkMode ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
        });
        
        // Find all mermaid diagram containers
        const diagrams = document.querySelectorAll('.mermaid-diagram');
        
        for (const diagram of diagrams) {
          try {
            const code = decodeURIComponent(diagram.getAttribute('data-diagram-code'));
            const id = diagram.getAttribute('data-diagram-id');
            
            // Render the diagram
            const { svg } = await mermaid.render(`mermaid-svg-${id}`, code);
            diagram.innerHTML = svg;
          } catch (error) {
            console.error('Error rendering mermaid diagram:', error);
            diagram.innerHTML = `<pre class="error">Error rendering diagram: ${error.message}</pre>`;
          }
        }
      } catch (error) {
        console.error('Error loading mermaid:', error);
      }
    };
    
    renderMermaidDiagrams();
    
    // Also ensure Prism highlight is applied
    if (typeof Prism !== 'undefined') {
      setTimeout(() => {
        Prism.highlightAll();
      }, 100);
    }
  }, [html, isMounted, darkMode]);
  
  return (
    <div className={`markdown-content ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <div 
        className="prose prose-lg dark:prose-invert max-w-none" 
        dangerouslySetInnerHTML={{ __html: html ? html.content : '' }}
      />
      
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
        
        /* Mermaid styling */
        .mermaid-diagram {
          margin: 1.5em 0;
          text-align: center;
          background-color: ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
          padding: 1em;
          border-radius: 0.5em;
          min-height: 50px;
        }
        
        /* Code block styling */
        pre[class*="language-"] {
          margin: 1.5em 0;
          border-radius: 0.5em;
          overflow: auto;
          background: ${darkMode ? '#282a36' : '#f8f8f2'} !important;
        }
        
        code[class*="language-"] {
          font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
          text-shadow: none;
        }
        
        /* Explicit token styling for backup if Prism fails */
        .token.comment { color: #6272a4; }
        .token.string { color: ${darkMode ? '#f1fa8c' : '#a6e22e'}; }
        .token.number { color: #bd93f9; }
        .token.keyword { color: #ff79c6; }
        .token.function { color: #8be9fd; }
        .token.boolean { color: #bd93f9; }
        .token.operator { color: #ff79c6; }
        .token.punctuation { color: #f8f8f2; }
        
        /* Line numbers */
        .line-numbers .line-numbers-rows {
          border-right: 3px solid #6272a4;
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
        
        /* Error styling */
        .error {
          color: #e74c3c;
          padding: 0.5em;
          background-color: rgba(231, 76, 60, 0.1);
          border-radius: 0.3em;
        }
      `}</style>
    </div>
  );
}