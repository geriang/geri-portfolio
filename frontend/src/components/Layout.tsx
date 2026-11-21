'use client';

import React from 'react';
import { ChatProvider } from '@/context/ChatContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { ScrollTop } from './ScrollTop';
import { ChatButton } from './ChatButton';

// The entire layout is wrapped with ChatProvider so that ChatButton and any
// page content share the same context.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <div className="flex min-h-screen flex-col bg-page font-sans text-fg">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ScrollTop />
        <ChatButton />
      </div>
    </ChatProvider>
  );
}
