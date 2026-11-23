import React from 'react';
import { Icon } from './Icon';
import { Reveal } from './Reveal';
import { TypedText } from './TypedText';
import { site } from '@/lib/content';

/**
 * Home hero: full viewport dark panel with the name, the typed role line and the
 * circular social links, matching the template's `#hero`.
 */
export function Hero() {
  return (
    <section className="hero section dark-background">
      <Reveal animation="zoom-out" delay={100} className="container-page relative z-[3]">
        <h2 className="hero-name">{site.hero.name}</h2>
        <p className="hero-role">
          {site.hero.role} <TypedText items={site.hero.typedItems} />
        </p>
        <p className="hero-note">{site.hero.note}</p>

        <div className="hero-social">
          {site.social.hero.map((link) => (
            <a
              key={link.label}
              href={link.href}
              aria-label={link.label}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name={link.icon} />
            </a>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
