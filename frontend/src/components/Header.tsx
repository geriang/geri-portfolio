'use client';

import React, { useEffect, useState } from 'react';
import { NAV, SITE } from '@/data/content';

/**
 * Fixed top navigation. Active-route detection uses window.location (read in an
 * effect, never during render) so it works without a Next router context.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [path, setPath] = useState('/');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setPath(window.location.pathname);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="mx-auto flex w-full max-w-[1140px] items-center justify-between px-4">
        <a href="/" className="flex items-center">
          <span className="site-logo">{SITE.title}</span>
        </a>

        <nav aria-label="Main" className={`navmenu ${menuOpen ? 'is-open' : ''}`}>
          <ul>
            {NAV.map((item) => {
              const active = item.href === '/' ? path === '/' : path.startsWith(item.href);
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={active ? 'is-active' : ''}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="nav-toggle"
          >
            {menuOpen ? '×' : '☰'}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
