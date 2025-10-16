// app/apps/toume/delete-account/page.jsx
import Link from "next/link";

export const metadata = {
  title: "Tou.me — Delete Account & Data",
  description:
    "How to delete your Tou.me account and associated data. In-app deletion steps, email alternative, what is deleted, and timelines.",
  alternates: { canonical: "/apps/toume/delete-account" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Tou.me — Delete Account & Data",
    description:
      "In-app deletion steps, email alternative, what gets deleted, and timelines.",
    url: "https://www.arcturusdc.com/apps/toume/delete-account",
    siteName: "Arcturus Digital Consulting",
    type: "article",
  },
};

const LAST_UPDATED = "16 October 2025";

export default function DeleteAccount() {
  return (
    <main className="pb-10 px-4 max-w-3xl mx-auto">
      <header className="mt-6 mb-4">
        <h1 className="text-2xl font-extrabold">Tou.me — Delete Account &amp; Data</h1>
        <p className="text-muted text-sm mt-2">
          Official instructions for deleting your Tou.me account and associated data.
          Developer: Arcturus Digital Consulting.
        </p>
      </header>

      {/* Primary Method */}
      <section className="card p-4 space-y-3">
        <h2 className="font-bold text-lg">Primary Deletion Method (In-App — Recommended)</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Open the <strong>Tou.me</strong> app.</li>
          <li>Go to <strong>Settings → Account → Data Management</strong>.</li>
          <li>
            Choose your deletion option:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>"Delete My Data Only"</strong> — Removes all your data but keeps your
                account active for future use.
              </li>
              <li>
                <strong>"Delete Account &amp; Data"</strong> — Permanently deletes your account and
                all data (cannot be undone).
              </li>
            </ul>
          </li>
          <li>Review what will be deleted and confirm your choice.</li>
          <li>Deletion is processed immediately.</li>
        </ol>
        <p className="text-sm text-muted">
          If you signed in with Google, revoking access in your Google settings is optional but
          recommended.
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
            Subject: <code>Data Deletion Request — Tou.me</code>
          </li>
          <li>Include: the Google account email you used with Tou.me (for verification).</li>
          <li>Specify: whether you want "data only" or "account and data" deletion.</li>
          <li>Response time: within <strong>5 business days</strong>.</li>
        </ul>
      </section>

      {/* Data Deletion Details */}
      <section className="card p-4 mt-4 space-y-3">
        <h2 className="font-bold text-lg">Data Deletion Details</h2>

        <h3 className="font-semibold">What gets deleted (both options)</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>All circles (family groups) you created or joined.</li>
          <li>Events, handovers, and calendar data.</li>
          <li>Child profiles and personal information.</li>
          <li>Gift wishlists and inventory items.</li>
          <li>Notification preferences and app settings.</li>
          <li>Google Calendar sync permissions.</li>
        </ul>

        <h3 className="font-semibold mt-3">Delete Data Only</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your Firebase account remains active.</li>
          <li>You can sign back in and use the app with fresh data.</li>
          <li>Your subscription status is preserved.</li>
        </ul>

        <h3 className="font-semibold mt-3">Delete Account &amp; Data</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your Firebase account is permanently deleted.</li>
          <li>You cannot sign in again with the same account.</li>
          <li>Subscription is cancelled automatically.</li>
          <li><strong>This action cannot be undone.</strong></li>
        </ul>

        <h3 className="font-semibold mt-3">Timeline</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Immediate:</strong> account disabled and data marked for deletion.</li>
          <li><strong>Within 24 hours:</strong> personal data removed from active systems.</li>
          <li><strong>Within 30 days:</strong> backups cleared in routine cycles.</li>
        </ul>

        <p className="text-sm text-muted">
          Some minimal records (e.g., fraud-prevention or legal-compliance logs) may be retained
          where required by law; these are not used for any other purpose and are automatically
          purged on schedule.
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
            <Link className="underline hover:text-brand" href="/apps/toume/privacy-policy">
              Tou.me Privacy Policy
            </Link>
          </li>
          <li>
            <Link className="underline hover:text-brand" href="/apps/toume/terms">
              Tou.me Terms &amp; Conditions
            </Link>
          </li>
        </ul>
        <p className="text-xs text-muted mt-2">Last updated: {LAST_UPDATED}</p>
      </section>

      <p className="text-xs text-muted mt-6">
        This page is the official account deletion instruction page for{" "}
        <strong>Tou.me</strong> by Arcturus Digital Consulting and may be referenced
        on the Google Play Store listing as the "Delete account URL."
      </p>
    </main>
  );
}
