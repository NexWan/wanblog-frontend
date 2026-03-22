import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full mt-20 py-12 bg-slate-950 border-t border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-8">
        <div className="text-lg font-bold text-slate-100 font-label">
          WanBlog
        </div>
        
        <div className="flex gap-8">
          {['RSS Feed', 'Privacy', 'Terms', 'Contact'].map((item) => (
            <Link 
              key={item}
              href="#" 
              className="text-slate-500 hover:text-tertiary transition-colors font-label text-xs uppercase tracking-widest opacity-80 hover:opacity-100"
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="text-slate-500 font-label text-xs uppercase tracking-widest text-center md:text-right">
          © 2024 WanBlog. <span className="text-primary">Designed for the bold.</span>
        </div>
      </div>
    </footer>
  );
}
