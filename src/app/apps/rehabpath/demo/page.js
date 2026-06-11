import Image from "next/image";
import Link from "next/link";

const heroPreview = {
  src: "/vid/rehabpath-demo.gif",
};

const walkthroughVideo = {
  src: "/vid/rehabpath-demo.mp4",
  poster: "/img/rehabpath/onboarding.png",
};

const screenshots = [
  {
    src: "/img/rehabpath/onboarding.png",
    alt: "RehabPath onboarding screen on iPhone",
    caption: "Onboarding — clear privacy and medical-use boundaries before use",
  },
  {
    src: "/img/rehabpath/activity-log.png",
    alt: "RehabPath daily activity log screen on iPhone",
    caption: "Daily recovery view — activity and exercise context in one place",
  },
  {
    src: "/img/rehabpath/symptom-log.png",
    alt: "RehabPath symptom tracking screen on iPhone",
    caption: "Symptom tracking — pain, stiffness, fatigue and notes over time",
  },
  {
    src: "/img/rehabpath/progress-summary.png",
    alt: "RehabPath progress summary screen on iPhone",
    caption: "Progress overview — recent activity, symptoms and recovery patterns",
  },
  {
    src: "/img/rehabpath/milestones.png",
    alt: "RehabPath milestone progress screen on iPhone",
    caption: "Milestones — patient-visible status across the custom plan",
  },
  {
    src: "/img/rehabpath/exercise-detail.png",
    alt: "RehabPath exercise detail screen on iPhone",
    caption: "Exercise detail — plan item, context and completion action",
  },
];

const records = [
  ["Custom plan details", "Stored locally on device", "Reviewed, redacted PDF text only if AI import is used"],
  ["Activity and exercise logs", "Stored locally on device", "Included only in exports or selected AI summary metrics"],
  ["Symptom scores and recovery ratings", "Stored locally on device", "Included only in exports or selected AI summary metrics"],
  ["Written notes", "Stored locally on device", "Not sent to the AI clinician summary feature"],
  ["Milestone progress", "Stored locally on device", "Included only in exports or selected AI summary metrics"],
  ["Clinician progress pack PDF", "Generated on device", "Leaves the device only through the share destination the user chooses"],
];

export const metadata = {
  title: "RehabPath Demo | Arcturus Digital Consulting",
  description:
    "A clinician-facing demo page for RehabPath, a privacy-first recovery plan organiser with custom plans, progress packs, and optional reviewed AI tools.",
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
            RehabPath — your recovery plan, organised
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4C5D58] sm:text-xl">
            Built for people following guidance from a physio, clinician, or therapist, with custom
            plans, daily logging, clinician progress packs, and optional reviewed AI support.
          </p>
          <p className="mt-5 text-sm font-medium text-[#62726D]">
            Current trial build: custom plans are free, data stays local by default, and videos will
            be updated as the AI import and summary flows settle.
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
      <SectionHeading eyebrow="What it is" title="A private recovery workbook for custom plans" />
      <div className="max-w-3xl space-y-5 text-base leading-8 text-[#41514C] sm:text-lg">
        <p>
          Rehab can become fragmented once the appointment ends. People may have a PDF, a few notes,
          a list of exercises, daily symptoms, and questions for the next appointment — but no simple
          place to keep the whole recovery picture together.
        </p>
        <p>
          RehabPath is focused on patient-held custom plans. Users can enter their plan manually or
          import a selectable-text PDF, review the redacted text before AI structures it, and edit the
          resulting plan before saving it.
        </p>
        <p>
          It is deliberately not telehealth, not a wearable, not AI diagnostics and not a community
          app. RehabPath is a private organisation and logging tool for the space between
          appointments.
        </p>
      </div>
    </section>
  );
}

function WalkthroughVideo() {
  return (
    <section className="grid gap-8 border-b border-[#DDE4DE] py-14 sm:py-16 lg:grid-cols-[260px_1fr]">
      <SectionHeading eyebrow="Walkthrough" title="Current app walkthrough" />
      <div>
        <div className="mx-auto w-full max-w-[340px] lg:mx-0">
          <PhoneVideo />
        </div>
        <p className="mt-3 text-sm text-[#667570]">
          Current iPhone walkthrough. New footage for PDF import, clinician packs and AI summary is
          planned.
        </p>
      </div>
    </section>
  );
}

function ScreenshotsGallery() {
  return (
    <section className="border-b border-[#DDE4DE] py-14 sm:py-16">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <SectionHeading eyebrow="Screenshots" title="Core recovery surfaces" />
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
          Optional AI features require an internet connection and are user-initiated. RehabPath shows
          the user what will be sent or included, and AI outputs are reviewed and editable before use.
        </p>
      </div>
    </section>
  );
}

function PrivacyFirst() {
  const points = [
    "No RehabPath account",
    "No cloud sync",
    "No analytics",
    "No advertising trackers",
    "Local storage by default",
    "Reviewed AI input only",
  ];

  return (
    <section className="grid gap-8 border-b border-[#DDE4DE] py-14 sm:py-16 lg:grid-cols-[260px_1fr]">
      <SectionHeading eyebrow="Privacy-first" title="Control without a data relationship" />
      <div className="max-w-3xl">
        <p className="text-lg leading-8 text-[#41514C]">
          In recovery, people need clarity and control — not an unnecessary data relationship.
          RehabPath stores recovery records locally by default. Optional AI features only send
          limited, reviewed, redacted content for the selected task, such as structuring a PDF plan
          or drafting a clinician-pack summary from structured metrics.
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
      <SectionHeading eyebrow="Trial build" title="Custom plans and clinician packs" />
      <div className="max-w-3xl">
        <p className="text-lg leading-8 text-[#41514C]">
          RehabPath is currently focused on custom plan use. The trial build is free for custom
          plans, with paid programme paths outside the current launch experience. Clinician packs are
          patient-generated PDFs intended to support discussion with a qualified clinician.
        </p>
        <div className="mt-7">
          <Link
            href="mailto:repinfaust@arcturusdc.com?subject=RehabPath%20trial"
            className="inline-flex rounded-lg border border-[#AEBDB5] bg-white px-5 py-3 text-sm font-semibold text-[#17211E] hover:border-[#7E9288] hover:bg-[#F3F6F4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B6F68]/35 focus-visible:ring-offset-2"
          >
            Contact ArcturusDC about RehabPath
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
        src={heroPreview.src}
        width={295}
        height={640}
        alt="Animated RehabPath patient walkthrough on iPhone"
        priority={priority}
        unoptimized
      />
    </div>
  );
}

function PhoneVideo() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#D3DDD6] bg-white p-3 shadow-soft">
      <video
        className="aspect-[295/640] w-full rounded-[20px] bg-[#F7F8F6] object-cover"
        src={walkthroughVideo.src}
        poster={walkthroughVideo.poster}
        controls
        preload="metadata"
        playsInline
      />
    </div>
  );
}
