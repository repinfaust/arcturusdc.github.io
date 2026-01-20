// app/assets/policies/ADHD_Acclaim_TermsOfUse/page.js

export const metadata = {
  title: "ADHD Acclaim – Terms of Use",
  description:
    "Read the ADHD Acclaim Terms of Use in HTML. Arcturus Digital Consulting Ltd.",
};

export default function TermsOfUsePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-12 text-neutral-800 leading-relaxed space-y-6">
      <h1 className="text-2xl font-semibold mb-6">ADHD Acclaim — Terms of Use</h1>

      <p>
        These Terms govern your use of <strong>ADHD Acclaim</strong>, provided by{" "}
        <strong>Arcturus Digital Consulting Limited</strong>, a UK-registered company.
      </p>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Licence</h2>
        <p>
          We grant you a limited, non-exclusive, non-transferable licence to use ADHD
          Acclaim for personal, non-commercial purposes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Acceptable Use</h2>
        <p>
          You agree not to misuse the app, attempt to access unauthorised areas, or use
          it for unlawful purposes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Subscriptions and Billing</h2>
        <p>
          ADHD Acclaim offers a <strong>14-day free trial</strong>, then auto-renews at{" "}
          <strong>£6.99/month</strong>. Subscriptions are managed through your{" "}
          <strong>Apple App Store</strong> or <strong>Google Play</strong> account. You
          may cancel at any time before renewal through your platform account settings.
          ADHD Acclaim Premium unlocks unlimited rewards, advanced planning tools, and
          additional customisations for the duration of your subscription.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Refunds</h2>
        <p>
          Refunds are handled directly by Apple or Google according to their policies.
          We cannot issue refunds directly.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Intellectual Property</h2>
        <p>
          All intellectual property in ADHD Acclaim belongs to Arcturus Digital
          Consulting Limited. You may not copy, modify, or distribute the app without
          permission.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Disclaimer and Liability</h2>
        <p>
          The app is provided ‘as is’ without warranties of any kind. We are not liable
          for any damages arising from use of the app, except as required by law.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Termination</h2>
        <p>We may suspend or terminate your access if you breach these Terms.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
        <p>
          For support, contact{" "}
          <a
            href="mailto:help@arcturusdc.com"
            className="text-blue-600 underline hover:text-blue-800"
          >
            help@arcturusdc.com
          </a>
          .
        </p>
        <p>
          You can also{" "}
          <a
            href="/assets/policies/ADHD_Acclaim_TermsOfUse.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            download the PDF version
          </a>
          .
        </p>
      </section>
    </main>
  );
}
