'use client';

import React, { useEffect, useState } from 'react';

// Typing animation, replacing typed.js from the original site
export function Typed({ items }: { items: string[] }) {
  const [text, setText] = useState('');

  useEffect(() => {
    let index = 0;
    let pos = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const word = items[index];
      pos += deleting ? -1 : 1;
      setText(word.slice(0, pos));
      let delay = deleting ? 50 : 100;
      if (!deleting && pos === word.length) {
        deleting = true;
        delay = 2000;
      } else if (deleting && pos === 0) {
        deleting = false;
        index = (index + 1) % items.length;
        delay = 500;
      }
      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, 100);
    return () => clearTimeout(timer);
  }, [items]);

  return (
    <>
      <span className="border-b-2 border-accent tracking-[1px]" aria-label={items.join(', ')}>
        {text}
      </span>
      <span className="typed-cursor" aria-hidden="true">|</span>
    </>
  );
}
