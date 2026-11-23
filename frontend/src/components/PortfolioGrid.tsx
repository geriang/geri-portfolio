'use client';

import React, { useState } from 'react';
import { Icon } from './Icon';
import { Reveal } from './Reveal';
import { portfolioPage } from '@/lib/content';

/**
 * Portfolio cards with the category filter used by the Portfolio page.
 *
 * Reproduces the template's isotope behaviour — a centred filter row that shows
 * "All" or one category — with React state instead of the vendor script. The
 * project screenshots of the original are replaced by generated gradient
 * placeholders, so no real imagery or personal data is committed.
 */
export function PortfolioGrid() {
  const [active, setActive] = useState(portfolioPage.filters[0]?.key ?? '*');

  const items =
    active === '*'
      ? portfolioPage.items
      : portfolioPage.items.filter((item) => item.filter === active);

  return (
    <div className="container-page">
      <Reveal animation="fade-up" delay={100}>
        <ul className="portfolio-filters">
          {portfolioPage.filters.map((filter) => (
            <li key={filter.key}>
              <button
                type="button"
                className={`portfolio-filter${active === filter.key ? ' is-active' : ''}`}
                aria-pressed={active === filter.key}
                onClick={() => setActive(filter.key)}
              >
                {filter.label}
              </button>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal animation="fade-up" delay={200}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="portfolio-content">
              <div
                className="portfolio-thumb"
                role="img"
                aria-label={`${item.title} preview`}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})`,
                }}
              />
              <div className="portfolio-info">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <a
                  href={item.href}
                  className="details-link"
                  title="More Details"
                  aria-label={`More details about ${item.title}`}
                >
                  <Icon name="link-45deg" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
