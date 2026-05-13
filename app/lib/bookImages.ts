/**
 * Utility functions for handling book cover images
 * Provides fallback mechanisms for book cover image generation
 */

import React from 'react';

export interface BookImageOptions {
  title: string;
  author: string;
  isbn?: string;
  width?: number;
  height?: number;
}

/**
 * Get book cover image URL with fallback options
 */
export function getBookCoverImage(options: BookImageOptions): string[] {
  const { title, author, isbn, width = 400, height = 600 } = options;
  const fallbacks: string[] = [];

  // First priority: Use ISBN if available
  if (isbn && isbn.trim()) {
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    // Open Library ISBN lookup
    fallbacks.push(`https://covers.openlibrary.org/b/isbn/${cleanISBN}-L.jpg`);
    
    // Google Books ISBN lookup
    fallbacks.push(`https://books.google.com/books/publisher/content?id=${cleanISBN}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api`);
  }

  // Second priority: Title-based search
  if (title && title.trim()) {
    const cleanTitle = encodeURIComponent(title.trim());
    
    // Open Library title search
    const titleForOL = title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '+')
      .trim();
    fallbacks.push(`https://covers.openlibrary.org/b/title/${titleForOL}-L.jpg`);
    
    // Google Books title + author search
    const searchQuery = author 
      ? `${cleanTitle}+${encodeURIComponent(author.trim())}`
      : cleanTitle;
    fallbacks.push(`https://books.google.com/books/content/images/frontcover/_?fife=w${width}-h${height}&source=gbs_api&key=${searchQuery}`);
  }

  // Final fallback: Generated placeholder
  fallbacks.push(generatePlaceholderCover(options));

  return fallbacks;
}

/**
 * Generate a custom SVG placeholder book cover
 */
export function generatePlaceholderCover(options: BookImageOptions): string {
  const { title, author, width = 200, height = 300 } = options;
  
  // Truncate text for display
  const maxTitleLength = 25;
  const maxAuthorLength = 20;
  const displayTitle = title.length > maxTitleLength ? title.substring(0, maxTitleLength) + '...' : title;
  const displayAuthor = author.length > maxAuthorLength ? author.substring(0, maxAuthorLength) + '...' : author;
  
  // Generate color scheme based on title hash
  const colors = generateColorScheme(title);
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Book cover background -->
      <rect width="${width}" height="${height}" fill="url(#bookGrad)" rx="8" filter="url(#shadow)"/>
      
      <!-- Inner border -->
      <rect x="10" y="10" width="${width - 20}" height="${height - 20}" 
            fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" rx="4"/>
      
      <!-- Title text -->
      <foreignObject x="15" y="40" width="${width - 30}" height="${height - 80}">
        <div xmlns="http://www.w3.org/1999/xhtml" 
             style="font-family: Arial, sans-serif; color: white; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 14px; font-weight: bold; line-height: 1.2; margin-bottom: 20px; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
            ${escapeHtml(displayTitle)}
          </div>
          <div style="font-size: 12px; opacity: 0.9; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
            ${escapeHtml(displayAuthor)}
          </div>
        </div>
      </foreignObject>
      
      <!-- Decorative elements -->
      <rect x="15" y="${height - 40}" width="${width - 30}" height="2" fill="rgba(255,255,255,0.3)" rx="1"/>
      
      <!-- Book spine effect -->
      <rect x="5" y="5" width="8" height="${height - 10}" fill="rgba(0,0,0,0.2)" rx="2"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generate a color scheme based on string hash
 */
function generateColorScheme(text: string): { primary: string; secondary: string } {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 60) % 360; // Complementary color
  
  return {
    primary: `hsl(${hue1}, 70%, 50%)`,
    secondary: `hsl(${hue2}, 70%, 40%)`
  };
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Check if an image URL is valid and accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors' // Handle CORS issues
    });
    return response.ok || response.type === 'opaque';
  } catch {
    return false;
  }
}

/**
 * Get the first working image URL from a list of fallbacks
 */
export async function getWorkingImageUrl(urls: string[]): Promise<string> {
  for (const url of urls) {
    if (await validateImageUrl(url)) {
      return url;
    }
  }
  return urls[urls.length - 1]; // Return the last fallback (placeholder)
}

/**
 * React hook for handling book cover images with fallbacks
 */
export function useBookCoverImage(options: BookImageOptions) {
  const [imageUrl, setImageUrl] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);
      
      const fallbacks = getBookCoverImage(options);
      
      for (let i = 0; i < fallbacks.length - 1; i++) { // Exclude placeholder from validation
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          const loaded = await new Promise<boolean>((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = fallbacks[i];
            
            // Timeout after 3 seconds
            setTimeout(() => resolve(false), 3000);
          });
          
          if (loaded && isMounted) {
            setImageUrl(fallbacks[i]);
            setIsLoading(false);
            return;
          }
        } catch {
          continue;
        }
      }
      
      // Use placeholder if all else fails
      if (isMounted) {
        setImageUrl(fallbacks[fallbacks.length - 1]);
        setHasError(true);
        setIsLoading(false);
      }
    };
    
    loadImage();
    
    return () => {
      isMounted = false;
    };
  }, [options.title, options.author, options.isbn]);

  return { imageUrl, isLoading, hasError };
}
