import { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  type?: 'polite' | 'assertive';
  className?: string;
}

export default function LiveRegion({ message, type = 'polite', className = '' }: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && regionRef.current) {
      // Clear the message first to ensure it's announced even if it's the same
      regionRef.current.textContent = '';
      // Use setTimeout to ensure the clear is processed before setting the new message
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      }, 100);
    }
  }, [message]);

  return (
    <div
      ref={regionRef}
      aria-live={type}
      aria-atomic="true"
      className={`sr-only ${className}`}
      aria-label="Live region"
    />
  );
} 