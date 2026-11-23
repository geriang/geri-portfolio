'use client';

import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';

/**
 * Accent circle that appears after scrolling past 100px and smooth-scrolls back
 * to the top, matching the template's `.scroll-top`.
 */
export function ScrollTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 100);
    onScroll();
    document.addEventListener('scroll', onScroll);
    return () => document.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      className={`scroll-top${visible ? ' is-visible' : ''}`}
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <Icon name="arrow-up-short" />
    </button>
  );
}
