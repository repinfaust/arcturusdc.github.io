'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  const compact = scrolled && !hover;

  return (
    <header
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-white/80 backdrop-blur shadow-sm" : "bg-transparent"
      )}
    >
      <div className={cx(
        "mx-auto px-5 transition-all",
        compact ? "max-w-[980px] py-2" : "max-w-[1120px] py-4"
      )}>
        <nav className="flex items-center justify-between">
          <Link href="/" className="font-extrabold text-xl">Arcturus Digital Consulting</Link>
          <ul className="flex items-center gap-6 text-[15px]">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/apps">Apps</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
