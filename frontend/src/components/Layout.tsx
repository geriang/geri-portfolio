'use client';

import React from 'react';
import { ChatProvider } from '../context/ChatContext';
import { ChatButton } from './ChatButton';
import Navbar from './layout/Navbar';

// The entire layout is wrapped with ChatProvider so that ChatButton and any page content share the same context
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
        <ChatButton />
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 text-center text-sm text-slate-600 dark:text-slate-400">
          <div className="container mx-auto px-4">
            <div className="flex justify-center space-x-4 mb-4">
              <a href="https://github.com/geriang" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">GitHub</a>
              <a href="https://www.linkedin.com/in/gerillima/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">LinkedIn</a>
            </div>
            <p>© {new Date().getFullYear()} Personal. All Rights Reserved</p>
            <p className="mt-1">Designed by BootstrapMade</p>
          </div>
        </footer>
      </div>
    </ChatProvider>
  );
}
