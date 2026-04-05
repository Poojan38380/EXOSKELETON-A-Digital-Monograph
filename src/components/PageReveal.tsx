import type { ReactNode } from 'react';

interface PageRevealProps {
  children: ReactNode;
  delay?: number;
}

/**
 * PageReveal — Wraps page content to provide staggered reveal animations.
 * Children are animated in sequentially with configurable delays.
 */
export function PageReveal({ children, delay = 0 }: PageRevealProps) {
  return (
    <div 
      className="page-reveal"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
