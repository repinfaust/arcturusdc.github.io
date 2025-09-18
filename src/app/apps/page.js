import Header from '@/components/Header'; 
import Footer from '@/components/Footer';
import AppTile from '@/components/AppTile';

export default function Apps(){
  return (
    <>
      <Header/>
      <main className="pb-10">
        <div className="card p-6 mt-2">
          <div className="text-2xl font-extrabold mb-1">Our Apps</div>
          <div className="text-muted">Platform pages include store‑ready policy links.</div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <AppTile href="/apps/mandrake" logo="/assets/mandrake.png" name="Mandrake" desc="Private urge logging, quick tactics, and pattern insights."/>
          <AppTile href="/apps/syncfit" logo="/assets/syncfit.png" name="SyncFit" desc="Smart workout scheduling that finds real gaps in busy calendars."/>
          <AppTile href="/apps/adhd-acclaim" logo="/assets/adhd.png" name="ADHD Acclaim" desc="Achievement‑first rewards for ADHD — celebrate wins, skip the guilt."/>
          <AppTile href="/apps/tou-me" logo="/assets/toume.jpg" name="Tou.Me" desc="Coming soon — for you, for me, for them."/>
        </div>
        <div className="card p-6 mt-4">
          <div className="text-2xl font-extrabold mb-2">Policies hub</div>
          <ul className="list-disc pl-6 text-sm">
            <li><a className="underline" href="/privacy">Site Privacy Policy</a></li>
            <li><a className="underline" href="/terms">Site Terms of Use</a></li>
            <li><a className="underline" href="/apps/mandrake">Mandrake policies (Android & iOS)</a></li>
          </ul>
        </div>
      </main>
      <Footer/>
    </>
  )
}
