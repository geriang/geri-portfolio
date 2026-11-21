'use client';

import React, { useState } from 'react';
import { PORTFOLIO_CATEGORIES, PROJECTS } from '@/data/content';
import { PortfolioItem } from './PortfolioItem';

/**
 * Filterable portfolio grid (reproduces the live site's isotope filtering with
 * a plain useState — no vendor dependency).
 */
export function PortfolioGrid() {
  const [active, setActive] = useState('*');
  const items = active === '*' ? PROJECTS : PROJECTS.filter((p) => p.category === active);

  return (
    <div>
      <ul className="portfolio-filters" aria-label="Portfolio filters">
        {PORTFOLIO_CATEGORIES.map((cat) => (
          <li key={cat.id}>
            <button
              type="button"
              className={cat.id === active ? 'filter-active' : ''}
              aria-pressed={cat.id === active}
              onClick={() => setActive(cat.id)}
            >
              {cat.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((project) => (
          <PortfolioItem key={project.name} project={project} />
        ))}
      </div>
    </div>
  );
}

export default PortfolioGrid;
