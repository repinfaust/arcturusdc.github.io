import MandrakeLegalPage, { LegalCallout } from '../_components/MandrakeLegalPage';

export const metadata = {
  title: 'Mandrake — Terms of Service',
  description: 'Terms governing use of the Mandrake Android app.',
};

export default function MandrakeTermsPage() {
  return (
    <MandrakeLegalPage title="Terms of Service" updated="28 August 2026">
      <p>
        Mandrake is published by <strong>Arcturus Digital Consulting Ltd</strong>. Contact:{' '}
        <a href="mailto:info@arcturusdc.com">info@arcturusdc.com</a>.
      </p>
      <p>By using Mandrake, you agree to these terms. If you do not agree, do not use the app.</p>

      <LegalCallout>
        <p className="font-bold text-neutral-950">Mandrake is not a medical device or treatment.</p>
        <p className="mt-1">
          It does not diagnose, treat, cure or prevent any condition and does not replace a
          doctor, therapist, keyworker, sponsor or crisis service. If life is at risk, call 999
          now. For urgent mental-health help in the UK, call NHS 111 and select the mental-health
          option.
        </p>
      </LegalCallout>

      <h2>1. What Mandrake is</h2>
      <p>
        Mandrake is an Android self-management tool for recording urge moments, trying practical
        tactics, completing optional short self-checks and reviewing personal patterns,
        milestones and rewards. Its information and prompts are general support, not medical
        advice or a clinical assessment.
      </p>

      <h2>2. Age</h2>
      <p>Mandrake is for people aged 16 and over. By using it, you confirm that you are at least 16.</p>

      <h2>3. Safety and support</h2>
      <p>
        Do not rely on Mandrake in an emergency or make it the only part of a safety plan. The
        app&apos;s Help area includes free support contacts, including Samaritans, Shout, FRANK,
        Narcotics Anonymous, Alcoholics Anonymous, GamCare, NHS 111 and emergency services.
        Availability and contact details can change, so check the relevant service directly.
      </p>
      <p>Safety information and support signposting are not placed behind the paid unlock.</p>

      <h2>4. Payment</h2>
      <p>
        Some tracking features require a one-time unlock after the app&apos;s free trial. This is a
        single Google Play purchase, not a recurring subscription. Google Play handles payment
        and its refund rules apply. Use Restore purchases in the app if you reinstall or change
        device.
      </p>

      <h2>5. Your data</h2>
      <p>
        Mandrake creates an anonymous Firebase identity and stores urge events in Firestore. Other
        records remain on your device. The <a href="/apps/mandrake/privacy-policy">Privacy Policy</a>{' '}
        explains the fields and providers, and the{' '}
        <a href="/apps/mandrake/data-deletion">Data Deletion page</a> explains the current
        deletion process and its limitations. Both form part of these terms.
      </p>

      <h2>6. Acceptable use</h2>
      <p>You must not:</p>
      <ul>
        <li>use Mandrake as a substitute for professional or emergency care;</li>
        <li>use the app or our systems unlawfully or to harm another person;</li>
        <li>interfere with the service, probe its security or attempt unauthorised access; or</li>
        <li>reverse-engineer the app except where applicable law expressly permits it.</li>
      </ul>

      <h2>7. Intellectual property</h2>
      <p>
        Mandrake, its design and its branding belong to Arcturus Digital Consulting Ltd or its
        licensors. These terms give you a personal, limited, non-exclusive and non-transferable
        right to use the app; they do not transfer ownership.
      </p>

      <h2>8. Availability and changes</h2>
      <p>
        We aim to keep Mandrake reliable but do not guarantee uninterrupted or error-free access.
        The app may be unavailable for maintenance, updates or circumstances beyond our control.
        Features may change, and we will communicate material changes to paid functionality where
        appropriate.
      </p>

      <h2>9. Liability</h2>
      <p>
        Nothing in these terms excludes or limits liability where doing so would be unlawful,
        including liability for death or personal injury caused by our negligence or for fraud.
        Subject to that, Mandrake is provided as is. To the fullest extent permitted by law, we
        are not liable for indirect or consequential loss, or for decisions made in reliance on
        the app. Where liability may lawfully be limited, it is limited to the amount you paid for
        Mandrake in the 12 months before the claim.
      </p>

      <h2>10. Changes to these terms</h2>
      <p>
        We may update these terms. We will publish the new effective date here and flag material
        changes where appropriate. Continued use after an update means you accept the revised
        terms.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These terms are governed by the law of England and Wales. Nothing here affects your
        statutory consumer rights. If you live elsewhere in the UK, you may bring proceedings in
        your own jurisdiction where the law permits.
      </p>

      <h2>12. Contact</h2>
      <p><a href="mailto:info@arcturusdc.com">info@arcturusdc.com</a></p>
    </MandrakeLegalPage>
  );
}
