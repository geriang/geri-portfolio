'use client';

import React, { useEffect, useRef, useState } from 'react';

export type RevealAnimation = 'fade' | 'fade-up' | 'zoom-out';

interface RevealProps {
  animation?: RevealAnimation;
  /** Transition delay in milliseconds, mirroring the template's staggered reveals. */
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * Scroll reveal wrapper, standing in for the template's AOS vendor script.
 *
 * Behaviour matches `AOS.init({ duration: 600, easing: 'ease-in-out', once: true })`
 * from the original `main.js`: an element animates in the first time it enters the
 * viewport and stays visible. Environments without `IntersectionObserver` (tests)
 * and users who prefer reduced motion get the finished state immediately.
 */
export function Reveal({
  animation = 'fade-up',
  delay = 0,
  className = '',
  children,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!node || typeof IntersectionObserver === 'undefined' || prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -120px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      data-reveal={animation}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
