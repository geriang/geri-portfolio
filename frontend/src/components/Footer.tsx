import React from 'react';
import { SITE } from '@/data/content';
import { SocialLinks } from './SocialLinks';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="mx-auto w-full max-w-[1140px] px-4">
        <SocialLinks variant="footer" />
        <div className="footer-copy">
          {/* Year is a dynamic value in a static export; suppress the (cosmetic,
              year-boundary-only) hydration mismatch while keeping the correct
              build-year in the static HTML. */}
          <span suppressHydrationWarning>Copyright {new Date().getFullYear()}</span>{' '}
          <strong className="px-1">{SITE.title}</strong> <span>All Rights Reserved</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
