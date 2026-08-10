import ThereaboutsLegalPage from '../_components/ThereaboutsLegalPage';

export const metadata = {
  title: 'thereabouts — Privacy Policy',
  description: 'Privacy policy for the thereabouts iOS and Android app.',
};

export default function ThereaboutsPrivacyPolicy() {
  return (
    <ThereaboutsLegalPage eyebrow="Privacy record" title="Privacy policy">
      <p>
        <strong>The short version:</strong> thereabouts is local-first. Its reviewed language, your
        trip preparation, and your settings work without sending your language to an AI service.
        The app creates a Firebase identifier so records have an owner, but cloud backup, AI
        translation, and product analytics are separate choices. Only an explicit yes should enable
        an optional use.
      </p>

      <h2>1. Who controls your data</h2>
      <p>
        thereabouts is provided by Arcturus Digital Consulting, registered in England and Wales. For
        data-protection questions or requests, email{' '}
        <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a>.
      </p>

      <h2>2. Information kept on your device</h2>
      <p>Local SQLite storage is the app&apos;s primary record. It may contain:</p>
      <ul>
        <li>Trip details and likely situations</li>
        <li>Phrases, likely replies, validation provenance, and practice state</li>
        <li>People, places, routines, and preferences you explicitly approve as memories</li>
        <li>Trip moments you choose to record</li>
        <li>Settings, text size, theme, and consent choices</li>
      </ul>
      <p>
        Memories marked high-sensitivity are local-only. The app does not silently turn an inference
        into a saved memory.
      </p>

      <h2>3. Account and sign-in information</h2>
      <p>
        The current build creates an anonymous Firebase Authentication account when it starts. This
        gives local records an owner before you add anything. You may later link that account using
        Apple or Google sign-in. Firebase Authentication may process an identifier, sign-in provider,
        email address supplied by that provider, IP address, user agent, and security information.
      </p>
      <p>
        Signing in is optional for the learning experience. Apple and Google process sign-in under
        their own privacy policies.
      </p>

      <h2>4. Optional cloud backup</h2>
      <p>
        Cloud backup is off unless you explicitly agree. If enabled, learner-created memories, trip
        moments, phrases, and phrase replies are mirrored to Google Cloud Firestore under your Firebase
        user identifier. The reviewed seed library, device settings, and consent choices are not
        mirrored.
      </p>
      <p>
        Security rules restrict records to their owner. Google may still process technical service
        data such as IP addresses, app identifiers, and operational information when providing Firebase.
      </p>

      <h2>5. Speech recognition and playback</h2>
      <p>
        Microphone access is requested only when you press the spoken-practice control. The app uses
        the device platform&apos;s speech-recognition service to produce a target-language transcript and does
        not save raw microphone audio as a memory or cloud record. Apple or Google may process speech
        under the operating system and recognition-service settings on your device.
      </p>
      <p>
        Target-language playback uses the device text-to-speech service. thereabouts presents transcripts as
        recognition evidence, not as expert pronunciation or accent assessment.
      </p>

      <h2>6. AI translation and language suggestions</h2>
      <p>
        Live AI translation is disabled in the current development build while its final App Check gate is
        completed. If enabled in a later build, the app will ask for explicit consent before the first
        request. Requests go through an App-Check-protected Firebase Function before OpenAI; the mobile
        app does not contain an OpenAI API key.
      </p>
      <p>The permitted request is deliberately narrow:</p>
      <ul>
        <li>The phrase you ask to translate</li>
        <li>Your destination and approximate trip timing</li>
        <li>The selected situation, using a closed set of fields</li>
      </ul>
      <p>The request does not include:</p>
      <ul>
        <li>Your saved people, places, relationships, routines, or preferences</li>
        <li>High-sensitivity memories</li>
        <li>Raw recordings</li>
        <li>Your email address or sign-in credential</li>
      </ul>
      <p>
        OpenAI states that API inputs and outputs are not used to train its models by default unless
        the customer opts in. Its abuse-monitoring retention and other processing are governed by its{' '}
        <a href="https://platform.openai.com/docs/models/default-usage-policies-by-endpoint" target="_blank" rel="noopener noreferrer">
          API data controls
        </a>.
      </p>

      <h2>7. Analytics and technical data</h2>
      <p>
        The development build contains Firebase Analytics and an in-app consent choice intended to
        govern anonymous feature counts. The consent-to-collection binding is not yet verified, so
        testers should assume Firebase may receive standard automatic app-instance, device, session,
        and diagnostic events. The app does not deliberately send phrase text, transcripts, recordings,
        names, addresses, or memory content as analytics events.
      </p>
      <p>
        Analytics will not be described as opt-in for a public release until collection is technically
        proven to remain disabled before consent.
      </p>

      <h2>8. Why information is processed</h2>
      <ul>
        <li>To provide local trip preparation and practice you request</li>
        <li>To authenticate an owner and prevent access to another learner&apos;s records</li>
        <li>To provide optional backup, translation, or analytics where the relevant choice permits it</li>
        <li>To secure the service, prevent abuse, diagnose failures, and meet legal obligations</li>
      </ul>

      <h2>9. Retention and deletion</h2>
      <ul>
        <li>Local learner-created data remains until you delete it, clear the app, or uninstall it.</li>
        <li>Cloud-mirrored data remains until it is deleted following a verified request.</li>
        <li>Your Firebase Authentication record remains until the account is deleted.</li>
        <li>Service providers may retain security, abuse-prevention, and operational records under their own terms or where law requires.</li>
      </ul>
      <p>
        Settings includes separate controls to delete learner-created data on the device and to delete
        the authentication account. The current account button does not by itself erase cloud-mirrored
        Firestore records. To request deletion of cloud data, follow the steps on the{' '}
        <a href="/apps/thereabouts/delete-account">delete account or data page</a>.
      </p>

      <h2>10. International processing</h2>
      <p>
        Firebase Authentication is operated by Google from US data centres. Other Firebase services
        may use configured regions or Google&apos;s global infrastructure depending on the service. AI
        requests may be processed outside the UK. Appropriate provider contractual safeguards apply
        where required.
      </p>

      <h2>11. Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, erase, restrict, export,
        or object to processing of your personal data, and to withdraw consent without affecting prior
        lawful processing. Contact us using the address below. You may also complain to the UK
        Information Commissioner&apos;s Office or your local supervisory authority.
      </p>

      <h2>12. Children</h2>
      <p>
        thereabouts is designed as an adult travel-learning experiment and is not directed to children
        under 13. We do not knowingly seek children&apos;s personal information.
      </p>

      <h2>13. Changes and contact</h2>
      <p>
        We will update this policy when the build&apos;s data handling changes and provide appropriate
        notice before a material new use. Questions and requests: {' '}
        <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a>.
      </p>
    </ThereaboutsLegalPage>
  );
}
