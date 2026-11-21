'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Scroll-reveal wrapper (reproduces the live site's AOS fade-up without the
 * vendor dependency). Falls back to "always visible" where
 * IntersectionObserver is unavailable (e.g. jsdom unit tests).
 */
export function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export default Reveal;
