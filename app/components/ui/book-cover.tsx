'use client';

import { useState } from 'react';
import { cn } from '@/app/lib/utils';
import { Book, Loader2, ImageIcon } from 'lucide-react';
import { getBookCoverImage } from '@/app/lib/bookImages';

interface BookCoverProps {
  title: string;
  author: string;
  isbn?: string;
  imageUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showHoverEffect?: boolean;
  showLoadingSpinner?: boolean;
  alt?: string;
}

const sizeClasses = {
  sm: 'h-32 w-24',
  md: 'h-48 w-36', 
  lg: 'h-64 w-48',
  xl: 'h-80 w-60'
};

export function BookCover({
  title,
  author,
  isbn,
  imageUrl,
  className,
  size = 'lg',
  showHoverEffect = true,
  showLoadingSpinner = true,
  alt,
}: BookCoverProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [currentFallbackIndex, setCurrentFallbackIndex] = useState(0);

  // Get all possible image URLs
  const fallbackUrls = getBookCoverImage({
    title,
    author,
    isbn,
    width: 400,
    height: 600
  });

  const currentImageUrl = imageUrl || fallbackUrls[currentFallbackIndex];

  const handleImageError = () => {
    const nextIndex = currentFallbackIndex + 1;
    if (nextIndex < fallbackUrls.length) {
      setCurrentFallbackIndex(nextIndex);
    } else {
      setImageError(true);
      setImageLoading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  return (
    <div 
      className={cn(
        "relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-3",
        sizeClasses[size],
        "aspect-[3/4]",
        showHoverEffect && "group",
        className
      )}
    >
      {/* Main Image */}
      {!imageError && (
        <img
          src={currentImageUrl}
          alt={alt || `${title} by ${author}`}
          className={cn(
            "max-w-full max-h-full object-contain rounded shadow-sm transition-all duration-300",
            showHoverEffect && "group-hover:scale-105",
            imageLoading && "opacity-0"
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}
      
      {/* Loading Spinner */}
      {imageLoading && showLoadingSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        </div>
      )}
      
      {/* Fallback Icon */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Book className="h-12 w-12" />
            <div className="text-center text-xs px-2">
              <p className="font-medium truncate max-w-full">{title}</p>
              <p className="opacity-75 truncate max-w-full">{author}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Specialized variants for different use cases
export function BookCoverSmall(props: Omit<BookCoverProps, 'size'>) {
  return <BookCover {...props} size="sm" />;
}

export function BookCoverMedium(props: Omit<BookCoverProps, 'size'>) {
  return <BookCover {...props} size="md" />;
}

export function BookCoverLarge(props: Omit<BookCoverProps, 'size'>) {
  return <BookCover {...props} size="lg" />;
}

export function BookCoverXLarge(props: Omit<BookCoverProps, 'size'>) {
  return <BookCover {...props} size="xl" />;
}
