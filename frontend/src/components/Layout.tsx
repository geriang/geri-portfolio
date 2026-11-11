'use client';

import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-backgroundDark text-foreground dark:text-foregroundDark font-sans">
      <header className="bg-foreground dark:bg-foregroundDark text-background dark:text-backgroundDark p-4">
        <h1 className="text-xl font-bold">gach.work</h1>
      </header>
      <main className="flex-1 container mx-auto p-4">{children}</main>
      <footer className="bg-foreground dark:bg-foregroundDark text-background dark:text-backgroundDark p-2 text-center text-sm">
        © {new Date().getFullYear()} gach.work
      </footer>
    </div>
  );
}
