import React from 'react';
import { Icon } from './Icon';
import { site } from '@/lib/content';

/**
 * Global footer: tagline, circular accent social links and the copyright /
 * credits strip, matching the template's `#footer`.
 *
 * The live site keeps the sitename heading empty, so it is omitted here too.
 * The "Designed by BootstrapMade" credit stays because the template's license
 * requires it.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer dark-background">
      <div className="container-page">
        <p className="tagline">{site.footerTagline}</p>

        <div className="footer-social">
          {site.social.footer.map((link) => (
            <a key={link.label} href={link.href} aria-label={link.label}>
              <Icon name={link.icon} />
            </a>
          ))}
        </div>

        <div className="copyright">
          <span>Copyright {site.year}</span>{' '}
          <strong className="sitename">{site.sitename}</strong>{' '}
          <span>All Rights Reserved</span>
        </div>
        <div className="credits">
          Designed by <a href="https://bootstrapmade.com/">BootstrapMade</a>
        </div>
      </div>
    </footer>
  );
}
