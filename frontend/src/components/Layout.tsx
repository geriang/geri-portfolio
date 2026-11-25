'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { ChatProvider } from '../context/ChatContext';
import { ChatButton } from './ChatButton';
import { NAV, SITE } from '../data/content';
import { SocialLinks } from './SocialLinks';

// The entire layout is wrapped with ChatProvider so that ChatButton and any page content share the same context
export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <ChatProvider>
      <div className="flex flex-col min-h-screen bg-page text-fg font-sans">
        <header
          className={`fixed top-0 inset-x-0 z-40 py-[15px] transition-all duration-500 ${
            scrolled ? 'bg-black/80 shadow-[0_0_18px_rgba(0,0,0,0.1)]' : 'bg-transparent'
          }`}
        >
          <div className="relative mx-auto flex w-full max-w-[1140px] items-center justify-between px-4">
            <Link href="/" className="flex items-center leading-none">
              <span className="m-0 font-heading text-[30px] font-bold text-white">{SITE.title}</span>
            </Link>

            <nav aria-label="Main">
              <ul
                className={`${
                  menuOpen
                    ? 'absolute right-0 top-[60px] z-[9998] block w-64 rounded-md border border-white/10 bg-surface py-2'
                    : 'hidden'
                } xl:static xl:flex xl:w-auto xl:items-center xl:border-0 xl:bg-transparent xl:p-0`}
              >
                {NAV.map(item => {
                  const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
                  return (
                    <li key={item.href} className="xl:px-[14px] xl:py-[15px]">
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={`group relative flex whitespace-nowrap px-5 py-2.5 font-nav text-[17px] font-medium transition-colors xl:px-0.5 xl:py-0 xl:text-[15px] xl:font-normal hover:text-accent ${
                          active ? 'text-accent' : 'text-fg'
                        }`}
                      >
                        {item.label}
                        <span
                          className={`absolute -bottom-1.5 left-0 hidden h-0.5 bg-accent transition-all duration-300 xl:block ${
                            active ? 'w-[25px]' : 'w-0 group-hover:w-[25px]'
                          }`}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(o => !o)}
                className="text-fg xl:hidden"
              >
                {menuOpen ? <XMarkIcon className="h-8 w-8" /> : <Bars3Icon className="h-8 w-8" />}
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-hero py-[30px] text-center text-sm text-white">
          <div className="mx-auto max-w-[1140px] px-4">
            <div className="mt-12 mb-[30px] flex justify-center">
              <SocialLinks variant="footer" />
            </div>
            <div className="border-t border-white/10 pt-[25px]">
              <span>Copyright {new Date().getFullYear()}</span>{' '}
              <strong className="px-1">Personal</strong> <span>All Rights Reserved</span>
            </div>
          </div>
        </footer>

        <ChatButton />

        <a
          href="#top"
          aria-label="Scroll to top"
          onClick={e => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`fixed right-[15px] z-40 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-black transition-all duration-500 ${
            scrolled ? 'bottom-[15px] visible opacity-100' : '-bottom-[15px] invisible opacity-0'
          }`}
        >
          <ArrowUpIcon className="h-5 w-5 stroke-2" />
        </a>
      </div>
    </ChatProvider>
  );
}
