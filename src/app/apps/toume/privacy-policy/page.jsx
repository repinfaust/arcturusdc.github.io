import Link from 'next/link';

export const metadata = {
  title: 'Tou.me Privacy Policy | Arcturus Digital Consulting',
  description:
    'Privacy Policy for Tou.me – how we collect, use, and protect your data, and your rights under UK/EU GDPR.',
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
          Last Updated: <time dateTime="2025-10-16">16th October 2025</time>
        </p>
        <p className="mt-4 text-neutral-800">
          Tou.me (“we,” “our,” or “us”) is committed to protecting your privacy. This Privacy Policy
          explains how we collect, use, disclose, and safeguard your information when you use our
          mobile application and services (collectively, the “Service”).
        </p>
      </section>

      {/* Content */}
      <article className="prose prose-neutral max-w-none mt-6">
        <h2 id="information-we-collect">1. Introduction</h2>
        <p>
          Tou.me (“we,” “our,” or “us”) is committed to protecting your privacy. This Privacy Policy
          explains how we collect, use, disclose, and safeguard your information when you use our
          mobile application and services (collectively, the “Service”).
        </p>

        <h2>2. Information We Collect</h2>

        <h3>2.1 Personal Information You Provide</h3>
        <ul>
          <li>Account information (email address, display name)</li>
          <li>Profile information (name, preferences)</li>
          <li>Circle information (family group names, member details)</li>
          <li>Child profiles (names, ages, preferences)</li>
          <li>Event information (calendar events, handovers, activities)</li>
          <li>Communication data (invitations, messages within the app)</li>
        </ul>

        <h3>2.2 Automatically Collected Information</h3>
        <ul>
          <li>Device information (device type, operating system, app version)</li>
          <li>Usage analytics (features used, session duration, crash reports)</li>
          <li>Location data (only when explicitly granted for location-based features)</li>
        </ul>

        <h3>2.3 Third-Party Integrations</h3>
        <ul>
          <li>Google Calendar data (when you connect your calendar)</li>
          <li>Firebase Authentication data</li>
          <li>Analytics data through Google Analytics</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>Provide and maintain the Service</li>
          <li>Create and manage your circles (family groups)</li>
          <li>Synchronize calendar events and schedules</li>
          <li>Send notifications about events and activities</li>
          <li>Improve app functionality and user experience</li>
          <li>Provide customer support</li>
          <li>Ensure security and prevent fraud</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>4. Information Sharing and Disclosure</h2>

        <h3>4.1 Within Your Circles</h3>
        <p>Information you add to circles is shared with other circle members, including:</p>
        <ul>
          <li>Events and calendar information</li>
          <li>Child profiles and schedules</li>
          <li>Handover details and inventory</li>
          <li>Messages and notifications</li>
        </ul>

        <h3>4.2 Third-Party Service Providers</h3>
        <p>We may share information with:</p>
        <ul>
          <li>Firebase (Google) for authentication and data storage</li>
          <li>Google Analytics for usage analytics</li>
          <li>Sentry for crash reporting and error monitoring</li>
          <li>Apple/Google for app store services and in-app purchases</li>
        </ul>

        <h3>4.3 Legal Requirements</h3>
        <p>We may disclose information if required by law or to:</p>
        <ul>
          <li>Comply with legal processes</li>
          <li>Protect our rights and safety</li>
          <li>Investigate potential violations</li>
          <li>Protect users’ safety and rights</li>
        </ul>

        <h2>5. Data Security</h2>
        <p>We implement appropriate security measures including:</p>
        <ul>
          <li>Encryption of data in transit and at rest</li>
          <li>Secure authentication systems</li>
          <li>Regular security assessments</li>
          <li>Access controls and monitoring</li>
        </ul>

        <h2>6. Your Rights and Choices</h2>

        <h3>6.1 Account Management</h3>
        <ul>
          <li>Access and update your personal information</li>
          <li>Manage circle memberships and permissions</li>
          <li>Control notification preferences</li>
          <li>Delete your data or account (see Section 7)</li>
        </ul>

        <h3>6.2 Data Portability</h3>
        <p>
          You can export your data by contacting us at{' '}
          <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a>.
        </p>

        <h3>6.3 Marketing Communications</h3>
        <p>You can opt out of promotional communications at any time.</p>

        <h2>7. Data Deletion</h2>

        <h3>7.1 Delete Data Only</h3>
        <p>
          You can delete all your personal data while keeping your account active. This removes all
          circles you’ve created or joined, events and calendar data, child profiles, and personal
          information. Your account remains active for future use.
        </p>

        <h3>7.2 Delete Account and Data</h3>
        <p>
          You can permanently delete your account and all associated data. This action cannot be
          undone. To request data deletion, use the “Data Management” option in Settings or contact
          us at <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a>.
        </p>

        <h2>8. Children’s Privacy</h2>
        <p>
          While our app helps manage children’s schedules, we do not knowingly collect personal
          information directly from children under 13. Parents and guardians are responsible for the
          information they add about their children.
        </p>

        <h2>9. International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries other than your own. We
          ensure appropriate safeguards are in place for such transfers.
        </p>

        <h2>10. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy periodically. We will notify you of significant changes
          through the app or by email. Continued use of the Service after changes constitutes
          acceptance of the updated policy.
        </p>

        <h2>11. Contact Information</h2>
        <p>
          For questions about this Privacy Policy or our privacy practices, contact us at:{' '}
          <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a> —{' '}
          <a href="https://www.arcturusdc.com" target="_blank" rel="noopener noreferrer">
            www.arcturusdc.com
          </a>
          .
        </p>

        <h2>12. Jurisdiction</h2>
        <p>
          This Privacy Policy is governed by the laws of the United Kingdom and any disputes will be
          resolved in the courts of the United Kingdom.
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
