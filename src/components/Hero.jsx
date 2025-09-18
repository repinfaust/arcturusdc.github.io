import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_100%_0%,rgba(240,69,47,0.14),transparent_60%),radial-gradient(60%_50%_at_-10%_20%,rgba(240,69,47,0.10),transparent_55%)]" />
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-24 md:py-32">
        <p className="text-xs uppercase tracking-wider text-brand font-semibold mb-4">Product & Apps</p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Software that ships.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Pragmatic product, apps, and privacy-first delivery for regulated environments.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/apps" className="btn-primary">Explore apps</Link>
          <Link href="/product-strategy" className="btn-secondary">Capabilities</Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Badge>UK Ltd</Badge>
          <Badge>App Store & Google Play compliant</Badge>
          <Badge>UK based</Badge>
        </div>
      </div>
    </section>
  );
}

function Badge({ children }) {
  return <span className="px-3 py-1 rounded-full text-sm bg-white border border-neutral-200 shadow-sm">{children}</span>;
}
