import Image from 'next/image';
import Link from 'next/link';

import styles from './thereabouts.module.css';

export const metadata = {
  title: 'thereabouts — Language readiness for real trips',
  description:
    'Personalised language preparation built around the places, people, and conversations you will actually encounter.',
};

const currentFeatures = [
  {
    index: '01',
    title: 'Prepare both sides of the conversation',
    body: 'Each conversation fold pairs what you may say with reviewed replies you are likely to hear, plus the fragment worth listening for.',
  },
  {
    index: '02',
    title: 'Practise the language for your real trip',
    body: 'The current build is organised around repeat visits to Atessa: cafés, restaurants, food shops, family, neighbours, driving, and local errands.',
  },
  {
    index: '03',
    title: 'Hear it naturally or slowly',
    body: 'Target-language playback has platform-tuned natural and slow rates. Recognition practice asks what a likely reply meant before revealing the words.',
  },
  {
    index: '04',
    title: 'Rehearse aloud without a fake accent score',
    body: 'Push-to-talk practice shows the settled device transcript and any missed words as evidence. Your own judgement remains the outcome.',
  },
  {
    index: '05',
    title: 'Know which language you can trust',
    body: 'Phrases and replies carry visible provenance. Challenging a phrase removes that exact version from practice and keeps its replacement provisional until checked.',
  },
  {
    index: '06',
    title: 'Keep the useful context, not a generic profile',
    body: 'Approved people, places, routines, phrases, and trip moments stay editable. Local SQLite remains the source of truth, with optional account linking and consented cloud backup.',
  },
];

const plannedFeatures = [
  {
    title: 'Conversational trip intake',
    body: 'Describe where you are going and what you expect to do in one short note, with at most one useful follow-up before seeing value.',
  },
  {
    title: 'A fuller acquisition ladder',
    body: 'Break longer phrases into meaningful chunks, explain only the grammar that helps, and build from recognition to whole-phrase spoken recall.',
  },
  {
    title: 'Translation that becomes useful later',
    body: 'Solve the immediate gap, then choose whether to save it, learn it for a future trip, or leave it behind.',
  },
  {
    title: 'Considerate trip attention',
    body: 'Optional, trip-aware reminders with quiet hours, easy pause controls, no streaks, and no notification unless there is a genuine reason.',
  },
  {
    title: 'The return loop',
    body: 'Capture what happened on your trip so the next one starts from real encounters rather than another generic beginner syllabus.',
  },
];

const faqs = [
  {
    question: 'Is thereabouts another general language-learning app?',
    answer:
      'No. It is a trip-readiness experiment, and it is not limited to Italian. Your destination, target language, recurring places, people, and likely conversations decide what deserves attention; grammar appears only when it helps with something you are likely to use. Italy is simply the first real trip being prepared.',
  },
  {
    question: 'Why prepare the replies as well as the phrases?',
    answer:
      'Being able to ask a question is not enough if the answer arrives at normal speed. A thereabouts conversation fold includes what you say, likely replies, their meaning, and a useful listening cue.',
  },
  {
    question: 'How is the language checked?',
    answer:
      'Language carries a visible trust status. For the current Italian trip, seed phrases and replies were reviewed by Italian speakers who use them. New or corrected material in any language remains provisional until it passes an allowed review route.',
  },
  {
    question: 'Does it score my pronunciation?',
    answer:
      'No. Device speech recognition can show what was transcribed and which expected words were absent, but it cannot honestly provide phoneme-level pronunciation or accent grading. The app keeps that distinction explicit.',
  },
  {
    question: 'Does it use AI?',
    answer:
      'The app is designed to use a Firebase Function before any OpenAI request, with explicit consent and a tightly bounded phrase-and-trip payload. Saved people, places, preferences, recordings, and sensitive memories are excluded. Live AI translation remains disabled in the current development build while the final App Check gate is completed.',
  },
  {
    question: 'Are there streaks or daily pressure?',
    answer:
      'No. There are no streaks, leagues, XP, punishment mechanics, or percentage-complete scores. Planned reminders are opt-in, pausable, trip-aware, and only appear when there is something genuinely worth preparing.',
  },
  {
    question: 'Is it available to download?',
    answer:
      'Not yet. thereabouts is in private development for iOS and Android. The first release decision depends on a real test: whether it helps create conversations on an actual trip that would not otherwise have happened.',
  },
];

export default function ThereaboutsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.identity} aria-labelledby="thereabouts-title">
        <Image
          src="/img/thereabouts/icon.png"
          width={76}
          height={76}
          alt="thereabouts app icon"
          className={styles.icon}
          priority
        />
        <div className={styles.identityCopy}>
          <Image
            src="/img/thereabouts/wordmark.svg"
            width={320}
            height={80}
            alt="thereabouts"
            className={styles.wordmark}
            priority
          />
          <h1 id="thereabouts-title" className="sr-only">thereabouts</h1>
          <p>Be ready for the conversations you are actually going to have.</p>
        </div>
        <span className={styles.status}>Private preview · v0.1</span>
      </section>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Atessa · Abruzzo · October 2026</p>
          <h2>Language readiness for a real place.</h2>
          <p className={styles.lede}>
            thereabouts prepares the language you are likely to say and hear on a trip you
            actually take—built from your destination, people, routines, and the moments
            that caught you out last time. The first real-world trip happens to be in Italy.
          </p>
          <div className={styles.tripTest}>
            <span>THE TEST</span>
            <p>
              On the next trip, does it help you understand or say something you genuinely
              could not have handled otherwise?
            </p>
          </div>
        </div>

        <div className={styles.demoFrame}>
          <div className={styles.demoLabel}>
            <span>BUILD 0.0.1</span>
            <span>55 SEC</span>
          </div>
          <video
            className={styles.demoVideo}
            src="/vid/thereabouts-app-demo-web.mp4"
            poster="/img/thereabouts/feature-graphic.png"
            muted
            loop
            playsInline
            controls
            preload="metadata"
          >
            Your browser does not support embedded video.
          </video>
          <p className={styles.caption}>A working iOS simulator build from the current trip loop.</p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="current-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Current build · v0.1</p>
            <h2 id="current-heading">What works now</h2>
          </div>
          <p>Built and exercised on iOS and Android. Still a private experiment, not a release candidate.</p>
        </div>
        <div className={styles.featureGrid}>
          {currentFeatures.map((feature) => (
            <article className={styles.feature} key={feature.index}>
              <span>{feature.index}</span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.planned}`} aria-labelledby="planned-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Accepted direction · v0.2</p>
            <h2 id="planned-heading">What comes next if the trip loop earns it</h2>
          </div>
          <p>These are planned product decisions, not claims about the current build.</p>
        </div>
        <div className={styles.plannedGrid}>
          {plannedFeatures.map((feature, index) => (
            <article key={feature.title}>
              <span>0{index + 1}</span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="faq-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Field notes</p>
            <h2 id="faq-heading">Frequently asked questions</h2>
          </div>
        </div>
        <div className={styles.faqs}>
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.policies} aria-labelledby="policies-heading">
        <div>
          <p className={styles.kicker}>Plain-English records</p>
          <h2 id="policies-heading">Policies</h2>
        </div>
        <nav aria-label="thereabouts policies">
          <Link href="/apps/thereabouts/privacy-policy">Privacy policy</Link>
          <Link href="/apps/thereabouts/terms-of-use">Terms of use</Link>
          <Link href="/apps/thereabouts/delete-account">Delete account or data</Link>
        </nav>
      </section>
    </main>
  );
}
