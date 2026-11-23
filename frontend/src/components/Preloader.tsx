'use client';

import React, { useEffect, useState } from 'react';

/**
 * Full screen spinner shown while the page loads, matching the template's
 * `#preloader`, which its `main.js` removes on window load.
 */
export function Preloader() {
  const [fading, setFading] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const fade = setTimeout(() => setFading(true), 150);
    const remove = setTimeout(() => setRemoved(true), 900);
    return () => {
      clearTimeout(fade);
      clearTimeout(remove);
    };
  }, []);

  if (removed) {
    return null;
  }

  return <div className={`preloader${fading ? ' is-hidden' : ''}`} aria-hidden="true" />;
}
