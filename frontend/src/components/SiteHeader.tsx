'use client';

import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { navItems, site } from '@/lib/content';

interface SiteHeaderProps {
  /** Path of the current page, used to mark the matching nav item active. */
  active: string;
}

/**
 * Fixed site header: sitename on the left, nav menu on the right.
 *
 * Reproduces the template's `#header` behaviour — transparent until the page is
 * scrolled past 100px, then a translucent background plus shadow — and its
 * mobile panel, which opens over the whole viewport below 1200px.
 */
export function SiteHeader({ active }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    document.addEventListener('scroll', onScroll);
    return () => document.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nav-open', navOpen);
    return () => document.body.classList.remove('nav-open');
  }, [navOpen]);

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container-wide relative flex items-center justify-between">
        <a href="/" className="flex items-center" aria-label={site.sitename}>
          <h1 className="sitename">{site.sitename}</h1>
        </a>

        <nav className="nav-overlay" aria-label="Main navigation">
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={navOpen}
            aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setNavOpen((open) => !open)}
          >
            <Icon name={navOpen ? 'x' : 'list'} label={navOpen ? 'Close' : 'Menu'} />
          </button>

          <ul className="nav-menu">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`nav-link${
                    item.href === active ? ' is-active' : ''
                  }`}
                  aria-current={item.href === active ? 'page' : undefined}
                  onClick={() => setNavOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
