"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    fetchAuthSession().then(session => {
      const groups = session.tokens?.accessToken?.payload?.['cognito:groups'];
      if (Array.isArray(groups) && groups.includes('admin')) {
        setIsAdmin(true);
      }
    }).catch(console.error);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
  ];
  if (isAdmin) {
    navLinks.push({ name: 'Admin', path: '/admin/blogs' });
  }

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav shadow-2xl shadow-black/20">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-black text-primary italic font-headline tracking-tight">
          WanBlog
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={cn(
                "font-headline tracking-tight transition-colors hover:text-primary/80",
                pathname === link.path 
                  ? "text-primary font-bold border-b-2 border-primary pb-1" 
                  : "text-on-surface-variant"
              )}
            >
              {link.name}
            </Link>
          ))}
          <button className="ml-4 p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer">
            <span className="text-primary text-xs uppercase tracking-widest font-label">Light/Dark</span>
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-on-surface font-label text-xs uppercase tracking-widest">
            {isMenuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-surface-container border-t border-outline-variant/10 p-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "font-headline text-lg tracking-tight",
                pathname === link.path ? "text-primary font-bold" : "text-on-surface-variant"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
