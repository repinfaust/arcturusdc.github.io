import Image from "next/image";
import Link from "next/link";

const video = {
  src: "/vid/rehabpath-demo.gif",
};

const screenshots = [
  {
    src: "/img/rehabpath/onboarding.png",
    alt: "RehabPath onboarding screen on iPhone",
    caption: "Onboarding — clear recovery guidance before use",
  },
  {
    src: "/img/rehabpath/activity-log.png",
    alt: "RehabPath daily activity log screen on iPhone",
    caption: "Daily activity log — split between ADL and exercise",
  },
  {
    src: "/img/rehabpath/symptom-log.png",
    alt: "RehabPath symptom tracking screen on iPhone",
    caption: "Symptom tracking — pain, stiffness and DOMS on a 0-10 scale",
  },
  {
    src: "/img/rehabpath/progress-summary.png",
    alt: "RehabPath progress summary screen on iPhone",
    caption: "Progress overlay — activity volume against symptom trend",
  },
  {
    src: "/img/rehabpath/milestones.png",
    alt: "RehabPath milestone progress screen on iPhone",
    caption: "Milestones — visible progress through the recovery path",
  },
  {
    src: "/img/rehabpath/exercise-detail.png",
    alt: "RehabPath exercise detail screen on iPhone",
    caption: "Exercise detail — steps, safety note and completion action",
  },
];

const records = [
  ["Activity logs (ADL and exercise)", "Stored on device only", "Nothing leaves the device"],
  ["Symptom scores (joint pain, muscle pain, stiffness, DOMS)", "Stored on device only", "Nothing leaves the device"],
  ["Motivation", "Stored on device only", "Nothing leaves the device"],
  ["Mood", "Stored on device only", "Nothing leaves the device"],
  ["Milestone progress", "Stored on device only", "Nothing leaves the device"],
  ["Exercise adherence", "Stored on device only", "Nothing leaves the device"],
];

export const metadata = {
  title: "RehabPath Demo | Arcturus Digital Consulting",
  description:
    "A clinician-facing demo page for RehabPath, a structured, privacy-first recovery companion currently in pilot with selected physiotherapists.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RehabPathDemoPage() {
  return (
    <div className="bg-[#F7F8F6] text-[#17211E]">
      <main className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl pb-16 pt-8 sm:pb-20 sm:pt-12">
          <Hero />
          <WhatItIs />
          <WalkthroughVideo />
          <ScreenshotsGallery />
          <WhatTheAppRecords />
          <PrivacyFirst />
          <PilotProgramme />
        </div>
      </main>
    </div>
  );
}

function Hero() {
  return (
    <section className="border-b border-[#DDE4DE] pb-14 sm:pb-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-center">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#4B6F68]">
            RehabPath demo
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[#17211E] sm:text-5xl lg:text-6xl">
            RehabPath — a structured, privacy-first recovery companion
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4C5D58] sm:text-xl">
            Built for people transitioning from clinical care back to independent rehabilitation at
            home.
          </p>
          <p className="mt-5 text-sm font-medium text-[#62726D]">
            Currently in pilot with selected physiotherapists.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[320px] lg:mr-0">
          <PhoneGif priority />
        </div>
      </div>
    </section>
  );
}

function WhatItIs() {
  return (
    <section className="grid gap-8 border-b border-[#DDE4DE] py-14 sm:py-16 lg:grid-cols-[260px_1fr]">
      <SectionHeading eyebrow="What it is" title="A practical recovery workbook for the home phase" />
      <div className="max-w-3xl space-y-5 text-base leading-8 text-[#41514C] sm:text-lg">
        <p>
          Home recovery is often fragmented. Patients leave structured clinical care with exercises,
          advice and good intentions, but progress can become invisible once daily life takes over.
          It is easy to lose the rhythm of rehabilitation or miss the small signals that recovery is
          moving in the right direction.
        </p>
        <p>
          RehabPath provides structured daily guidance, visible milestones and gentle accountability:
          a recovery workbook that lives in your pocket. It helps people log activity, symptoms,
          motivation and adherence in a calm routine they can understand and return to.
        </p>
        <p>
          It is deliberately not telehealth, not a wearable, not AI diagnostics and not a community
          app. RehabPath is a private, patient-held support tool for the space between appointments.
        </p>
      </div>
    </section>
  );
}

function WalkthroughVideo() {
  return (
    <section className="grid gap-8 border-b border-[#DDE4DE] py-14 sm:py-16 lg:grid-cols-[260px_1fr]">
      <SectionHeading eyebrow="Walkthrough" title="Patient experience on iPhone" />
      <div>
        <div className="w-full max-w-[340px]">
          <PhoneGif />
        </div>
        <p className="mt-3 text-sm text-[#667570]">
          60-second walkthrough of the patient experience on iPhone
        </p>
      </div>
    </section>
  );
}

