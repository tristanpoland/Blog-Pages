// src/utils/date-formatter.js

/**
 * Format a date string to a human-readable format
 * @param {string|Date} dateString - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateString}`);
      return '';
    }
    
    // Default formatting options
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };
    
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch (error) {
    console.error(`Error formatting date ${dateString}:`, error);
    return '';
  }
}

/**
 * Get a relative time string (e.g., "2 days ago")
 * @param {string|Date} dateString - The date to format
 * @returns {string} Relative time string
 */
export function getRelativeTime(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
    }
  } catch (error) {
    console.error(`Error getting relative time for ${dateString}:`, error);
    return '';
  }
}

/**
 * Format a date as ISO string (YYYY-MM-DD)
 * @param {string|Date} dateString - The date to format
 * @returns {string} ISO formatted date string
 */
export function formatISODate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error(`Error formatting ISO date ${dateString}:`, error);
    return '';
  }
}