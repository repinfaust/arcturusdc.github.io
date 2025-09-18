'use client';
import { useEffect, useRef, useState } from 'react';

export default function Header() {
  const ref = useRef(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      // compact when scrolling down past 40px
      setCompact(y > 40 && y > lastY);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      ref={ref}
      className={`sticky top-0 z-50 transition-all duration-300
      bg-paper/80 backdrop-blur supports-[backdrop-filter]:bg-paper/60
      ${compact ? 'py-2 shadow-soft' : 'py-4'}
      hover:py-4`}
    >
      <nav className="max-w-[1120px] mx-auto px-5 flex items-center gap-6">
        <a href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block w-8 h-8 rounded-xl bg-[url('/assets/starburst.svg')] bg-cover bg-center" aria-hidden />
          Arcturus Digital Consulting
        </a>
        <div className="ml-auto flex items-center gap-5">
          <a className="hover:text-brand" href="/">Home</a>
          <a className="hover:text-brand" href="/apps">Apps</a>
          <a className="hover:text-brand" href="/privacy">Privacy</a>
          <a className="hover:text-brand" href="/terms">Terms</a>
        </div>
      </nav>
    </header>
  );
}
