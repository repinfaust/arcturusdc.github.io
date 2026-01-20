// app/apps/syncfit/delete-account/page.js
// or: pages/apps/syncfit/delete-account.js

import Link from "next/link";

export const metadata = {
  title: "SyncFit — Delete Account & Data",
  description:
    "How to delete your SyncFit account and associated data. In-app deletion steps, email alternative, what is deleted, and timelines.",
  alternates: { canonical: "/apps/syncfit/delete-account" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "SyncFit — Delete Account & Data",
    description:
      "In-app deletion steps, email alternative, what gets deleted, and timelines.",
    url: "https://www.arcturusdc.com/apps/syncfit/delete-account",
    siteName: "Arcturus Digital Consulting",
    type: "article",
  },
};

export default function DeleteAccount() {
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <main className="pb-10 px-4 max-w-3xl mx-auto">
      <header className="mt-6 mb-4">
        <h1 className="text-2xl font-extrabold">
          SyncFit — Delete Account &amp; Data
        </h1>
        <p className="text-muted text-sm mt-2">
          Official instructions for deleting your SyncFit account and associated
          data. Developer: Arcturus Digital Consulting.
        </p>
      </header>

      {/* Primary Method */}
      <section className="card p-4 space-y-3">
        <h2 className="font-bold text-lg">
          Primary Deletion Method (In-App — Recommended)
        </h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Open the <strong>SyncFit</strong> app.</li>
          <li>Go to <strong>Profile → Settings → Account</strong>.</li>
          <li>Tap <strong>“Delete Account”</strong>.</li>
          <li>Confirm deletion when prompted.</li>
          <li>Your account is deleted immediately.</li>
        </ol>
        <p className="text-sm text-muted">
          If you signed in with Google, revoking access in your Google settings
          is optional but recommended.
        </p>
      </section>

      {/* Alternative Method */}
      <section className="card p-4 mt-4 space-y-3">
        <h2 className="font-bold text-lg">Alternative Method (Email Request)</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Email:{" "}
            <a className="underline hover:text-brand" href="mailto:help@arcturusdc.com">
              help@arcturusdc.com
            </a>
          </li>
          <li>
            Subject: <code>Data Deletion Request — SyncFit</code>
          </li>
          <li>
            Include: the Google account email you used with SyncFit (for verification).
          </li>
          <li>Response time: within <strong>5 business days</strong>.</li>
        </ul>
      </section>

      {/* Data Deletion Details */}
      <section className="card p-4 mt-4 space-y-3">
        <h2 className="font-bold text-lg">Data Deletion Details</h2>

        <h3 className="font-semibold">What gets deleted</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Personal information (name, email).</li>
          <li>Google Calendar access permissions granted to SyncFit.</li>
          <li>App preferences and workout history.</li>
          <li>Authentication credentials.</li>
          <li>All SyncFit-created calendar events.</li>
        </ul>

        <h3 className="font-semibold mt-3">Timeline</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Immediate:</strong> account disabled.</li>
          <li><strong>Within 24 hours:</strong> personal data removed from active systems.</li>
          <li><strong>Within 30 days:</strong> backups cleared in routine cycles.</li>
        </ul>

        <p className="text-sm text-muted">
          Some minimal records (e.g., fraud-prevention or legal-compliance logs)
          may be retained where required by law; these are not used for any other
          purpose and are automatically purged on schedule.
        </p>
      </section>

      {/* Contact */}
      <section className="card p-4 mt-4 space-y-2">
        <h2 className="font-bold text-lg">Contact</h2>
        <p>
          Support email:{" "}
          <a className="underline hover:text-brand" href="mailto:help@arcturusdc.com">
            help@arcturusdc.com
          </a>
        </p>
        <p className="text-sm text-muted">Typical response time: within 5 business days.</p>
      </section>

      {/* Legal */}
      <section className="card p-4 mt-4 space-y-2">
        <h2 className="font-bold text-lg">Legal &amp; Policies</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <Link className="underline hover:text-brand" href="/assets/policies/SyncFit_PrivacyPolicy.pdf">
              SyncFit Privacy Policy (PDF)
            </Link>
          </li>
          <li>
            <Link className="underline hover:text-brand" href="/assets/policies/SyncFit_TermsOfService.pdf">
              SyncFit Terms of Service (PDF)
            </Link>
          </li>
          <li>
            <Link className="underline hover:text-brand" href="/assets/policies/SyncFit_PricingPolicy.pdf">
              SyncFit Pricing Policy (PDF)
            </Link>
          </li>
        </ul>
        <p className="text-xs text-muted mt-2">Last updated: {lastUpdated}</p>
      </section>

      <p className="text-xs text-muted mt-6">
        This page is the official account deletion instruction page for{" "}
        <strong>SyncFit</strong> by Arcturus Digital Consulting and may be
        referenced on the Google Play Store listing as the “Delete account URL.”
      </p>
    </main>
  );
}
