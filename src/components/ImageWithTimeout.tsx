import React, { useState, useEffect, useRef } from 'react';

interface ImageWithTimeoutProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  timeout?: number;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  onTimeout?: () => void;
}

export const ImageWithTimeout: React.FC<ImageWithTimeoutProps> = ({
  src,
  alt,
  className = '',
  style = {},
  timeout = 3000,
  fallback = null,
  onLoad,
  onError,
  onTimeout
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error' | 'timeout'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset state when src changes
    if (src !== currentSrc) {
      setImageState('loading');
      setCurrentSrc(src);
      loadingRef.current = false;
    }
  }, [src, currentSrc]);

  useEffect(() => {
    if (!src || loadingRef.current) return;

    loadingRef.current = true;
    const img = new Image();
    let isCleanedUp = false;

    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      if (!isCleanedUp && imageState === 'loading') {
        setImageState('timeout');
        onTimeout?.();
        img.src = ''; // Cancel the image load
      }
    }, timeout);

    // Set up event handlers
    img.onload = () => {
      if (!isCleanedUp) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setImageState('loaded');
        onLoad?.();
      }
    };

    img.onerror = () => {
      if (!isCleanedUp) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setImageState('error');
        onError?.();
      }
    };

    // Start loading
    img.src = src;
    imgRef.current = img;

    // Cleanup
    return () => {
      isCleanedUp = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (imgRef.current) {
        imgRef.current.onload = null;
        imgRef.current.onerror = null;
        imgRef.current.src = '';
      }
    };
  }, [src, timeout, onLoad, onError, onTimeout, imageState]);

  if (!src) {
    return <>{fallback}</>;
  }

  switch (imageState) {
    case 'loading':
      return (
        <div className={`${className} bg-gray-800 animate-pulse`} style={style}>
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-600 text-2xl">⏳</div>
          </div>
        </div>
      );
    
    case 'loaded':
      return (
        <img
          src={src}
          alt={alt}
          className={className}
          style={style}
        />
      );
    
    case 'error':
    case 'timeout':
      return fallback ? (
        <>{fallback}</>
      ) : (
        <div className={`${className} bg-gray-800`} style={style}>
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-600 text-2xl">
              {imageState === 'timeout' ? '⏱️' : '❌'}
            </div>
          </div>
        </div>
      );
    
    default:
      return null;
  }
};