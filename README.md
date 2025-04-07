# Technical Blog

A technical blog built with Next.js and React, hosted on GitHub Pages.

## Features

- Static site generation with Next.js
- Markdown content with frontmatter
- Code syntax highlighting
- Tag-based categorization
- Search functionality
- Responsive design with Tailwind CSS

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Adding Content

To add a new blog post:

1. Create a new markdown file in the `public/blogs` directory
2. Add frontmatter with title, date, tags, and excerpt
3. Write your content in markdown
4. Run the development server to preview your post

Example frontmatter:

```
---
title: 'My New Blog Post'
date: '2025-04-07'
tags: ['react', 'javascript', 'next.js']
excerpt: 'A brief description of the blog post'
---
```

## Deployment

This blog is set up to automatically deploy to GitHub Pages using GitHub Actions when you push to the main branch.

To set up deployment:

1. Create a GitHub repository
2. Push your code to the repository
3. Configure GitHub Pages to deploy from the `gh-pages` branch
4. The GitHub Action will handle building and deploying your site

## Customization

- Modify the design by editing the Tailwind classes
- Add new components in the `src/components` directory
- Update the site metadata in `src/app/layout.jsx`
- Customize the header and footer in their respective component files

## License

MIT
