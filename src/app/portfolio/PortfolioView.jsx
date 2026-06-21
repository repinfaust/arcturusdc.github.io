import Image from 'next/image';
import Link from 'next/link';
import { getPortfolioItems, getPortfolioTier, portfolioTiers, portfolioViewOrder, portfolioViews } from '@/data/portfolio';

function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

function tierItems(items, tierId) {
  return items.filter((item) => item.tier === tierId);
}

function AccessPill({ item }) {
  const tone = item.requiresAuth
    ? 'border-[#f0452f] bg-[#f0452f]/10 text-[#7d2117]'
    : item.tier === 'controlled-demos'
      ? 'border-[#1c1c1a]/30 bg-[#e3dcc9] text-[#1c1c1a]'
      : 'border-[#2f9d55]/40 bg-[#2f9d55]/10 text-[#23633a]';

  return (
    <span className={cn('inline-flex border px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em]', tone)}>
      {item.exposure}
    </span>
  );
}

function PortfolioNav({ activeView }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Portfolio views">
      {portfolioViewOrder.map((viewKey) => {
        const view = portfolioViews[viewKey];
        const href = viewKey === 'portfolio' ? '/portfolio' : `/portfolio/${view.slug}`;
        const active = activeView === viewKey;
        return (
          <Link
            key={viewKey}
            href={href}
            className={cn(
              'border px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors',
              active
                ? 'border-[#1c1c1a] bg-[#1c1c1a] text-[#ece6d8]'
                : 'border-[#1c1c1a]/45 text-[#1c1c1a] hover:border-[#1c1c1a] hover:bg-[#1c1c1a] hover:text-[#ece6d8]',
            )}
          >
            {view.navLabel}
          </Link>
        );
      })}
    </nav>
  );
}

function ItemLogo({ item }) {
  if (!item.icon) {
    return (
      <span className="grid h-14 w-14 place-items-center border border-[#1c1c1a]/20 bg-white font-black">
        {item.title.slice(0, 1)}
      </span>
    );
  }

  return (
    <span className="relative block h-14 w-14 overflow-hidden border border-[#1c1c1a]/20 bg-white">
      <Image
        src={item.icon}
        alt={`${item.title} logo`}
        fill
        sizes="56px"
        className={item.icon.endsWith('.svg') || item.title === 'Dialled MTB' ? 'object-contain p-2' : 'object-cover'}
      />
    </span>
  );
}

