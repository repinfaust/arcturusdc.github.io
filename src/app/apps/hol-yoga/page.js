import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Heart of Living Yoga',
  description:
    'A heart-centred practice app: daily guided practices, live meditations, teachings, retreats, and community. In development.',
};

export default function HolYoga() {
  return (
    <main className="pb-10">
      {/* Top summary card */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10"
          src="/img/hol-yoga/foundation-logo.png"
          width={64}
          height={64}
          alt="Heart of Living Yoga logo"
          priority
        />
        <div>
          <div className="font-extrabold">Heart of Living Yoga</div>
          <div className="text-muted text-sm">
            Daily heart-centred practice, live meditations, and community.
          </div>
          <p className="mt-2 text-sm text-neutral-700">
            Heart of Living Yoga brings guided practices, live daily meditations, teachings,
            retreats, and ways to support the charity together in one calm place — a living
            teaching space rather than just another meditation library.
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            Free practices to begin with, live morning and evening meditations, and a growing
            library of classes and music. An in-app supporter option helps keep the teachings open
            to all.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#f4128c]/10 px-3 py-1 text-xs font-semibold text-[#b10c68]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f4128c]" />
            In development — coming to iOS and Android
          </p>
        </div>
      </div>

      {/* HERO section with warm background + video */}
      <section className="relative mt-3 overflow-hidden rounded-2xl border border-black/10">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/img/hol-yoga/photo-lotus.jpg"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[#3a0a24]/70 mix-blend-multiply" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#4a0d2c]/60 via-[#3a0a24]/30 to-[#2a0619]/80" />
        </div>

        <div className="p-6 md:p-10">
          {/* Title + intro */}
          <div className="max-w-4xl mx-auto text-center">
            <Image
              src="/img/hol-yoga/yantra.png"
              alt=""
              width={56}
              height={52}
              className="mx-auto mb-4 drop-shadow"
            />
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Inside Heart of Living Yoga
            </h1>
            <p className="mt-3 text-white/85 max-w-2xl mx-auto">
              Daily guided heart-centred practice, live meditations, teachings, retreats, and
              community — held together in one calm space.
            </p>
          </div>

          {/* Video showcase — muted autoplay in a phone-style frame */}
          <div className="mt-6 md:mt-8">
            <div className="relative max-w-[300px] mx-auto flex justify-center">
              <div className="rounded-[2rem] border-4 border-white/25 shadow-2xl overflow-hidden bg-black/50 backdrop-blur-sm">
                <video
                  className="w-full h-auto block"
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster="/img/hol-yoga-poster.jpg"
                  aria-label="Heart of Living Yoga app demonstration"
                >
                  <source src="/vid/hol-yoga-demo.mp4" type="video/mp4" />
                  <source src="/vid/hol-yoga-demo.webm" type="video/webm" />
                </video>
              </div>
              <div
                className="absolute -inset-2 -z-10 rounded-[2.5rem] blur-2xl opacity-50"
                style={{
                  background:
                    'radial-gradient(60% 60% at 50% 50%, rgba(244,18,140,0.35), rgba(0,0,0,0))',
                }}
              />
            </div>
          </div>

          {/* Key Features */}
          <div className="mt-10 md:mt-12">
            <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
              What's inside
            </h2>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-white">
              <Feature
                title="Heart Words for Today"
                desc="A short, heart-centred reflection each day to open your practice — a gentle daily touchpoint that keeps the app feeling alive."
                icon="heart"
              />
              <Feature
                title="Live Daily Meditations"
                desc="Join the live morning and evening group meditations, held in community. See the next session at a glance and step in when it begins."
                icon="live"
              />
              <Feature
                title="Practice Library"
                desc="Guided practices organised in a calm library — everything in one place once you're in, so there's no hunting for the class you want."
                icon="library"
              />
              <Feature
                title="Yoga Class Videos"
                desc="A growing library of yoga class videos to follow at your own pace, alongside the live sessions."
                icon="video"
              />
              <Feature
                title="Music Library"
                desc="Devotional music and chant to accompany your practice, including recordings from the Heart of Living Yoga family."
                icon="music"
              />
              <Feature
                title="Events & Retreats"
                desc="See upcoming retreats, workshops, festivals, and certificated teacher training, with links to book or learn more on the website."
                icon="events"
              />
              <Feature
                title="Support the Charity"
                desc="Simple ways to give and become a supporter, helping keep the teachings free and open to all. Registered charity no. 1169252."
                icon="support"
              />
              <Feature
                title="Free & Deluxe"
                desc="Core practices are free to begin with. A deluxe supporter option unlocks the full library and helps sustain the charity's work."
                icon="deluxe"
              />
            </div>

            {/* FAQ accordion */}
            <div className="mt-10">
              <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
                FAQ
              </h2>
              <div className="mt-5 space-y-3">
                <AccordionItem question="Is the app available yet?">
                  <p>
                    Not quite. Heart of Living Yoga is in active development. This page previews the
                    direction and core experience ahead of release on iOS and Android.
                  </p>
                </AccordionItem>
                <AccordionItem question="What are the live meditations?">
                  <p>
                    Live daily group meditations are held in community — a morning session and an
                    evening session. The app shows the next live session and lets you join when it
                    begins.
                  </p>
                </AccordionItem>
                <AccordionItem question="Is it free?">
                  <p>
                    Core practices are planned to be free. A deluxe supporter option is planned to
                    unlock the full library of practices, classes, and music, and to help support
                    the charity.
                  </p>
                </AccordionItem>
                <AccordionItem question="How do retreats and training work?">
                  <p>
                    The app surfaces upcoming retreats, workshops, festivals, and certificated
                    teacher training. Booking and full details link out to the Heart of Living Yoga
                    website until in-app booking is introduced.
                  </p>
                </AccordionItem>
                <AccordionItem question="Who is behind Heart of Living Yoga?">
                  <p>
                    Heart of Living Yoga is a registered charity (no. 1169252), celebrating unity in
                    diversity through heart-centred practice, teaching, and community. Supporter
                    contributions help keep the teachings open to all.
                  </p>
                </AccordionItem>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Policies</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <a href="/apps/hol-yoga/privacy-policy" className="text-[#b10c68] hover:underline">
              Privacy Policy &amp; Data Removal (HTML)
            </a>
          </li>
          <li>
            <a href="/apps/hol-yoga/terms-of-use" className="text-[#b10c68] hover:underline">
              Terms of Use (HTML)
            </a>
          </li>
        </ul>
        <p className="mt-4 text-xs text-neutral-500">
          Heart of Living Yoga is a registered charity (no. 1169252). App by Arcturus Digital
          Consulting Ltd.
        </p>
      </section>
    </main>
  );
}

/* --- Feature component --- */
function Feature({ title, desc, icon = 'dot' }) {
  const icons = {
    heart: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 17s-6-4-6-8a3.2 3.2 0 016-1.5A3.2 3.2 0 0116 9c0 4-6 8-6 8z" />
      </svg>
    ),
    live: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <circle cx="10" cy="10" r="2.2" />
        <path d="M6 6a6 6 0 000 8M14 6a6 6 0 010 8M3.7 3.7a10 10 0 000 12.6M16.3 3.7a10 10 0 010 12.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    library: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <rect x="3" y="4" width="4" height="12" rx="1" />
        <rect x="8" y="4" width="4" height="12" rx="1" />
        <path d="M13 5l3.5 1-2.5 11-3.5-1z" />
      </svg>
    ),
    video: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <rect x="3" y="5" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 8.5l3 1.5-3 1.5z" />
      </svg>
    ),
    music: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M8 5l8-2v9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="6" cy="14" r="2.2" />
        <circle cx="14" cy="12" r="2.2" />
      </svg>
    ),
    events: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <rect x="3" y="4" width="14" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 8h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="10" cy="12" r="1.4" />
      </svg>
    ),
    support: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 17s-6-4-6-8a3.2 3.2 0 016-1.5A3.2 3.2 0 0116 9c0 4-6 8-6 8z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8.5 9.5h3M10 8v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    deluxe: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 3l1.9 3.9 4.3.6-3.1 3 .7 4.2L10 15.7 6.2 17.7l.7-4.2-3.1-3 4.3-.6z" />
      </svg>
    ),
    dot: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <circle cx="10" cy="10" r="3" />
      </svg>
    ),
  };

  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 mt-1 grid place-items-center rounded-lg border border-white/20 bg-white/10 p-2 shadow-sm text-white">
        {icons[icon]}
      </span>
      <div>
        <h4 className="font-semibold text-white">{title}</h4>
        <p className="text-white/80 text-sm">{desc}</p>
      </div>
    </div>
  );
}

/* --- Accordion components --- */
function AccordionItem({ question, children }) {
  return (
    <details className="group rounded-2xl border border-white/15 bg-white/5 text-white open:bg-white/10 transition">
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 list-none">
        <span className="text-base font-semibold select-none">{question}</span>
        <Chevron />
      </summary>
      <div className="px-4 pb-4 pt-0 text-white/90 text-sm leading-relaxed">{children}</div>
    </details>
  );
}

function Chevron() {
  return (
    <span className="inline-block transition-transform group-open:rotate-180" aria-hidden>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5.5 7.5L10 12l4.5-4.5" />
      </svg>
    </span>
  );
}
