'use client';

import React from 'react';
import { ChatProvider } from '../context/ChatContext';
import { ChatButton } from './ChatButton';
import { Preloader } from './Preloader';
import { ScrollTop } from './ScrollTop';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

interface LayoutProps {
  /** Path of the current page, so the header can mark its nav item active. */
  active?: string;
  children: React.ReactNode;
}

/**
 * Shared page chrome for every route: fixed header with the nav menu, the page
 * content, the footer, the scroll-to-top button, the chat launcher and the
 * loading spinner.
 */
export default function Layout({ active = '/', children }: LayoutProps) {
  return (
    <ChatProvider>
      <SiteHeader active={active} />
      <main className="main">{children}</main>
      <SiteFooter />
      <ScrollTop />
      <ChatButton />
      <Preloader />
    </ChatProvider>
  );
}
