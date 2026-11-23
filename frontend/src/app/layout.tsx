import type { Metadata } from "next";
import "./globals.css";
import React from 'react';
import { ChatProvider } from '../context/ChatContext';
import { ChatButton } from '@/components/ChatButton';

const GitHubIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C-4.42-4.575-2.0-3.5-2.0-3.5-1.6-2.4-1.1-2.4-1.1-2.4-1.6-1.6-1.1-1 0.5-1 0.5 1.3 0.5 2.1 1.7 2.8 1.8 2.1 0.8c-1.4-.5-2.4-1.7-2.4-1.7-2.1-0.3-0.7-0.1-0.7-0.1 0.3 0.2 0.6 0.5 0.8 0.6 1.5 1.7 2.2 1.2 2.8 0.9 0.9-0.7 1.8-1.1 2.2-1.3 1.5-0.5 2.1-0.8 2.1-0.8 1.2 0.8 1.8 1.2 2.8 1.2 1.3 0.5 2.6 0.7 2.6 0.7 0.7 0.5 0.5 1.1 0.5 1.1 0.5 1.8 1 2.6 1.3 2.6 1.3 2.1-0.2 3.6-1.4 4.4-1.8 0.4-0.2 0.8-0.7 1.1-1.2-4.2-0.5-8.4-2.1-8.4-2.1-0.4-1.1-1.7-1.8-2.8-1.8-1.7 0-3.1 1.4-2.2 2.3 0.4 0.5 0.7 0.9 0.9 1.2 1 0.3 1.5 0.5 1.5 0.5 0.5 0.2 0.7 0.4 0.7 0.4 0.1 0.3 0.2 0.9 0.2 1.7 0 1.1 0.1 2.1 0.1 2.1 0 0.3 0.2 0.7 0.8 0.5 3.2-1.2 5.6-1.7 7.6-1.7 2 0 4.4 0.5 7.6 1.7 0.6-0.2 0.8-0.5 0.8-0.5 0-1.1 0.1-2.1 0.1-2.1 0 0.8-0.4 1.3-0.8 1.7-0.2 0.2-0.5 0.7-0.5 0.7 0.5 0.2 0.9 0.4 0.9 0.4 0.2 0.5 0.4 0.9 0.4 0.9 0.6 0.5 0.8 1.2 0.8 2.3 0 1.6 0 2.9-0.1 3.2 0.2 0.6 0.4 0.8 0.5 0.8 0.8 0.2 1.2 0.2 1.2 0.2 0.3-0.7 0.7-1.4 1.2-2.1 2.5-1.6 4.1-3.4 4.1-3.4-0.7-0.4-1.4-0.8-2.1-1.2-0.7-0.3-1.4-0.6-2.1-0.8-0.6-0.2-1.2-0.5-1.8-0.8-0.3-0.4-0.6-0.8-0.8-1.2-0.2-0.4-0.3-0.9-0.3-1.4-0.1-0.6-0.1-1.2-0.1-1.8 0-0.1 0-0.2 0-0.4 0-6.626-5.373-12-12-12" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19 0h-14C6.679 0 5 1.679 5 3.5v17c0 1.821 1.679 3.5 3.5 3.5h14c1.821 0 3.5-1.679 3.5-3.5v-17c0-1.821-1.679-3.5-3.5-3.5m-9.337 3.343c0-0.913 0.74-1.656 1.656-1.656 0.913 0 1.656 0.743 1.656 1.656 0 0.914-0.743 1.656-1.656 1.656-0.916 0-1.656-0.742-1.656-1.656m4.494 14.818v-7.614c0-0.999-0.021-2.6-1.22-2.6-1.22 0-1.33 0.912-1.33 1.61v7.614zm-2.832-15.455c0-1.001-0.817-2.134-1.814-2.134-1.003 0-1.82 1.133-1.82 2.134v7.313c0 1.001 0.817 2.134 1.82 2.134 1.003 0 1.814-1.133 1.814-2.134v-7.313z" />
  </svg>
);

export const metadata: Metadata = {
  title: "Tech Portfolio",
  description: "AI/GenAI Product portfolio by Geri Ang",
};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/skill', label: 'Technical Skill' },
  { href: '/framework', label: 'Framework' },
  { href: '/resume', label: 'Resume' },
  { href: '/portfolio', label: 'Portfolio' },
];

// The entire layout is wrapped with ChatProvider so that ChatButton and any page content share the same context
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-foreground font-roboto">
        <ChatProvider>
          {/* Fixed header matching gach.work design */}
          <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <a href="/" className="text-xl font-bold text-foreground no-underline">
                Tech Portfolio
              </a>
              <nav className="hidden md:flex items-center space-x-6">
                <ul className="flex items-center space-x-6 list-none m-0 p-0">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="text-sm font-medium text-foreground hover:text-blue-600 transition-colors no-underline"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="md:hidden">
                <button className="text-lg text-foreground" aria-label="Toggle menu">
                  ☰
                </button>
              </div>
            </div>
          </header>

          {/* Main content with padding-top to account for fixed header */}
          <main className="main pt-20 flex-1 max-w-7xl mx-auto px-4">
            {children}
          </main>

          <ChatButton />

          {/* Footer matching gach.work design */}
          <footer id="footer" className="footer bg-gray-900 text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="flex justify-center space-x-4 mb-8">
                <a href="https://github.com/geriang" className="text-white hover:text-blue-400 transition-colors" aria-label="GitHub">
                  <GitHubIcon />
                </a>
                <a href="https://www.linkedin.com/in/gerillima/" className="text-white hover:text-blue-400 transition-colors" aria-label="LinkedIn">
                  <LinkedInIcon />
                </a>
              </div>
              <div className="text-center">
                <div className="copyright text-sm text-gray-400 mb-2">
                  <span>Copyright 2026</span> <strong className="px-1">Personal</strong> <span>All Rights Reserved</span>
                </div>
                <div className="credits text-xs text-gray-500">
                  Designed by <a href="https://bootstrapmade.com/" className="text-blue-400 hover:text-blue-300 no-underline">BootstrapMade</a>
                </div>
              </div>
            </div>
          </footer>
        </ChatProvider>
      </body>
    </html>
  );
}
