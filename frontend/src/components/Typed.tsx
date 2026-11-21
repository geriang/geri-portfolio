'use client';

import React, { useEffect, useState } from 'react';

export interface TypedProps {
  items: string[];
  className?: string;
}

/**
 * Cycles through `items` with a typewriter effect (reproduces the live site's
 * typed.js). Timers are cleaned up on unmount so it is safe in jsdom tests.
 */
export function Typed({ items, className = '' }: TypedProps) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const current = items[index % items.length] ?? '';

    const typeChar = (i: number) => {
      if (cancelled) return;
      if (i <= current.length) {
        setText(current.slice(0, i));
        timer = setTimeout(() => typeChar(i + 1), 90);
        return;
      }
      timer = setTimeout(() => {
        if (cancelled) return;
        setIndex((prev) => (prev + 1) % items.length);
      }, 1600);
    };

    timer = setTimeout(() => typeChar(1), 300);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [index, items]);

  return (
    <span className={className}>
      {text}
      <span className="typed-cursor" aria-hidden="true">
        &nbsp;
      </span>
    </span>
  );
}

export default Typed;
