import type { Metadata } from 'next';
import './globals.css';
import React from 'react';

export const metadata: Metadata = {
  title: 'Tech Portfolio',
  description: 'A personal tech portfolio — AI / GenAI product work.',
};

// gach.work loads these from Google Fonts; mirror the same link for fidelity.
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;0,900;1,400&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Raleway:wght@400;600;700&display=swap';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={FONTS_URL} rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
