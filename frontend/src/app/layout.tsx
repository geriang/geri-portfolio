import type { Metadata } from "next";
import "./globals.css";
import React from 'react';

export const metadata: Metadata = {
  title: "Geri Ang - Tech Portfolio",
  description: "AI/GenAI Product Strategist, Manager, Owner, Builder",
  keywords: "AI, Product Management, GenAI, LLM, Software Engineering",
};

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&family=Poppins:wght@400;500;600;700&family=Raleway:wght@400;600;700;800&display=swap";

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
