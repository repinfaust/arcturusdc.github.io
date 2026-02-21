export const metadata = {
  title: 'Sprocket - Privacy Policy',
  description: 'Read the Sprocket privacy policy in HTML. Arcturus Digital Consulting Ltd.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="prose prose-neutral mx-auto px-4 md:px-6 lg:px-8 py-8">
      <h1>Sprocket - Privacy Policy</h1>
      <p><strong>Effective date:</strong> 21 February 2026</p>

      <p>
        This Privacy Policy explains how <strong>Arcturus Digital Consulting Ltd</strong>
        ("Arcturus Digital Consulting", "we", "our", or "us") collects, uses, and
        protects information when you use the <strong>Sprocket</strong> mobile app (the "App").
      </p>

      <h2>1) Information we collect</h2>
      <ul>
        <li>
          <strong>On-device app data:</strong> reminders, notes, untangle session outputs,
          and app settings are stored locally on your device by default.
        </li>
        <li>
          <strong>Optional text input data:</strong> if you enter message text for "Untangle",
          we process it to generate plain-language guidance. Raw text is not auto-saved by default flows.
        </li>
        <li>
          <strong>Diagnostics:</strong> your OS or app store may provide anonymised crash/performance reports.
        </li>
        <li>
          <strong>Support communications:</strong> if you contact us, we process what you provide to help you.
        </li>
      </ul>

      <h2>2) How we use information</h2>
      <ul>
        <li>To provide core app features (voice support, reminders, notes, untangle guidance).</li>
        <li>To improve reliability, security, and product quality.</li>
        <li>To respond to support requests.</li>
      </ul>

      <h2>3) Sensitive information handling</h2>
      <ul>
        <li>Sprocket is designed to detect likely sensitive details and offer redaction before save/share.</li>
        <li>Do not enter passwords, one-time codes, or payment card details into the app.</li>
      </ul>

      <h2>4) Legal bases (UK/EU)</h2>
      <ul>
        <li><strong>Legitimate interests:</strong> running and improving the app.</li>
        <li><strong>Consent:</strong> where required, including device permissions you choose to enable.</li>
      </ul>

      <h2>5) Data retention</h2>
      <p>
        Data stored on your device remains until you delete it or uninstall the app.
        Support emails are retained only as long as needed for support and legal obligations.
      </p>

      <h2>6) Sharing</h2>
      <ul>
        <li>We do <strong>not</strong> sell personal data.</li>
        <li>We may use processors for infrastructure and diagnostics under contractual safeguards.</li>
        <li>We may disclose information if required by law or to protect rights and safety.</li>
      </ul>

      <h2>7) Children</h2>
      <p>
        The app is not intended for children under 13. Contact us if you believe a child has submitted information.
      </p>

      <h2>8) Your rights and choices</h2>
      <ul>
        <li>Delete local data via app/device settings or uninstall the app.</li>
        <li>Change permissions at any time in system settings.</li>
        <li>Contact us to exercise applicable data rights.</li>
      </ul>

      <h2>9) Security</h2>
      <p>
        We use reasonable technical and organisational safeguards. No system is 100% secure,
        so keep your device updated and protected.
      </p>

      <h2>10) Policy updates</h2>
      <p>
        We may update this policy from time to time. The latest version will be posted on this page.
      </p>

      <h2>11) Contact</h2>
      <p>
        <strong>Arcturus Digital Consulting Ltd</strong><br />
        82 Victoria Street, Nottingham, NG15 7EA, United Kingdom<br />
        Email: <a href="mailto:info@arcturusdc.com">info@arcturusdc.com</a>
      </p>
    </main>
  );
}
