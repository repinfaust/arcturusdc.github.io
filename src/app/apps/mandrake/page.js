import Header from '@/components/Header'; 
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';

export default function Mandrake(){
  return (
    <>
      <Header/>
      <main className="pb-10">
        <div className="card p-4 flex items-center gap-3 mt-2">
          <Image className="rounded-2xl border border-black/10" src="/assets/mandrake.png" width={64} height={64} alt="Mandrake logo"/>
          <div>
            <div className="font-extrabold">Mandrake</div>
            <div className="text-muted text-sm">Private urge logging, quick tactics, and pattern insights.</div>
          </div>
        </div>
        <div className="card p-6 mt-3">
          <div className="text-2xl font-extrabold mb-2">Choose a platform</div>
          <div className="flex gap-2 flex-wrap">
            <Link className="btn btn-primary" href="/apps/mandrake/android">Android (Google Play)</Link>
            <Link className="btn btn-primary" href="/apps/mandrake/ios">iOS (Apple App Store)</Link>
          </div>
        </div>
      </main>
      <Footer/>
    </>
  )
}
