'use client';

import { useEffect, useState } from 'react';

const cx = (...classes) => classes.filter(Boolean).join(' ');

export default function Hero() {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setFadeIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className={cx(
      "relative rounded-2xl p-6 sm:p-8 lg:p-10 overflow-hidden card",
      "transition-opacity duration-700",
      fadeIn ? "opacity-100" : "opacity-0"
    )}>
      <div className="mb-2 text-xs font-semibold text-brand/80">Product &amp; Apps</div>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
        Software that ships.
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Pragmatic product, apps, and privacy-first delivery for regulated environments.
      </p>

      <div className="mt-6 flex gap-3 flex-wrap">
        <a href="/apps" className="btn-primary">Explore apps</a>
        <a href="#capabilities" className="btn-secondary">Capabilities</a>
      </div>

      {/* soft brand glow in the corner */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <div className="mt-4 flex gap-2 flex-wrap text-sm">
        <span className="badge">UK Ltd</span>
        <span className="badge">App Store &amp; Google Play compliant</span>
        <span className="badge">UK based</span>
      </div>
    </section>
  );
}
