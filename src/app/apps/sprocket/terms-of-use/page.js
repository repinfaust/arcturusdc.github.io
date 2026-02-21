export const metadata = {
  title: 'Sprocket - Terms of Use',
  description: 'Read the Sprocket Terms of Use in HTML. Arcturus Digital Consulting Ltd.',
};

export default function TermsOfUsePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-12 text-neutral-800 leading-relaxed space-y-6">
      <h1 className="text-2xl font-semibold mb-6">Sprocket - Terms of Use</h1>
      <p><strong>Effective date:</strong> 21 February 2026</p>

      <p>
        These Terms govern your use of <strong>Sprocket</strong>, provided by{' '}
        <strong>Arcturus Digital Consulting Ltd</strong>. By using the app, you agree to these Terms.
      </p>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Licence</h2>
        <p>
          We grant you a limited, non-exclusive, non-transferable licence to use Sprocket for
          personal, non-commercial use.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Acceptable Use</h2>
        <p>
          You agree not to misuse the app, reverse engineer protected components, or use the app
          for unlawful activity.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Important Notice</h2>
        <p>
          Sprocket provides practical guidance and drafting support. It does not provide legal,
          financial, medical, or emergency advice.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Intellectual Property</h2>
        <p>
          All intellectual property rights in Sprocket belong to Arcturus Digital Consulting Ltd.
          You may not copy, modify, or distribute the app without permission.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Disclaimer and Liability</h2>
        <p>
          The app is provided "as is" without warranties to the fullest extent permitted by law.
          We are not liable for indirect or consequential damages arising from app use.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Termination</h2>
        <p>
          We may suspend or terminate access where these Terms are breached.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
        <p>
          Email: <a href="mailto:info@arcturusdc.com" className="text-blue-600 underline hover:text-blue-800">info@arcturusdc.com</a>
        </p>
      </section>
    </main>
  );
}
