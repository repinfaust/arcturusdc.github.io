export default function Hero({
  eyebrow = 'Product & Apps',
  heading = 'Software that ships.',
  subtext = 'Pragmatic product, apps, and privacy-first delivery for regulated environments.',
  ctas = [
    { href: '/apps', label: 'Explore apps', variant: 'primary' },
    { href: '/#capabilities', label: 'Capabilities', variant: 'ghost' },
  ],
}) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-black/5 bg-white/70 shadow-soft"
      style={{
        background: 'radial-gradient(1000px 400px at 85% -10%, rgba(240,69,47,0.10), transparent)',
      }}
    >
      <div className="p-8 md:p-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{eyebrow}</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
          {heading}
        </h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-7 text-muted">{subtext}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {ctas.map((c) => (
            <a
              key={c.label}
              href={c.href}
              className={
                c.variant === 'primary'
                  ? 'rounded-2xl bg-brand px-4 py-2 text-white shadow-sm transition hover:opacity-90'
                  : 'rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-ink transition hover:bg-white'
              }
            >
              {c.label}
            </a>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="badge">UK Ltd</span>
          <span className="badge">App Store & Google Play compliant</span>
          <span className="badge">UK based</span>
        </div>
      </div>
    </section>
  );
}
