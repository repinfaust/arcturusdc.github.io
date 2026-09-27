import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Returno Companion — Arcturus Digital Consulting',
  description: 'Keep a personal record of your return to what matters. Goals, daily check-ins, activities and milestones, with space to reflect on your own journey.',
};

const screenshots = [
  { file: 'today', title: 'Keep your goal in view', description: 'Start with what you want to return to, then record today in your own terms.', alt: 'Returno Today screen with an example mountain biking goal and daily check-in options' },
  { file: 'reflect-journey', title: 'See your journey', description: 'Look back through your goal and the milestones that matter to you.', alt: 'Returno Reflect Record screen showing an example goal journey and personal milestones' },
  { file: 'reflect-activity', title: 'Reflect on your records', description: 'Explore activity and check-in charts without a score or a recovery prediction.', alt: 'Returno Reflect Insights screen showing example activity records in a chart' },
];

const features = [
  ['A goal that is yours', 'Name the thing you want to return to. Optional AI can help organise your words into a goal for you to review and edit.'],
  ['Simple daily check-ins', 'Record how you feel, including symptoms, mood, fatigue, stress and sleep. Build a picture from your own observations.'],
  ['Activities and milestones', 'Keep track of everyday activities and exercise, and mark the moments that feel meaningful to you.'],
  ['Factual reflection', 'Revisit your records and compare periods over time. Charts describe what you recorded; they do not diagnose or prescribe.'],
  ['Your account, across devices', 'Sign in with Google to keep a private account copy of your records. Entries are saved on your device and synced when connected.'],
  ['Choices that stay yours', 'Analytics and AI are optional. Delete your records while keeping your account, or delete the account itself, from Settings.'],
];

export default function ReturnoCompanion() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 text-[#182b23] md:px-6">
      <header className="mt-2 flex items-start gap-4 border border-[#d1dbd3] bg-[#f3f1eb] p-5 md:p-6">
        <Image src="/img/returno-companion/icon.png" width={64} height={64} alt="Returno Companion logo" className="shrink-0" priority />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#08714d]">iOS &amp; Android · In testing</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Returno Companion</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed">A personal record of your return to what matters. Keep your goal in view, record how things feel, and make space to look back at your own journey.</p>
        </div>
      </header>

      <section className="mt-4 overflow-hidden border border-[#d1dbd3] bg-[#f3f1eb]" aria-labelledby="inside-returno">
        <div className="bg-[#0e1211] px-6 py-10 text-[#f3f1eb] md:px-10 md:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#42d392]">Your goal. Your pace.</p>
          <h2 id="inside-returno" className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">Getting back starts<br className="hidden sm:block" /> with what matters to you.</h2>
          <p className="mt-5 max-w-2xl leading-relaxed text-[#cbd8cf]">A walk with the dog. Time in the garden. A favourite ride. Returno gives you a place to record the everyday steps, difficult days and personal milestones along the way.</p>
          <a href="#inside" className="mt-7 inline-block border border-[#42d392] px-5 py-3 text-sm font-bold text-[#42d392] hover:bg-[#42d392] hover:text-[#0e1211]">See inside Returno <span aria-hidden="true">↓</span></a>
        </div>

        <div className="p-6 md:p-10">
          <h2 id="inside" className="scroll-mt-28 text-2xl font-extrabold tracking-tight">Inside Returno</h2>
          <p className="mt-2 max-w-2xl text-[#4b6055]">A little structure for your own experience, without pressure to follow someone else&apos;s timeline.</p>
          <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-5 lg:gap-8">
            {screenshots.map((shot) => (
              <figure key={shot.file} className="mx-auto w-full max-w-[290px]">
                <div className="border-[4px] border-[#182b23] bg-white shadow-[6px_6px_0_#c3e9d2]">
                  <Image src={`/img/returno-companion/${shot.file}.png`} alt={shot.alt} width={1170} height={2532} sizes="(max-width: 639px) 290px, (max-width: 1023px) 28vw, 290px" className="h-auto w-full" />
                </div>
                <figcaption className="mt-5">
                  <h3 className="text-lg font-bold">{shot.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4b6055]">{shot.description}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-6 text-xs text-[#4b6055]">Screenshots use demonstration data from the current test build. Appearance may differ between devices.</p>

          <section className="mt-12" aria-labelledby="features">
            <h2 id="features" className="text-2xl font-extrabold">Key features</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {features.map(([title, description]) => (
                <div key={title} className="border-l-4 border-[#08714d] bg-white/60 p-5">
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4b6055]">{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12" aria-labelledby="faq">
            <h2 id="faq" className="text-2xl font-extrabold">Frequently asked questions</h2>
            <div className="mt-5 space-y-3">
              <Faq question="Who is Returno for?">People aged 16 and over who want a personal record of returning to everyday activities after a setback. Your goal and observations guide the record.</Faq>
              <Faq question="Is this a treatment or rehabilitation programme?">No. Returno is a personal wellbeing record, not a medical device or a source of diagnosis, treatment plans or advice about when it is safe to resume an activity. Follow guidance from qualified professionals. It does not share records with clinicians.</Faq>
              <Faq question="How does Premium work?">A 14-day trial gives you full access. After that, a single lifetime purchase unlocks continued logging, editing and Reflect Insights. There is no recurring subscription. You can still read your existing records and delete records or your account if you choose not to buy. The app shows the current local store price before purchase.</Faq>
              <Faq question="Do I have to use AI or analytics?">Both are optional. AI goal help asks for permission and lets you review the text to be sent. It does not receive your stored check-ins or activity history. Analytics is off unless you opt in; health content is excluded. You can change these choices in Settings.</Faq>
              <Faq question="Where are my records kept?">On your device, with a private cloud copy linked to your Google sign-in. Signing out or uninstalling does not delete that cloud copy. Settings provides separate actions to delete records or delete your account; the deletion page below explains both.</Faq>
              <Faq question="Can I download it yet?">Returno Companion is currently in testing on iOS and Android. Public store links will be added here when it launches. For questions, email <a href="mailto:info@returno.health" className="underline underline-offset-4">info@returno.health</a>.</Faq>
            </div>
          </section>
        </div>
      </section>

      <section className="mt-4 border border-[#d1dbd3] bg-white p-6 md:p-8" aria-labelledby="policies">
        <h2 id="policies" className="text-xl font-extrabold">Policies &amp; your data</h2>
        <p className="mt-2 text-sm text-[#4b6055]">Read how Returno works, what information it uses, and how to delete your account or records.</p>
        <nav aria-label="Returno policies" className="mt-5 flex flex-wrap gap-x-7 gap-y-4 text-sm font-bold text-[#08714d]">
          <Link href="/apps/returno-companion/privacy-policy" className="underline underline-offset-4">Privacy policy</Link>
          <Link href="/apps/returno-companion/terms-of-use" className="underline underline-offset-4">Terms of use</Link>
          <Link href="/apps/returno-companion/delete-account" className="underline underline-offset-4">Account &amp; data deletion</Link>
        </nav>
      </section>
    </div>
  );
}

function Faq({ question, children }) {
  return (
    <details className="border border-[#d1dbd3] bg-white/60 p-4">
      <summary className="cursor-pointer font-semibold">{question}</summary>
      <p className="mt-3 text-sm leading-relaxed text-[#4b6055]">{children}</p>
    </details>
  );
}
