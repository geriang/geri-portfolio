import type { Metadata } from "next";
import "./globals.css";
import React from 'react';
import { ChatProvider } from '../context/ChatContext';

export const metadata: Metadata = {
  title: "Tech Portfolio",
  description: "AI/GenAI Product portfolio by Geri Ang",
};

// Root layout: shell only. Page-specific chrome (header, footer, ChatButton)
// lives in components/Layout.tsx which every page imports.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-foreground font-roboto">
        <ChatProvider>{children}</ChatProvider>
      </body>
    </html>
  );
}
