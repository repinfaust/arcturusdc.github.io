import Link from 'next/link';

export const metadata = {
  title: 'Tou.me Terms & Conditions | Arcturus Digital Consulting',
  description:
    'Terms and Conditions for Tou.me – outlining user responsibilities, data usage, and subscription details.',
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
          Last Updated: <time dateTime="2025-10-16">16th October 2025</time>
        </p>
        <p className="mt-4 text-neutral-800">
          By downloading, installing, or using the Tou.me mobile application (“App”), you agree to
          be bound by these Terms and Conditions (“Terms”). If you do not agree, do not use the App.
        </p>
      </section>

      {/* Body */}
      <article className="prose prose-neutral max-w-none mt-6">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By downloading, installing, or using Tou.me, you agree to these Terms. If you do not agree
          to these Terms, please do not use the App.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          Tou.me is a family coordination application designed for separated/divorced parents and
          their trusted adults to manage shared responsibilities around children, including:
        </p>
        <ul>
          <li>Calendar coordination and event management</li>
          <li>Handover scheduling and tracking</li>
          <li>Inventory management across locations</li>
          <li>Gift planning and wishlists</li>
          <li>Communication within family circles</li>
        </ul>

        <h2>3. Eligibility</h2>
        <ul>
          <li>You must be at least 18 years old to use this App.</li>
          <li>You must provide accurate and complete information when creating an account.</li>
          <li>You are responsible for maintaining the confidentiality of your credentials.</li>
        </ul>

        <h2>4. User Accounts and Circles</h2>
        <h3>4.1 Account Creation</h3>
        <ul>
          <li>One account per email address.</li>
          <li>You are responsible for all activity under your account.</li>
          <li>Notify us immediately of any unauthorized access.</li>
        </ul>

        <h3>4.2 Circles (Family Groups)</h3>
        <ul>
          <li>You may create or join multiple circles.</li>
          <li>Circle creators manage member permissions.</li>
          <li>All members can view shared information within a circle.</li>
          <li>You are responsible for the accuracy of shared information.</li>
        </ul>

        <h2>5. Acceptable Use</h2>
        <p>You agree to use Tou.me only for lawful purposes and not to:</p>
        <ul>
          <li>Harass, abuse, or harm others</li>
          <li>Share offensive or harmful content</li>
          <li>Gain unauthorized access or disrupt the App</li>
          <li>Violate laws or regulations</li>
        </ul>

        <h2>6. Content and Intellectual Property</h2>
        <h3>6.1 Your Content</h3>
        <ul>
          <li>You retain ownership of content you create.</li>
          <li>You grant us a license to use content to provide the Service.</li>
          <li>You are responsible for accuracy and legality.</li>
        </ul>

        <h3>6.2 Our Intellectual Property</h3>
        <ul>
          <li>The App is owned by Arcturus Digital Consulting and protected by IP law.</li>
          <li>You may not copy, modify, or reverse-engineer it.</li>
          <li>Our trademarks may not be used without permission.</li>
        </ul>

        <h2>7. Subscription and Payments</h2>
        <h3>7.1 Free Trial</h3>
        <p>New users receive a 7-day free trial. Trials convert to paid unless cancelled.</p>
        <h3>7.2 Subscription Terms</h3>
        <ul>
          <li>£6.99/month, billed via App Store or Play Store.</li>
          <li>Auto-renews unless cancelled through your store settings.</li>
        </ul>
        <h3>7.3 Refunds</h3>
        <p>Refunds follow App Store or Play Store policies.</p>

        <h2>8. Privacy and Data Protection</h2>
        <p>
          Your privacy is important to us. Please review our{' '}
          <Link href="/apps/toume/privacy-policy" className="text-red-600 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <h2>9. Data Deletion</h2>
        <ul>
          <li>Delete data only (keeps account active)</li>
          <li>Delete account and all data (permanent)</li>
          <li>Deleted data cannot be recovered</li>
        </ul>

        <h2>10. Disclaimers and Limitations</h2>
        <ul>
          <li>We aim for 99.9% uptime but cannot guarantee uninterrupted service.</li>
          <li>We are not liable for third-party outages (e.g., Google Calendar).</li>
          <li>Use the App at your own risk.</li>
        </ul>

        <h2>11. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, our total liability shall not exceed the amount
          you paid for the Service. We disclaim all warranties and are not liable for indirect or
          consequential damages.
        </p>

        <h2>12. Indemnification</h2>
        <p>
          You agree to indemnify and hold us harmless from claims or damages arising from your use
          of the App, violations of these Terms, or content you share.
        </p>

        <h2>13. Termination</h2>
        <ul>
          <li>We may suspend or terminate accounts for violations or inactivity.</li>
          <li>You may terminate your account anytime via App settings.</li>
          <li>Data may be deleted as outlined in our Privacy Policy.</li>
        </ul>

        <h2>14. Changes to Terms</h2>
        <p>
          We may update these Terms periodically. Continued use of Tou.me after updates constitutes
          acceptance.
        </p>

        <h2>15. Governing Law and Disputes</h2>
        <p>
          These Terms are governed by UK law. Disputes will be resolved in UK courts or through
          arbitration where permitted.
        </p>

        <h2>16. Severability</h2>
        <p>If any clause is invalid, the remainder remains enforceable.</p>

        <h2>17. Entire Agreement</h2>
        <p>
          These Terms, together with our Privacy Policy, form the entire agreement between you and
          us.
        </p>

        <h2>18. Contact Information</h2>
        <p>
          For questions, contact:{' '}
          <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a> —{' '}
          <a href="https://www.arcturusdc.com" target="_blank" rel="noopener noreferrer">
            www.arcturusdc.com
          </a>
          .
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
