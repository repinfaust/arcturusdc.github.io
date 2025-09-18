'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
// minimal clsx replacement
const cx = (...classes) => classes.filter(Boolean).join(' ');

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // collapsed when scrolled; expands again on hover
  const collapsed = scrolled && !hover;

  return (
    <header
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        'backdrop-blur-md',
        collapsed ? 'h-14' : 'h-20'
      )}
      style={{
        // subtle glass effect + brand tint
        background:
          'linear-gradient(180deg, rgba(248,244,238,0.75) 0%, rgba(248,244,238,0.55) 100%)',
        borderBottom: collapsed ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(0,0,0,0.04)',
        boxShadow: collapsed ? '0 8px 30px rgba(0,0,0,0.06)' : '0 12px 40px rgba(0,0,0,0.04)',
    }}>
      <nav
        className={clsx(
          'mx-auto flex w-full max-w-[1120px] items-center justify-between px-5 transition-all duration-300',
          collapsed ? 'py-2' : 'py-4'
        )}
        aria-label="Main"
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <span
            className={clsx(
              'grid place-items-center rounded-xl border border-black/5 bg-white/70 shadow-sm',
              collapsed ? 'h-8 w-8' : 'h-10 w-10'
            )}
          >
            {/* your starburst emoji/asset */}
            <span className="text-[18px]">✴️</span>
          </span>
          <span
            className={clsx(
              'font-semibold tracking-tight text-ink transition-all duration-300',
              collapsed ? 'text-[18px]' : 'text-[22px]'
            )}
          >
            Arcturus Digital Consulting
          </span>
        </Link>

        {/* Menu */}
        <ul className={clsx(
          'flex items-center gap-6 text-[15px] font-medium transition-all duration-300',
          collapsed ? 'opacity-90' : 'opacity-100'
        )}>
          <li><Link className="hover:opacity-70" href="/">Home</Link></li>
          <li><Link className="hover:opacity-70" href="/apps">Apps</Link></li>
          <li><Link className="hover:opacity-70" href="/privacy">Privacy</Link></li>
          <li><Link className="hover:opacity-70" href="/terms">Terms</Link></li>
        </ul>
      </nav>
    </header>
  );
}