function ScreenshotsGallery() {
  return (
    <section className="border-b border-[#DDE4DE] py-14 sm:py-16">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <SectionHeading eyebrow="Screenshots" title="Core recovery flows" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {screenshots.map((screenshot) => (
            <figure
              key={screenshot.caption}
              className="overflow-hidden rounded-lg border border-[#D3DDD6] bg-white"
            >
              <div className="bg-[#EEF3F0] p-4">
                <Image
                  src={screenshot.src}
                  width={720}
                  height={1280}
                  alt={screenshot.alt}
                  sizes="(min-width: 1280px) 280px, (min-width: 640px) 44vw, 92vw"
                  className="mx-auto aspect-[9/16] max-h-[460px] w-auto rounded-md object-cover"
                />
              </div>
              <figcaption className="border-t border-[#E2E8E3] px-4 py-3 text-sm leading-6 text-[#41514C]">
                {screenshot.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatTheAppRecords() {
  return (
    <section className="grid gap-8 border-b border-[#DDE4DE] py-14 sm:py-16 lg:grid-cols-[260px_1fr]">
      <SectionHeading eyebrow="Recorded data" title="What the app records" />
      <div>
        <div className="overflow-x-auto rounded-lg border border-[#D3DDD6] bg-white">
          <table className="min-w-full divide-y divide-[#E2E8E3] text-left text-sm">
            <thead className="bg-[#EEF3F0] text-xs font-semibold uppercase tracking-[0.12em] text-[#52625D]">
              <tr>
                <th scope="col" className="px-4 py-4">
                  Data captured
                </th>
                <th scope="col" className="px-4 py-4">
                  Where it&rsquo;s stored
                </th>
                <th scope="col" className="px-4 py-4">
                  What leaves the device
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E3] text-[#32413D]">
              {records.map(([captured, stored, leaves]) => (
                <tr key={captured}>
                  <td className="px-4 py-4 font-medium text-[#17211E]">{captured}</td>
                  <td className="px-4 py-4">{stored}</td>
                  <td className="px-4 py-4">{leaves}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#667570]">
          Future versions may include patient-initiated export (e.g. PDF recovery snapshot the
          patient shares with their clinician). Any sharing will always be patient-controlled.
        </p>
      </div>
    </section>
  );
}

function PrivacyFirst() {
  const points = [
    "No accounts",
    "No cloud sync",
    "No analytics",
    "No third-party tracking",
    "All data stored locally",
  ];

  return (
    <section className="grid gap-8 border-b border-[#DDE4DE] py-14 sm:py-16 lg:grid-cols-[260px_1fr]">
      <SectionHeading eyebrow="Privacy-first" title="Control without a data relationship" />
      <div className="max-w-3xl">
        <p className="text-lg leading-8 text-[#41514C]">
          In early recovery, people want clarity and control — not a data relationship. RehabPath is
          designed around that principle: no accounts, no cloud sync, no analytics and no
          third-party tracking. Recovery data is stored locally on the patient&rsquo;s device.
        </p>
        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
          {points.map((point) => (
            <li
              key={point}
              className="flex items-center gap-3 rounded-lg border border-[#D3DDD6] bg-white px-4 py-3 text-sm font-medium text-[#263530]"
            >
              <span className="h-2 w-2 rounded-full bg-[#49C96F]" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PilotProgramme() {
  return (
    <section className="grid gap-8 py-14 sm:py-16 lg:grid-cols-[260px_1fr]">
      <SectionHeading eyebrow="Clinician pilot" title="Pilot programme" />
      <div className="max-w-3xl">
        <p className="text-lg leading-8 text-[#41514C]">
          We&rsquo;re currently piloting RehabPath with a small number of physiotherapists in the UK. If
          you&rsquo;re interested in trialling it with clients and providing feedback, get in touch.
        </p>
        <div className="mt-7">
          <Link
            href="mailto:hello@arcturusdc.com?subject=RehabPath%20pilot"
            className="inline-flex rounded-lg border border-[#AEBDB5] bg-white px-5 py-3 text-sm font-semibold text-[#17211E] hover:border-[#7E9288] hover:bg-[#F3F6F4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B6F68]/35 focus-visible:ring-offset-2"
          >
            Contact ArcturusDC about the pilot
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#62726D]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#17211E] sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function PhoneGif({ priority = false }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#D3DDD6] bg-white p-3 shadow-soft">
      <Image
        className="aspect-[295/640] w-full rounded-[20px] object-cover"
        src={video.src}
        width={295}
        height={640}
        alt="Animated RehabPath patient walkthrough on iPhone"
        priority={priority}
        unoptimized
      />
    </div>
  );
}
