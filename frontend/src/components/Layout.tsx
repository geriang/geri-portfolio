import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import 'swiper/swiper-bundle.min.css';
import 'glightbox/dist/css/glightbox.min.css';

import React from 'react';
import { useEffect } from 'react';
import AOS from 'aos';
import Head from 'next/head';
import { ChatProvider } from '../context/ChatContext';


useEffect(() => {
  AOS.init({
    duration: 800,
    once: true,
  });
}, []);
import { ChatButton } from './ChatButton';

// The entire layout is wrapped with ChatProvider so that ChatButton and any page content share the same context
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <div className="flex flex-col min-h-screen bg-background dark:bg-backgroundDark text-foreground dark:text-foregroundDark font-sans">
        <Head><link rel="stylesheet" href="/assets/css/main.css" /></Head>
        <header className="header d-flex align-items-center fixed-top">
          <div className="container-fluid container-xl position-relative d-flex align-items-center justify-content-between">
            <a className="logo d-flex align-items-center" href="/">
              <h1 className="sitename">Tech Portfolio</h1>
            </a>
            <nav id="navmenu" className="navmenu">
              <ul>
                <li><a className="active" href="/">Home</a></li>
                <li><a href="/skill">Technical Skill</a></li>
                <li><a href="/framework">Framework</a></li>
                <li><a href="/resume">Resume</a></li>
                <li><a href="/portfolio">Portfolio</a></li>
              </ul>
              <i className="mobile-nav-toggle d-xl-none bi bi-list"></i>
            </nav>
          </div>
        </header>
        <main className="flex-1 container mx-auto p-4">
          {children}
        </main>
        <ChatButton />
        <footer id="footer" className="footer dark-background">
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
      </div>
    </ChatProvider>
  );
}
