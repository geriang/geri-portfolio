import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      <header className="bg-foreground text-background p-4">
        <h1 className="text-xl font-bold">gach.work</h1>
      </header>
      <main className="flex-1 container mx-auto p-4">{children}</main>
      <footer className="bg-foreground text-background p-2 text-center text-sm">
        © 2026 gach.work
      </footer>
    </div>
  );
}
