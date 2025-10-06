import Link from 'next/link';
import Image from 'next/image';

export default function ADHDAcclaim() {
  return (
    <main className="pb-10">
      {/* Top summary card */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10"
          src="/img/adhdacclaim_logo_1024x1024.png"
          width={64}
          height={64}
          alt="ADHD Acclaim logo"
          priority
        />
        <div>
          <div className="font-extrabold">ADHD Acclaim</div>
          <div className="text-muted text-sm">
            Celebrate wins, earn rewards, feel good — on your terms.
          </div>
          <p className="mt-2 text-sm text-neutral-700">
            ADHD Acclaim is a simple, gamified reward app built for ADHD brains. Instead of pressure,
            deadlines, or streaks, you get to define your own “Wins” — anything from brushing your teeth
            to finishing a project. Every win earns you points, progress, and celebration you can actually
            feel good about. Trade points for rewards you set yourself, and enjoy visible progress without
            the guilt of missed tasks. ADHD Acclaim is all about joy, not judgment.
          </p>
        </div>
      </div>

      {/* HERO section with background + video showcase */}
      <section className="relative mt-3 overflow-hidden rounded-2xl border border-black/10">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/img/adhdacclaim-card-background.png"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
        </div>

        <div className="p-6 md:p-10">
          {/* Title + intro */}
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Inside ADHD Acclaim
            </h1>
            <p className="mt-3 text-white/85 max-w-2xl mx-auto">
              A quick look at how wins, points, and rewards come together — pressure-free.
            </p>
          </div>

          {/* Video */}
          <div className="mt-6 md:mt-8">
            <div className="relative max-w-4xl mx-auto flex justify-center">
              <div className="rounded-xl border border-white/20 shadow-2xl overflow-hidden bg-black/50 backdrop-blur-sm">
                <video
                  className="w-full h-auto aspect-video"
                  src="/vid/ADHDAcclaim_showcase_vid.mp4"
                  poster="/img/adhdacclaim_logo_1024x1024.png"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                />
              </div>
              <div
                className="absolute -inset-2 -z-10 rounded-2xl blur-2xl opacity-40"
                style={{
                  background:
                    'radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,0.25), rgba(0,0,0,0))',
                }}
              />
            </div>

            {/* CTAs – centred */}
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                disabled
                className="inline-flex items-center justify-center rounded-2xl px-6 h-12 text-base font-semibold bg-red-600 text-white opacity-70 cursor-not-allowed"
              >
                Android – Coming Soon
              </button>
              <button
                disabled
                className="inline-flex items-center justify-center rounded-2xl px-6 h-12 text-base font-semibold bg-white text-black opacity-70 cursor-not-allowed border border-black/10"
              >
                iOS – Coming Soon
              </button>
            </div>
          </div>

          {/* Key Features */}
          <div className="mt-10 md:mt-12">
            <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
              Key Features
            </h2>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-white">
              <Feature title="One-Tap Wins" desc="Log any achievement instantly, big or small." icon="log" />
              <Feature title="Instant Points" desc="Earn points and get celebratory feedback the moment you log a win." icon="bolt" />
              <Feature title="Visible Progress" desc="See your points grow and track how far you’ve come." icon="chart" />
              <Feature title="Personal Rewards" desc="Create your own meaningful rewards and cash in points when you’re ready." icon="gift" />
              <Feature title="No Pressure, No Punishment" desc="Forget streaks, deadlines, and overdue tasks — wins only, never shame." icon="shield" />
              <Feature title="Celebrate Everything" desc="Fun visuals and uplifting animations every time you succeed." icon="star" />
            </div>

            {/* FAQ accordion */}
            <div className="mt-10">
              <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
                FAQ
              </h2>
              <div className="mt-5 space-y-3">
                <AccordionItem question="Is ADHD Acclaim a task manager or planner?">
                  <p>
                    No. ADHD Acclaim is not about schedules, lists, or productivity hacks. It’s a
                    celebration app where you log wins and enjoy rewards — at your own pace.
                  </p>
                </AccordionItem>
                <AccordionItem question="What counts as a “Win”?">
                  <p>
                    Anything you decide! Wins can be everyday actions (like making your bed), personal
                    victories (like sending a message you’ve been avoiding), or big milestones. You
                    choose what matters.
                  </p>
                </AccordionItem>
                <AccordionItem question="Do I have to use the app every day?">
                  <p>
                    Not at all. There are no streaks or penalties. Log wins whenever you like — ADHD
                    Acclaim will always celebrate with you.
                  </p>
                </AccordionItem>
                <AccordionItem question="Are rewards built-in or do I add my own?">
                  <p>
                    You create your own rewards, tailored to what motivates you — from “watch an
                    episode of my favourite show” to “buy that snack I’ve been craving.”
                  </p>
                </AccordionItem>
                <AccordionItem question="Is my data private?">
                  <p>
                    Yes. Wins and rewards are stored on your device, and you stay in control of your own
                    data.
                  </p>
                </AccordionItem>
                <AccordionItem question="Who is ADHD Acclaim for?">
                  <p>
                    Anyone who wants positive reinforcement without pressure. While designed for ADHD
                    users, it’s helpful for anyone who finds motivation and joy in celebrating progress.
                  </p>
                </AccordionItem>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Policies (links) */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Policies</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              href="#privacy-policy"
              className="text-blue-600 hover:underline"
            >
              View Privacy Policy (HTML, on this page)
            </Link>
          </li>
          <li>
            <Link
              href="/assets/policies/ADHD_Acclaim_PrivacyPolicy.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Download Privacy Policy (PDF)
            </Link>
          </li>
          <li>
            <Link
              href="/assets/policies/ADHD_Acclaim_TermsOfUse.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Terms of Use (PDF)
            </Link>
          </li>
        </ul>
      </section>

      {/* ----------------------- PRIVACY POLICY (HTML) ----------------------- */}
      <section id="privacy-policy" className="card p-6 mt-4">
        <h1 className="text-2xl md:text-3xl font-extrabold">ADHD Acclaim — Privacy Policy</h1>
        <p className="mt-2 text-sm text-neutral-600">Effective date: 6 October 2025</p>
        <p className="mt-4">
          This Privacy Policy explains how <strong>Arcturus Digital Consulting Ltd</strong> (“Arcturus Digital Consulting”,
          “we”, “our”, or “us”) collects, uses, and protects information when you use the <strong>ADHD Acclaim</strong> mobile application
          (the “App”). By using the App, you agree to the practices described here.
        </p>

        <h2 className="mt-6 font-bold text-lg">1) What information we collect</h2>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            <strong>On-device app data (no account required):</strong> your Wins, points, rewards, and basic app preferences are
            stored locally on your device. This information does not leave your device unless you choose to back it up
            using your device/OS features or share it with us (e.g., via support email).
          </li>
          <li>
            <strong>Crash or diagnostics data:</strong> your device’s operating system or app store may generate anonymised crash
            reports and performance diagnostics. We use these to improve stability and performance.
          </li>
          <li>
            <strong>Support communications:</strong> if you contact us by email, we will process the information you provide
            to investigate and resolve your query.
          </li>
        </ul>

        <h2 className="mt-6 font-bold text-lg">2) How we use information</h2>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>To operate the App’s core features (logging Wins, points, and rewards on your device).</li>
          <li>To fix bugs, improve performance, and maintain security (e.g., using crash/diagnostic reports).</li>
          <li>To provide user support and respond to enquiries.</li>
        </ul>

        <h2 className="mt-6 font-bold text-lg">3) Legal bases (UK/EU)</h2>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li><strong>Legitimate interests:</strong> running and improving the App, including diagnostics.</li>
          <li><strong>Consent:</strong> where required by your platform settings (e.g., device permissions you opt in to).</li>
        </ul>

        <h2 className="mt-6 font-bold text-lg">4) Data storage and retention</h2>
        <p className="mt-2">
          App data is stored on your device and remains there until you delete it or uninstall the App. Support emails are retained
          only as long as necessary to address your request and for reasonable business, legal, or audit purposes.
        </p>

        <h2 className="mt-6 font-bold text-lg">5) Sharing and transfers</h2>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>We do <strong>not</strong> sell your data.</li>
          <li>We may share limited information with service providers who help us operate (e.g., crash analytics),
              under contracts that require appropriate safeguards.</li>
          <li>We may disclose information where required by law or to protect rights, safety, or security.</li>
        </ul>

        <h2 className="mt-6 font-bold text-lg">6) Children’s privacy</h2>
        <p className="mt-2">
          The App is not intended for children under 13. If you believe a child has provided us information, please contact us
          and we will take appropriate steps.
        </p>

        <h2 className="mt-6 font-bold text-lg">7) Your choices and rights</h2>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li><strong>Access, export, or delete on-device data:</strong> you can clear App data via your device settings or by uninstalling the App.</li>
          <li><strong>Permissions:</strong> you can change or revoke device permissions at any time in your device’s settings.</li>
          <li><strong>Contact us:</strong> you may exercise applicable data rights by emailing us (details below).</li>
        </ul>

        <h2 className="mt-6 font-bold text-lg">8) Security</h2>
        <p className="mt-2">
          We take reasonable technical and organisational measures to protect information. No mobile or internet service is
          100% secure; please keep your device and OS up to date and use a device passcode where available.
        </p>

        <h2 className="mt-6 font-bold text-lg">9) International users</h2>
        <p className="mt-2">
          We are a UK company. Where service providers are located outside your country, we use appropriate safeguards consistent
          with applicable law.
        </p>

        <h2 className="mt-6 font-bold text-lg">10) Changes to this policy</h2>
        <p className="mt-2">
          We may update this policy from time to time. We will post the latest version on this page and update the effective date above.
        </p>

        <h2 className="mt-6 font-bold text-lg">11) Contact us</h2>
        <p className="mt-2">
          <strong>Arcturus Digital Consulting Ltd</strong><br />
          82 Victoria Street, Nottingham, NG15 7EA, United Kingdom<br />
          Email: <a href="mailto:info@arcturusdc.com" className="text-blue-600 hover:underline">info@arcturusdc.com</a>
        </p>

        <div className="mt-6">
          <Link
            href="/assets/policies/ADHD_Acclaim_PrivacyPolicy.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl px-4 h-10 text-sm font-semibold bg-white text-black border border-black/10 hover:bg-neutral-100"
          >
            Download PDF version
          </Link>
        </div>

        <p className="mt-6 text-xs text-neutral-500">
          Note: This page presents the full policy text in HTML to meet app store requirements for a readable privacy policy page.
        </p>
      </section>
      {/* --------------------- END PRIVACY POLICY (HTML) --------------------- */}
    </main>
  );
}

/* --- Feature component --- */
function Feature({ title, desc, icon = 'dot' }) {
  const icons = {
