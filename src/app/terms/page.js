export default function Page() {
  return (
    <main className="py-10">
      <h2 className="text-2xl font-extrabold">Terms of Use</h2>
      <p className="text-muted mt-2">
        Effective date: <strong>1st September 2025</strong>
      </p>

      <p className="mt-6 text-muted">
        Welcome to the Arcturus Digital Consultancy website (the “Site”). By accessing or using the
        Site, you agree to these Terms of Use. If you do not agree, please do not use the Site.
      </p>

      <h3 className="mt-8 font-bold text-lg">Use of site</h3>
      <ul className="list-disc ml-6 mt-2 text-muted space-y-1">
        <li>The Site and its content are provided for general information purposes only.</li>
        <li>
          You agree not to misuse the Site, including attempting to gain unauthorised access,
          interfering with its operation, or distributing harmful material.
        </li>
      </ul>

      <h3 className="mt-8 font-bold text-lg">Intellectual property</h3>
      <ul className="list-disc ml-6 mt-2 text-muted space-y-1">
        <li>
          All content, trademarks, and logos on this Site are owned by or licensed to Arcturus
          Digital Consultancy.
        </li>
        <li>You may view, download, and print content for personal or internal business use only.</li>
        <li>
          You may not reproduce, distribute, or exploit the content without our prior written
          permission.
        </li>
      </ul>

      <h3 className="mt-8 font-bold text-lg">Links to third-party sites</h3>
      <p className="text-muted mt-2">
        Our Site may include links to third-party websites. We are not responsible for the content,
        accuracy, or practices of those sites.
      </p>

      <h3 className="mt-8 font-bold text-lg">Disclaimers</h3>
      <ul className="list-disc ml-6 mt-2 text-muted space-y-1">
        <li>The Site is provided on an “as is” basis without warranties of any kind.</li>
        <li>
          We do not guarantee uninterrupted access, error-free operation, or that the Site is free
          from harmful components.
        </li>
      </ul>

      <h3 className="mt-8 font-bold text-lg">Limitation of liability</h3>
      <p className="text-muted mt-2">
        To the fullest extent permitted by law, Arcturus Digital Consultancy will not be liable for
        any damages arising from the use of this Site.
      </p>

      <h3 className="mt-8 font-bold text-lg">Governing law</h3>
      <p className="text-muted mt-2">
        These Terms are governed by and construed under the laws of England and Wales. Any disputes
        shall be subject to the exclusive jurisdiction of the courts of England and Wales.
      </p>

      <h3 className="mt-8 font-bold text-lg">Contact us</h3>
      <p className="text-muted mt-2">
        If you have questions about these Terms, please contact us at{" "}
        <a href="mailto:info@arcturusdc.com" className="text-red-700 hover:underline">
          info@arcturusdc.com
        </a>
        .
      </p>
    </main>
  );
}
