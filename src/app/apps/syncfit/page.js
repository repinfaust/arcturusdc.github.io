import Header from '@/components/Header'; 
import Footer from '@/components/Footer';
import Image from 'next/image';

export default function Syncfit(){
  return (
    <>
      <Header/>
      <main className="pb-10">
        <div className="card p-4 flex items-center gap-3 mt-2">
          <Image className="rounded-2xl border border-black/10" src="/assets/syncfit.png" width={64} height={64} alt="SyncFit logo"/>
          <div>
            <div className="font-extrabold">SyncFit</div>
            <div className="text-muted text-sm">Smart workout scheduling that finds real gaps in your calendar.</div>
          </div>
        </div>
        <div className="card p-6 mt-3">
          <div className="text-2xl font-extrabold mb-2">Policies</div>
          <ul className="list-disc pl-6 mt-2 text-sm">
            <li><a className="underline" href="/privacy">Privacy Policy</a> (generic)</li>
            <li><a className="underline" href="/terms">Terms of Use</a> (generic)</li>
          </ul>
        </div>
      </main>
      <Footer/>
    </>
  )
}
