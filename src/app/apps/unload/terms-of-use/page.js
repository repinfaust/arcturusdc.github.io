export const metadata = {
  title: 'Unload – Terms of Use',
  description: 'Read the Unload Terms of Use in HTML. Arcturus Digital Consulting Ltd.',
};

export default function TermsOfUsePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-12 text-neutral-800 leading-relaxed space-y-6">
      <h1 className="text-2xl font-semibold mb-6">Unload — Terms of Use</h1>
      <p><strong>Effective date:</strong> 11 February 2026</p>

      <p>
        These Terms govern your use of <strong>Unload</strong>, provided by{' '}
        <strong>Arcturus Digital Consulting Ltd</strong>, a UK-registered company.
        By using the app, you agree to these Terms.
      </p>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Licence</h2>
        <p>
          We grant you a limited, non-exclusive, non-transferable licence to use
          Unload for personal, non-commercial purposes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Acceptable Use</h2>
        <p>
          You agree not to misuse the app, attempt to access unauthorised areas, or
          use it for unlawful purposes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Intellectual Property</h2>
        <p>
          All intellectual property in Unload belongs to Arcturus Digital Consulting Ltd.
          You may not copy, modify, or distribute the app without permission.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Disclaimer and Liability</h2>
        <p>
          The app is provided “as is” without warranties of any kind. We are not liable
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
          For support, contact{' '}
          <a
            href="mailto:info@arcturusdc.com"
            className="text-blue-600 underline hover:text-blue-800"
          >
            info@arcturusdc.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}
