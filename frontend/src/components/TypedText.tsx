'use client';

import React, { useEffect, useState } from 'react';

interface TypedTextProps {
  items: string[];
}

/**
 * Typewriter used by the hero line, matching the template's typed.js setup:
 * `loop: true, typeSpeed: 100, backSpeed: 50, backDelay: 3000`.
 *
 * Implemented with a small timer instead of the vendor script. Text only ever
 * changes after mount, so the static export cannot produce a hydration mismatch.
 */
export function TypedText({ items }: TypedTextProps) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setText(items[0]);
      return;
    }

    const typeSpeed = 100;
    const backSpeed = 50;
    const backDelay = 3000;

    let index = 0;
    let length = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const word = items[index % items.length];

      if (deleting) {
        length -= 1;
        setText(word.slice(0, length));
        if (length === 0) {
          deleting = false;
          index += 1;
        }
        timer = setTimeout(tick, backSpeed);
        return;
      }

      length += 1;
      setText(word.slice(0, length));
      if (length === word.length) {
        deleting = true;
        timer = setTimeout(tick, backDelay);
        return;
      }
      timer = setTimeout(tick, typeSpeed);
    };

    timer = setTimeout(tick, typeSpeed);

    return () => clearTimeout(timer);
  }, [items]);

  return (
    <span className="typed">
      {text}
      <span className="typed-cursor typed-cursor--blink" aria-hidden="true">
        |
      </span>
    </span>
  );
}
