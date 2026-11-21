'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChatProvider } from '../context/ChatContext';
import { ChatButton } from './ChatButton';

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/skill', label: 'Technical Skill' },
  { href: '/framework', label: 'Framework' },
  { href: '/resume', label: 'Resume' },
  { href: '/portfolio', label: 'Portfolio' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ChatProvider>
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="header d-flex align-items-center">
          <div className="container-fluid container-xl position-relative d-flex align-items-center justify-content-between">
            <a className="logo d-flex align-items-center" href="/">
              <h1 className="sitename">Tech Portfolio</h1>
            </a>

            <nav id="navmenu" className="navmenu">
              <ul>
                {navItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className={pathname === item.href ? 'active' : ''}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="main">
          {children}
        </main>

        {/* Footer */}
        <footer id="footer" className="footer">
          <div className="container">
            <h3 className="sitename"></h3>
            <h6>This portfolio showcases my experience and skills in technology, with a particular focus on my expertise and interest in Product Management and Development.</h6>
            <div className="social-links d-flex justify-content-center mt-5">
              <a href="https://github.com/geriang"><i className="bi bi-github"></i></a>
              <a href="https://www.linkedin.com/in/gerillima/"><i className="bi bi-linkedin"></i></a>
            </div>
            <div className="container">
              <div className="copyright">
                <span>Copyright 2026</span> <strong className="px-1 sitename">Personal</strong> <span>All Rights Reserved</span>
              </div>
              <div className="credits">
                Designed by <a href="https://bootstrapmade.com/">BootstrapMade</a>
              </div>
            </div>
          </div>
        </footer>

        {/* Chat Button Overlay */}
        <ChatButton />

        {/* Scroll to Top Button */}
        <a
          href="#"
          id="scroll-top"
          className={`scroll-top d-flex align-items-center justify-content-center ${showScrollTop ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            scrollToTop();
          }}
        >
          <i className="bi bi-arrow-up-short"></i>
        </a>
      </div>
    </ChatProvider>
  );
}
