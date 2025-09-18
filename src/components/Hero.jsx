import Link from 'next/link';

export default function Hero(){
  return (
    <section className="grid md:grid-cols-2 gap-4 items-stretch">
      <div className="card p-6 relative overflow-hidden">
        <div className="text-xs font-extrabold text-brand">Product & Apps</div>
        <h2 className="text-4xl font-extrabold mt-1">Software that ships.</h2>
        <p className="text-lg text-muted mt-1">Pragmatic product, apps, and privacy‑first delivery for regulated environments.</p>
        <div className="flex gap-2 flex-wrap mt-3">
          <Link className="btn btn-primary" href="/apps">Explore apps</Link>
          <a className="btn btn-secondary" href="#capabilities">Capabilities</a>
        </div>
        <div className="flex gap-2 flex-wrap mt-3">
          <span className="badge">UK Ltd</span>
          <span className="badge">App Store & Google Play compliant</span>
          <span className="badge">UK based</span>
        </div>
      </div>
      <div className="card grid place-items-center p-6">
        <div className="text-center">
          <div className="w-[84px] h-[84px] mx-auto rounded-2xl shadow-soft border border-black/10 grid place-items-center bg-white">
            <span className="sr-only">ArcturusDC</span>
          </div>
          <div className="text-2xl font-extrabold mt-2">ArcturusDC</div>
          <div className="text-muted">Clarity over clutter. Outcomes over theatre.</div>
        </div>
      </div>
    </section>
  );
}
