---
title: 'React Hooks Explained: useEffect, useState, and More'
date: '2025-03-25'
tags: ['react', 'javascript', 'hooks']
excerpt: 'A comprehensive guide to React Hooks and how to use them in your projects'
---

# React Hooks Explained: useEffect, useState, and More

React Hooks have revolutionized how we write React components. In this post, we'll explore the most commonly used hooks and how they can make your code more readable and maintainable.

## What are React Hooks?

Hooks are functions that let you "hook into" React state and lifecycle features from function components. They were introduced in React 16.8 and have quickly become the preferred way to write React components.

## useState

The `useState` hook lets you add state to function components:

```jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

## useEffect

The `useEffect` hook lets you perform side effects in function components:

```jsx
import React, { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);
  
  // Similar to componentDidMount and componentDidUpdate
  useEffect(() => {
    document.title = `You clicked ${count} times`;
  });
  
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

## useContext

The `useContext` hook lets you subscribe to React context without introducing nesting:

```jsx
import React, { useContext } from 'react';
import { ThemeContext } from './theme-context';

function ThemedButton() {
  const theme = useContext(ThemeContext);
  
  return (
    <button style={{ background: theme.background, color: theme.foreground }}>
      I am styled by theme context!
    </button>
  );
}
```

## Custom Hooks

You can also create your own hooks to reuse stateful logic between components:

```jsx
import { useState, useEffect } from 'react';

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return width;
}
```

## Conclusion

React Hooks provide a more direct API to the React concepts you already know: props, state, context, refs, and lifecycle. They enable you to write more concise and reusable code, making your React components easier to understand and test.
