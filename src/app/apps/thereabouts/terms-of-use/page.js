import ThereaboutsLegalPage from '../_components/ThereaboutsLegalPage';

export const metadata = {
  title: 'thereabouts — Terms of Use',
  description: 'Terms of use for the thereabouts iOS and Android app.',
};

export default function ThereaboutsTerms() {
  return (
    <ThereaboutsLegalPage eyebrow="Usage record" title="Terms of use">
      <p>
        These terms apply to the thereabouts iOS and Android apps supplied by Arcturus Digital
        Consulting. By using the app, you agree to these terms and the{' '}
        <a href="/apps/thereabouts/privacy-policy">privacy policy</a>.
      </p>

      <h2>1. What thereabouts is</h2>
      <p>
        thereabouts is a language-readiness app for preparing practical conversations around a real
        trip. It provides language material, likely replies, listening playback, speech-transcript
        evidence, trip context, and personal practice tools.
      </p>

      <h2>2. Service status</h2>
      <p>
        thereabouts is released on the App Store and Google Play. Features may be changed, added or
        withdrawn as the app develops. We aim to keep the app available, but do not promise
        uninterrupted access, cloud synchronisation, or that any particular feature will continue in
        its current form.
      </p>

      <h2>3. Personal use</h2>
      <p>
        You may use thereabouts for your own non-commercial language preparation. You must not attempt
        to compromise the app, bypass App Check or usage controls, probe another learner&apos;s records,
        automate abusive requests, or use the service for unlawful or harmful activity.
      </p>

      <h2>4. Language accuracy and real-world judgement</h2>
      <p>
        thereabouts prepares language for real situations, and no phrase can guarantee that every
        speaker, region or situation will use the same wording. Context, register, dialect, hearing
        conditions and local custom all matter. Much of the language in the app is written by an AI
        model and checked by a second one rather than by a person.
      </p>
      <p>
        If something does not sound right, tell the app so. The phrase is withdrawn and replaced, and
        it will not come back.
      </p>
      <p>
        Do not rely on thereabouts as an emergency interpreting service, or as professional medical,
        legal, immigration, safety or financial advice. Verify important or high-consequence
        communication with a qualified person.
      </p>

      <h2>5. Speech recognition and playback</h2>
      <p>
        Speech transcripts can be affected by microphone quality, background noise, accent, network or
        platform recognition behaviour. Transcript matching is not phoneme-level pronunciation or
        accent assessment. Text-to-speech is a learning aid and may not reflect every natural speaker.
      </p>

      <h2>6. AI-assisted material</h2>
      <p>
        Model output may be inaccurate. A response that is well-formed is not evidence that it is
        linguistically correct, and should not be treated as such.
      </p>
      <p>
        You remain responsible for the text you submit. Do not submit confidential information, or
        another person&apos;s personal data — particularly health information, identification numbers
        or financial details — unless you have a lawful reason and their knowledge or permission.
      </p>

      <h2>7. Your content</h2>
      <p>
        You retain rights in trip notes, memories, corrections, and other material you add. You give us
        only the limited permission needed to process that material to provide features you choose,
        such as consented cloud backup or translation. We do not claim ownership of your content.
      </p>

      <h2>8. Accounts and deletion</h2>
      <p>
        The app creates an anonymous Firebase account and may let you link Apple or Google sign-in.
        Account deletion and learner-data deletion are separate because local and cloud records have
        different lifecycles. Follow the{' '}
        <a href="/apps/thereabouts/delete-account">delete account or data instructions</a>.
      </p>

      <h2>9. Availability and updates</h2>
      <p>
        We may update the app to improve features, correct language, fix defects, protect users, or meet
        platform and legal requirements. Internet-dependent, sign-in, backup, speech, and AI services
        may be interrupted by third-party availability.
      </p>

      <h2>10. Charges</h2>
      <p>
        thereabouts has no subscription, purchase, or paid entitlement. Any future commercial terms
        would be introduced with updated terms before charging users.
      </p>

      <h2>11. Liability</h2>
      <p>
        Nothing in these terms excludes liability that cannot legally be excluded. Subject to that,
        thereabouts is supplied for personal use without a guarantee that it will be error-free or
        suitable for every conversation, and we are not liable for indirect or consequential loss
        arising from reliance on the app.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These terms are governed by the laws of England and Wales. The courts of England and Wales have
        non-exclusive jurisdiction, without removing consumer rights that apply where you live.
      </p>

      <h2>13. Changes and contact</h2>
      <p>
        We may update these terms as the app changes. Material changes will be identified before they
        take effect. Questions: {' '}
        <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a>.
      </p>
    </ThereaboutsLegalPage>
  );
}
