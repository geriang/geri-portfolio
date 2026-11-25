'use client';

import React from 'react';
import Link from 'next/link';

const Navbar = () => {
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Technical Skill', href: '/skill' },
    { name: 'Framework', href: '/framework' },
    { name: 'Resume', href: '/resume' },
    { name: 'Portfolio', href: '/portfolio' },
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-slate-800 dark:text-white">
          Tech Portfolio
        </Link>
        <div className="hidden md:flex space-x-6">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            >
              {item.name}
            </Link>
          ))}
        </div>
        {/* Mobile Menu Button - simplified for now */}
        <div className="md:hidden text-slate-600 dark:text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