function PortfolioItem({ item, index }) {
  return (
    <article className="grid gap-5 border-b border-[#1c1c1a] bg-[#ece6d8] p-6 md:grid-cols-[auto_1fr_auto] md:items-start lg:p-8">
      <div className="flex items-center gap-4">
        <ItemLogo item={item} />
        <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#1c1c1a]/45">
          /{String(index + 1).padStart(2, '0')}
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <AccessPill item={item} />
          <span className="inline-flex border border-[#1c1c1a]/25 px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#1c1c1a]/60">
            {item.status}
          </span>
        </div>
        <h3 className="text-3xl font-black leading-none tracking-tight text-[#1c1c1a] sm:text-4xl">
          {item.title}<span className="text-[#f0452f]">.</span>
        </h3>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#1c1c1a]/75">{item.summary}</p>
        {item.emphasis ? (
          <p className="mt-3 max-w-3xl border-l-2 border-[#f0452f] pl-4 text-sm leading-6 text-[#1c1c1a]/65">
            {item.emphasis}
          </p>
        ) : null}

        {item.proof?.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {item.proof.slice(0, 5).map((proof) => (
              <span
                key={proof}
                className="border border-[#1c1c1a]/20 bg-[#e3dcc9] px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-[#1c1c1a]/65"
              >
                {proof}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 md:min-w-[180px]">
        <Link
          href={item.href}
          className="inline-flex justify-center border border-[#1c1c1a] bg-[#1c1c1a] px-4 py-3 text-center font-mono text-xs uppercase tracking-[0.12em] text-[#ece6d8] transition-colors hover:bg-[#f0452f]"
        >
          {item.requiresAuth ? 'Open' : 'View'}
        </Link>
        {item.secondaryLinks?.slice(0, 3).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex justify-center border border-[#1c1c1a]/40 px-3 py-2 text-center font-mono text-[0.68rem] uppercase tracking-[0.1em] text-[#1c1c1a] transition-colors hover:border-[#1c1c1a] hover:bg-[#1c1c1a] hover:text-[#ece6d8]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </article>
  );
}

function TierSection({ tier, items }) {
  if (!items.length) return null;

  return (
    <section className="border-b-2 border-[#1c1c1a]">
      <div className="grid border-b border-[#1c1c1a] lg:grid-cols-[0.42fr_1fr]">
        <div className="border-b border-[#1c1c1a] bg-[#1c1c1a] p-6 text-[#ece6d8] lg:border-b-0 lg:border-r lg:p-8">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-[#f0452f]">/{tier.id}</p>
          <h2 className="text-4xl font-black leading-[0.92] tracking-tight sm:text-5xl">{tier.label}</h2>
        </div>
        <div className="flex items-end p-6 lg:p-8">
          <p className="max-w-3xl text-base leading-7 text-[#1c1c1a]/70">{tier.description}</p>
        </div>
      </div>

      <div>
        {items.map((item, index) => (
          <PortfolioItem key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

export default function PortfolioView({ viewKey = 'portfolio' }) {
  const view = portfolioViews[viewKey];
  const items = getPortfolioItems(viewKey);
  const visibleTiers = portfolioTiers.filter((tier) => tierItems(items, tier.id).length > 0);
  const publicCount = items.filter((item) => !item.requiresAuth).length;
  const gatedCount = items.length - publicCount;

  return (
    <div className="w-screen -ml-[calc(50vw-50%)] bg-[#ece6d8] text-[#1c1c1a]">
      <section className="relative isolate overflow-hidden border-b-2 border-[#1c1c1a] px-6 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(28,28,26,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(28,28,26,0.07)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <PortfolioNav activeView={viewKey} />
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#1c1c1a]/45">
              {publicCount} public / {gatedCount} controlled
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div>
              <p className="mb-5 max-w-xl font-mono text-xs uppercase tracking-[0.16em] text-[#f0452f]">
                {view.eyebrow}
              </p>
              <h1 className="max-w-5xl text-[clamp(3.8rem,9vw,7.8rem)] font-black uppercase leading-[0.86] tracking-tight">
                {view.title}<span className="text-[#f0452f]">.</span>
              </h1>
            </div>
            <div className="border-l-2 border-[#f0452f] pl-5">
              <p className="text-lg leading-8 text-[#1c1c1a]/75">{view.summary}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {view.primaryCta ? (
                  <Link
                    href={view.primaryCta.href}
                    className="border border-[#1c1c1a] bg-[#1c1c1a] px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-[#ece6d8] transition-colors hover:bg-[#f0452f]"
                  >
                    {view.primaryCta.label}
                  </Link>
                ) : null}
                {view.secondaryCta ? (
                  <Link
                    href={view.secondaryCta.href}
                    className="border border-[#1c1c1a] px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] transition-colors hover:bg-[#1c1c1a] hover:text-[#ece6d8]"
                  >
                    {view.secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-10 grid border border-[#1c1c1a] bg-[#e3dcc9]/80 sm:grid-cols-2 lg:grid-cols-4">
            {visibleTiers.map((tier, index) => {
              const count = tierItems(items, tier.id).length;
              return (
                <div
                  key={tier.id}
                  className={cn('p-4 font-mono uppercase tracking-[0.12em]', index ? 'border-t border-[#1c1c1a] sm:border-l sm:border-t-0' : '')}
                >
                  <div className="text-[0.65rem] text-[#1c1c1a]/50">/{tier.label}</div>
                  <div className="mt-2 text-2xl text-[#1c1c1a]">{String(count).padStart(2, '0')}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b-2 border-[#1c1c1a] bg-[#1c1c1a] px-6 py-6 text-[#ece6d8] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="max-w-4xl text-sm leading-6 text-[#ece6d8]/75">
            Private owner-only and internal tools are deliberately excluded from these public portfolio views. Protected entries do not
            expose private data on the portfolio page.
          </p>
        </div>
      </section>

      {visibleTiers.map((tier) => (
        <TierSection key={tier.id} tier={getPortfolioTier(tier.id)} items={tierItems(items, tier.id)} />
      ))}
    </div>
  );
}
