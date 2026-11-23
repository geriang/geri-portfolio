import type { Metadata } from 'next';
import './globals.css';
import React from 'react';
import { site } from '@/lib/content';

export const metadata: Metadata = {
  title: site.title,
  description: site.footerTagline,
};

/**
 * Weights are limited to the ones actually used by the design (the live template
 * requests every weight of all three families).
 */
const TEMPLATE_FONTS =
  'https://fonts.googleapis.com/css2' +
  '?family=Roboto:wght@300;400;500;700' +
  '&family=Poppins:wght@400;500' +
  '&family=Raleway:wght@500;600;700&display=swap';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={TEMPLATE_FONTS} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
