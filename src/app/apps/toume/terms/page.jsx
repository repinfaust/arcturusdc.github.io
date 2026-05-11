import Link from 'next/link';

export const metadata = {
  title: 'Tou.me Terms & Conditions | Arcturus Digital Consulting',
  description:
    'Terms and Conditions for Tou.me – outlining user responsibilities and Smart Suggestions powered by OpenAI.',
};

export default function ToumeTerms() {
  return (
    <main className="pb-16">
      {/* Breadcrumb */}
      <nav className="mt-4 mb-2 text-sm text-neutral-600">
        <Link href="/apps/toume" className="hover:underline">Tou.me</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-900 font-medium">Terms & Conditions</span>
      </nav>

      {/* Header */}
      <section className="card p-6 border border-black/10 rounded-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight">Terms & Conditions</h1>
        <p className="mt-2 text-neutral-700">
          Last Updated: <time dateTime="2026-05-11">11 May 2026</time>
        </p>
        <p className="mt-4 text-neutral-800">
          These Terms &amp; Conditions govern the use of Tou.me. By using Tou.me, you agree to these
          terms.
        </p>
      </section>

      {/* Body */}
      <article className="prose prose-neutral max-w-none mt-6">
        <h2>1. Overview</h2>
        <p>
          Tou.me is a logistics-focused shared-family organiser designed to help separated, blended,
          and shared-care families coordinate practical arrangements.
        </p>
        <p>Tou.me is not:</p>
        <ul>
          <li>legal advice</li>
          <li>legal evidence management</li>
          <li>medical advice</li>
          <li>therapy or safeguarding support</li>
          <li>emergency support infrastructure</li>
        </ul>

        <h2>2. User Responsibilities</h2>
        <p>Users are responsible for:</p>
        <ul>
          <li>ensuring information entered is accurate</li>
          <li>maintaining appropriate permissions when sharing family information</li>
          <li>using Tou.me lawfully and respectfully</li>
          <li>reviewing suggestions before acting on them</li>
        </ul>
        <p>
          Users remain fully responsible for decisions made using information provided within Tou.me.
        </p>

        <h2>3. Smart Suggestions</h2>
        <p>Tou.me may optionally provide Smart Suggestions powered by OpenAI APIs.</p>
        <p>These suggestions may include:</p>
        <ul>
          <li>handover suggestions</li>
          <li>reminder suggestions</li>
          <li>wellbeing follow-up suggestions</li>
          <li>operational coordination prompts</li>
        </ul>
        <p>Smart Suggestions:</p>
        <ul>
          <li>are automated suggestions only</li>
          <li>may be incomplete or incorrect</li>
          <li>should always be reviewed by users</li>
        </ul>
        <p>Tou.me does not guarantee the accuracy of Smart Suggestions.</p>

        <h2>4. Consent for Smart Suggestions</h2>
        <p>
          Smart Suggestions are optional and may be enabled or disabled within the app. By enabling
          Smart Suggestions, users consent to limited operational event information being processed
          through OpenAI APIs for the purpose of generating suggestions.
        </p>

        <h2>5. Data Minimisation</h2>
        <p>
          Tou.me is designed to minimise information shared with OpenAI. Tou.me aims to send only
          limited contextual information necessary to generate relevant suggestions.
        </p>

        <h2>6. Feedback</h2>
        <p>Tou.me may allow users to provide feedback on Smart Suggestions.</p>
        <p>This feedback may be used:</p>
        <ul>
          <li>to improve future product behaviour</li>
          <li>for analytics</li>
          <li>for service tuning and quality assurance</li>
        </ul>
        <p>
          Users should avoid submitting unnecessary sensitive personal information in optional
          feedback notes.
        </p>

        <h2>7. Availability</h2>
        <p>Tou.me is provided on an &quot;as available&quot; basis.</p>
        <p>We do not guarantee:</p>
        <ul>
          <li>uninterrupted service</li>
          <li>error-free operation</li>
          <li>permanent feature availability</li>
        </ul>
        <p>Features may change, evolve, or be removed over time.</p>

        <h2>8. Acceptable Use</h2>
        <p>Users must not use Tou.me:</p>
        <ul>
          <li>unlawfully</li>
          <li>abusively</li>
          <li>to harass others</li>
          <li>to upload malicious content</li>
          <li>to attempt unauthorised access</li>
          <li>to misuse shared family data</li>
        </ul>
        <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>

        <h2>9. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, ARCTURUS DIGITAL CONSULTING LIMITED shall not be
          liable for:
        </p>
        <ul>
          <li>indirect losses</li>
          <li>family disputes</li>
          <li>missed appointments</li>
          <li>scheduling issues</li>
          <li>incorrect Smart Suggestions</li>
          <li>reliance on wellbeing entries</li>
          <li>data loss beyond reasonable operational safeguards</li>
        </ul>
        <p>Tou.me is an organisational tool only.</p>

        <h2>10. Intellectual Property</h2>
        <p>
          Tou.me branding, software, and associated materials remain the property of ARCTURUS DIGITAL
          CONSULTING LIMITED unless otherwise stated.
        </p>

        <h2>11. Privacy</h2>
        <p>
          Use of Tou.me is also governed by the Tou.me{' '}
          <Link href="/apps/toume/privacy-policy" className="text-red-600 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <h2>12. Changes to Terms</h2>
        <p>
          These Terms &amp; Conditions may be updated periodically. Continued use of Tou.me after
          updates constitutes acceptance of the revised terms.
        </p>

        <h2>13. Governing Law</h2>
        <p>These terms are governed by the laws of England and Wales.</p>

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

        <p className="mt-10">
          <Link href="/apps/toume" className="text-red-600 hover:underline">
            ← Back to Tou.me
          </Link>
        </p>
      </article>
    </main>
  );
}
