import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ProductStrategy(){
  return (
    <>
      <Header/>
      <main className="pb-10">
        <section className="card p-6 mt-2">
          <h2 className="text-2xl font-extrabold">Product strategy</h2>
          <p className="text-muted">Outcome‑first planning, ruthless slicing, and fast delivery feedback loops.</p>
        </section>
        <section className="card p-6 mt-4">
          <div className="text-xl font-extrabold mb-3">Approach</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div><div className="badge">1</div><div className="font-bold mt-1">Define outcomes</div><div className="text-muted text-sm">Agree measurable signals that matter to the business.</div></div>
            <div><div className="badge">2</div><div className="font-bold mt-1">Map constraints</div><div className="text-muted text-sm">Regulatory, data, tech debt and operational limits.</div></div>
            <div><div className="badge">3</div><div className="font-bold mt-1">Slice value</div><div className="text-muted text-sm">Sequence thin slices that prove the bet quickly.</div></div>
            <div><div className="badge">4</div><div className="font-bold mt-1">Ship & learn</div><div className="text-muted text-sm">Instrument, review, and course‑correct.</div></div>
          </div>
        </section>
        <section className="card p-6 mt-4">
          <div className="text-xl font-extrabold mb-2">Methods</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div><div className="badge">JTBD</div><div className="font-bold mt-1">Jobs‑to‑be‑Done</div><div className="text-muted text-sm">Frame demand clearly; avoid solution bias.</div></div>
            <div><div className="badge">OPS</div><div className="font-bold mt-1">Opportunity sizing</div><div className="text-muted text-sm">Fast quant with explicit assumptions.</div></div>
            <div><div className="badge">INST</div><div className="font-bold mt-1">Instrumentation</div><div className="text-muted text-sm">Events designed for decisions, not vanity.</div></div>
            <div><div className="badge">RISK</div><div className="font-bold mt-1">Risk slicing</div><div className="text-muted text-sm">Pull the biggest uncertainty forward.</div></div>
          </div>
        </section>
        <section className="card p-6 mt-4">
          <div className="text-xl font-extrabold mb-2">Next step</div>
          <a className="btn btn-primary" href="mailto:hello@arcturusdc.com">Speak to us</a>
        </section>
      </main>
      <Footer/>
    </>
  )
}
