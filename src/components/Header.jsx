'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const tall = hovered || !scrolled;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        'sticky top-4 z-50 mx-auto max-w-6xl transition-all duration-300',
        tall ? 'h-20' : 'h-12',
      ].join(' ')}
    >
      <div className={[
        'flex items-center justify-between rounded-2xl border border-neutral-200/70',
        'bg-white/80 backdrop-blur shadow-soft px-4 md:px-6 transition-all duration-300',
        tall ? 'h-20' : 'h-12 rounded-xl'
      ].join(' ')}>
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/assets/brand/starburst.png" // keep your exact logo file here
            alt="ArcturusDC"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="font-semibold tracking-tight">Arcturus Digital Consulting</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/apps">Apps</NavLink>
          <NavLink href="/privacy">Privacy</NavLink>
          <NavLink href="/terms">Terms</NavLink>
        </nav>

        <Link href="/apps" className="hidden md:inline-flex items-center rounded-xl bg-brand text-white px-3 py-2 text-sm font-medium hover:opacity-95 transition">
          Explore apps
        </Link>
      </div>
    </div>
  );
}

function NavLink({ href, children }) {
  return (
    <Link href={href} className="text-ink/80 hover:text-ink transition">
      {children}
    </Link>
  );
}
