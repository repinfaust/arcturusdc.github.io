import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import FeatureCard from '@/components/FeatureCard';

export default function Page(){
  return (
    <>
      <Header/>
      <main className="pb-10">
        <Hero/>

        <section id="capabilities" className="card p-6 mt-4">
          <div className="text-2xl font-extrabold mb-2">Capabilities</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard code="PS" title="Product strategy" desc="Find and ship the next most valuable thing." href="/product-strategy"/>
            <FeatureCard code="AD" title="App development" desc="Android & iOS with privacy‑first design."/>
            <FeatureCard code="DA" title="Data & analytics" desc="From instrumentation to insight, minus the spin."/>
          </div>
          <div className="flex gap-2 flex-wrap mt-3 text-sm">
            <span className="badge">Discovery</span>
            <span className="badge">Compliance support</span>
            <span className="badge">Delivery ops</span>
          </div>
        </section>

        <section className="card p-6 mt-4">
          <div className="text-2xl font-extrabold mb-2">Apps</div>
          <p className="text-muted">Find policies and platform specifics for each app.</p>
          <a className="underline font-bold" href="/apps">Browse apps →</a>
        </section>
      </main>
      <Footer/>
    </>
  );
}
