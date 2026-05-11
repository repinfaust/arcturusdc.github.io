import Link from 'next/link';

export const metadata = {
  title: 'Tou.me Privacy Policy | Arcturus Digital Consulting',
  description:
    'Privacy Policy for Tou.me – what we store, how data is used, and how Smart Suggestions powered by OpenAI work.',
};

export default function ToumePrivacyPolicy() {
  return (
    <main className="pb-16">
      {/* Header / breadcrumb */}
      <nav className="mt-4 mb-2 text-sm text-neutral-600">
        <Link href="/apps/toume" className="hover:underline">Tou.me</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-900 font-medium">Privacy Policy</span>
      </nav>

      {/* Title card */}
      <section className="card p-6 border border-black/10 rounded-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-neutral-700">
          Last Updated: <time dateTime="2026-05-11">11 May 2026</time>
        </p>
        <p className="mt-4 text-neutral-800">
          Tou.me is operated by ARCTURUS DIGITAL CONSULTING LIMITED. This Privacy Policy explains
          what information Tou.me stores, how it is used, and how Smart Suggestions powered by
          OpenAI work.
        </p>
      </section>

      {/* Content */}
      <article className="prose prose-neutral max-w-none mt-6">
        <h2>1. Overview</h2>
        <p>
          Tou.me is a calm, logistics-focused organiser for separated, blended, and shared-care
          families.
        </p>
        <p>Tou.me is designed to support practical coordination such as:</p>
        <ul>
          <li>calendars and schedules</li>
          <li>handovers</li>
          <li>wellbeing updates</li>
          <li>inventory tracking</li>
          <li>reminders and shared planning</li>
        </ul>
        <p>Tou.me is not:</p>
        <ul>
          <li>a legal evidence platform</li>
          <li>a healthcare platform</li>
          <li>a therapy service</li>
          <li>a medical advice service</li>
        </ul>

        <h2>2. Information We Store</h2>
        <p>Depending on which features you use, Tou.me may store:</p>
        <ul>
          <li>account information (email address, authentication ID)</li>
          <li>shared calendar events</li>
          <li>child names and profiles</li>
          <li>handover information</li>
          <li>inventory and shared item tracking</li>
          <li>wellbeing log entries</li>
          <li>reminder and checklist data</li>
          <li>Smart Suggestions feedback</li>
          <li>app configuration and preferences</li>
        </ul>

        <h2>3. Smart Suggestions and OpenAI</h2>
        <p>Tou.me optionally offers Smart Suggestions.</p>
        <p>
          When enabled for a circle, Tou.me may use OpenAI APIs to analyse near-term calendar events
          and suggest:
        </p>
        <ul>
          <li>handovers</li>
          <li>reminders</li>
          <li>wellbeing follow-ups</li>
          <li>logistics-related actions</li>
        </ul>
        <p>Examples:</p>
        <ul>
          <li>&quot;This looks like a handover&quot;</li>
          <li>&quot;This may overlap school hours&quot;</li>
          <li>&quot;You may want to add a wellbeing follow-up&quot;</li>
        </ul>
        <p>Smart Suggestions are suggestions only. Tou.me does not make decisions for users.</p>

        <h2>4. What Is Sent to OpenAI</h2>
        <p>Tou.me is designed to minimise data shared with OpenAI.</p>
        <p>
          Tou.me sends only small, relevant snippets needed to generate suggestions, such as:
        </p>
        <ul>
          <li>event title</li>
          <li>event timing</li>
          <li>limited child context</li>
          <li>limited operational metadata</li>
        </ul>
        <p>Tou.me does NOT intentionally send:</p>
        <ul>
          <li>full account history</li>
          <li>private messages</li>
          <li>attachments</li>
          <li>complete family timelines</li>
          <li>unnecessary personal information</li>
        </ul>

        <h2>5. Smart Suggestion Feedback</h2>
        <p>If enabled, Tou.me may occasionally ask why a suggestion was dismissed.</p>
        <p>Examples:</p>
        <ul>
          <li>&quot;Not a handover&quot;</li>
          <li>&quot;Wrong child&quot;</li>
          <li>&quot;Already handled&quot;</li>
        </ul>
        <p>This feedback:</p>
        <ul>
          <li>is stored within Tou.me systems</li>
          <li>is used for product analytics and future tuning</li>
          <li>is not currently sent to OpenAI</li>
        </ul>
        <p>
          Optional notes submitted by users should not contain unnecessary sensitive information.
        </p>

        <h2>6. OpenAI Data Handling</h2>
        <p>Tou.me uses OpenAI APIs to generate Smart Suggestions.</p>
        <p>As of this policy date:</p>
        <ul>
          <li>
            API data submitted by Tou.me is not used by OpenAI to train public models unless
            explicitly opted in
          </li>
          <li>OpenAI may temporarily retain API data for abuse monitoring and security purposes</li>
        </ul>
        <p>
          Tou.me does not control OpenAI’s infrastructure or retention policies. Users should review
          OpenAI policies directly for the latest information.
        </p>

        <h2>7. Wellbeing Information</h2>
        <p>Wellbeing logs are intended as lightweight coordination context only.</p>
        <p>Tou.me is not intended for:</p>
        <ul>
          <li>diagnosis</li>
          <li>treatment</li>
          <li>clinical records</li>
          <li>emergency situations</li>
        </ul>
        <p>Do not rely on Tou.me for medical advice or safeguarding decisions.</p>

        <h2>8. Sharing and Visibility</h2>
        <p>
          Information shared within a circle may be visible to other authorised members of that
          circle depending on permissions and feature usage.
        </p>
        <p>
          Users are responsible for ensuring they are comfortable sharing information entered into
          Tou.me.
        </p>

        <h2>9. Data Storage</h2>
        <p>Tou.me currently uses:</p>
        <ul>
          <li>Firebase Authentication</li>
          <li>Firestore database services</li>
          <li>related cloud infrastructure providers</li>
        </ul>
        <p>
          Data may be processed in regions required to operate these services securely and reliably.
        </p>

        <h2>10. Security</h2>
        <p>
          Tou.me takes reasonable technical and organisational steps to protect user data, including
          authenticated access controls and database security rules.
        </p>
        <p>However, no online service can guarantee absolute security.</p>

        <h2>11. User Controls</h2>
        <p>Users may:</p>
        <ul>
          <li>disable Smart Suggestions</li>
          <li>disable Smart Suggestion feedback prompts</li>
          <li>remove shared data</li>
          <li>delete their account subject to operational limitations</li>
        </ul>

        <h2>12. Children</h2>
        <p>Tou.me is intended for use by adults coordinating shared care. Tou.me is not directed at children.</p>

        <h2>13. Changes</h2>
        <p>
          This Privacy Policy may be updated periodically as Tou.me evolves. Continued use of Tou.me
          after updates constitutes acceptance of the revised policy.
        </p>

        <h2>14. Contact</h2>
        <p>
          ARCTURUS DIGITAL CONSULTING LIMITED
          <br />
          82 Victoria Street
          <br />
          Nottingham
          <br />
          NG15 7EA
          <br />
          United Kingdom
        </p>
        <p>
          Email:
          <br />
          <a href="mailto:info@arcturusdc.com">info@arcturusdc.com</a>
        </p>

        {/* Back link */}
        <p className="mt-10">
          <Link href="/apps/toume" className="text-red-600 hover:underline">
            ← Back to Tou.me
          </Link>
        </p>
      </article>
    </main>
  );
}
