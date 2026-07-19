import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Sidestand — Arcturus Digital Consulting',
  description:
    'The maintenance log and ride record for adventure riders. Service intervals keyed to your odometer, trips you can revisit, and a service history worth money at resale.',
};

export default function Sidestand() {
  return (
    <main className="pb-10">
      <div className="card p-4 flex items-start gap-3 mt-2">
        <div
          className="border border-sidestand-hairline bg-sidestand-paper p-2 flex items-center justify-center"
          style={{ width: 64, height: 64 }}
        >
          <Image src="/img/sidestand-logo.svg" width={48} height={48} alt="Sidestand logo" priority />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-sidestand-ink">
            SIDESTAND<span className="text-sidestand-safety">.</span>
          </h1>
          <div className="text-muted text-sm">Maintenance · Rides · Trips · Stops.</div>
          <p className="mt-2 text-sm text-neutral-700">
            Sidestand is the maintenance log and ride record for adventure and touring motorcyclists —
            the glovebox notebook, done properly. Built for GS tourers, green-laners, and anyone whose
            service history currently lives in their head.
          </p>
        </div>
      </div>

      <section className="relative mt-3 overflow-hidden rounded-2xl border border-sidestand-hairline bg-sidestand-paper">
        <div className="p-6 md:p-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-sidestand-ink tracking-tight">
              Inside Sidestand
            </h2>
            <p className="mt-3 text-sidestand-muted max-w-2xl mx-auto">
              Service intervals keyed to your odometer, trips you can revisit, and a service history
              worth money at resale.
            </p>
          </div>

          <div className="mt-6 md:mt-8">
            <div className="relative max-w-4xl mx-auto flex justify-center">
              <div
                className="w-full aspect-video border border-sidestand-ink overflow-hidden flex flex-col items-center justify-center gap-4 bg-sidestand-panel"
              >
                <Image src="/img/sidestand-logo.svg" width={56} height={56} alt="" />
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-sidestand-safety">
                    Coming Soon
                  </p>
                  <p className="mt-2 text-base font-semibold text-sidestand-ink">
                    Product walkthrough video in production
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 md:mt-12">
            <h2 className="text-2xl md:text-[28px] font-extrabold text-sidestand-ink text-center md:text-left">
              Key Features
            </h2>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <Feature
                title="Maintenance Engine"
                desc="Per-component service intervals — chain and sprockets, oil, valve clearances, air filter, brake pads, tyres, coolant, spokes — triggered by distance, hours, or calendar. Reminders before things go wrong, keyed to the number every rider already knows: the odometer."
              />
              <Feature
                title="The Garage"
                desc="Every bike you own, with its own setup, odometer, and full service history. One-bike GS owner or a fleet of green-lane hacks — each machine keeps its own record."
              />
              <Feature
                title="Rides &amp; Trips"
                desc="Log rides in seconds with an odometer entry. Group them into trips — Scotland NC500, five days, 1,240 miles — so your touring life doesn't evaporate into a camera roll."
              />
              <Feature
                title="Stops Map"
                desc="Pin the caf&eacute;s, viewpoints, camps, and fuel stops worth remembering. The sidestand-down moments, saved. Personal pins — nothing shared, nothing social."
              />
              <Feature
                title="Documents Wallet"
                desc="MOT, insurance, service receipts, tyre dates — the glovebox, in the app. Everything that proves your bike's history, in one place."
              />
              <Feature
                title="Service History Export"
                desc="Export your full, dated service history as a document. A properly documented history adds real money at resale — this is the record that proves the care."
              />
            </div>

            <div className="mt-10">
              <h2 className="text-2xl md:text-[28px] font-extrabold text-sidestand-ink text-center md:text-left">
                FAQ
              </h2>
              <div className="mt-5 space-y-3 text-sm text-neutral-700">
                <Faq q="Who is Sidestand for?">
                  Adventure and touring motorcyclists — the rider with one cherished GS and a European
                  trip a year, the green-laner burning through chains at three times the road rate, and
                  the new ADV owner who wants confidence they&apos;re not wrecking the dream bike.
                </Faq>
                <Faq q="How do maintenance intervals work?">
                  Each component carries its own interval — by distance, engine hours, or calendar. Your
                  bike ships with sensible defaults (chain every 800 km, oil every 10,000 km, and so on),
                  all editable to match your model&apos;s service schedule. Logging a ride advances the
                  odometer and Sidestand tells you what&apos;s due.
                </Faq>
                <Faq q="Does it need GPS or a tracker?">
                  No. Rides are logged from your odometer — the way service intervals have always worked.
                  There is no background ride tracking; location is only used, with your permission, to
                  centre the Stops map when you pin a place.
                </Faq>
                <Faq q="Where does my data live?">
                  Your records are stored against your account in Google Firebase and are deletable at any
                  time from within the app. See the Privacy Policy for what we collect and the third-party
                  services (sign-in, maps, subscriptions) the app uses.
                </Faq>
                <Faq q="What's Free and what's Premium?">
                  Free covers one bike and your current-year ride log. Premium (monthly or annual)
                  unlocks the service-history export, unlimited history, and the documents wallet.
                </Faq>
                <Faq q="Android and iOS?">
                  Yes — Sidestand is being built for both, in step.
                </Faq>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Policies</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/apps/sidestand/privacy-policy" className="text-sidestand-safety hover:underline">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/apps/sidestand/terms-of-use" className="text-sidestand-safety hover:underline">
              Terms of Use
            </Link>
          </li>
          <li>
            <Link href="/apps/sidestand/delete-account" className="text-sidestand-safety hover:underline">
              Delete your account / request data deletion
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="bg-sidestand-panel border border-sidestand-hairline p-4 relative">
      <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-sidestand-safety" />
      <div className="pl-3">
        <h3 className="font-extrabold text-sidestand-ink">{title}</h3>
        <p className="mt-1 text-sm text-sidestand-muted" dangerouslySetInnerHTML={{ __html: desc }} />
      </div>
    </div>
  );
}

function Faq({ q, children }) {
  return (
    <details className="bg-sidestand-panel border border-sidestand-hairline p-4">
      <summary className="font-bold text-sidestand-ink cursor-pointer">{q}</summary>
      <p className="mt-2">{children}</p>
    </details>
  );
}
