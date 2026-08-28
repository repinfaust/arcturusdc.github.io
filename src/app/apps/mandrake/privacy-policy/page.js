import MandrakeLegalPage, { LegalCallout } from '../_components/MandrakeLegalPage';

export const metadata = {
  title: 'Mandrake — Privacy Policy',
  description: 'How Mandrake stores, uses, protects and deletes app data.',
};

export default function MandrakePrivacyPolicyPage() {
  return (
    <MandrakeLegalPage title="Privacy Policy" updated="28 August 2026">
      <p>
        Mandrake is published by <strong>Arcturus Digital Consulting Ltd</strong>, 82 Victoria
        Street, Nottingham, NG15 7EA, United Kingdom. We are the controller for personal data
        processed through the app. Contact us at{' '}
        <a href="mailto:info@arcturusdc.com">info@arcturusdc.com</a>.
      </p>

      <LegalCallout>
        <p className="font-semibold text-neutral-950">The short version</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>You do not provide a name, email address or password.</li>
          <li>The app creates a random Firebase identifier and stores your urge log in Firestore.</li>
          <li>Screening answers, custom text and other app records stay on your device.</li>
          <li>There are no ads or analytics SDKs in the current Android app.</li>
          <li>You can reset app data in Settings and can request cloud deletion by email.</li>
        </ul>
      </LegalCallout>

      <h2>1. Information Mandrake processes</h2>

      <h3>Anonymous app identity</h3>
      <p>
        On first use, Firebase Authentication assigns the app a random user identifier (UID).
        Mandrake does not ask you for a name, email address or password. The UID keeps cloud
        records separated between app installations. Although it is pseudonymous rather than a
        name, we still protect it as personal data.
      </p>

      <h3>Urge events stored in Firestore</h3>
      <p>When you save an urge event, the current app uploads the following fields:</p>
      <ul>
        <li>the time of the event and whether the urge was bypassed or acted on;</li>
        <li>the selected urge category, intensity, mood and trigger;</li>
        <li>the selected tactic; and</li>
        <li>whether the wave timer was used and its duration.</li>
      </ul>
      <p>
        These records can reveal information about health, substance use or behaviour and are
        treated as sensitive. They are stored under the anonymous UID in Google Cloud Firestore.
        Custom tactic text and custom urge-category text are not included in the current cloud
        upload.
      </p>

      <h3>Information stored only on your device</h3>
      <ul>
        <li>the local copy of your urge events, including any custom text;</li>
        <li>optional screening responses, scores and risk bands;</li>
        <li>loops, milestones, rewards and progress; and</li>
        <li>settings such as support region and reminder preferences.</li>
      </ul>

      <h3>Purchases</h3>
      <p>
        A one-time unlock is sold by Google Play and checked by RevenueCat. Google handles the
        payment details. RevenueCat processes the identifiers and transaction information needed
        to validate and restore the purchase; it does not receive your urge log from Mandrake.
      </p>

      <h3>Support and platform diagnostics</h3>
      <p>
        If you email us, we process the information you choose to send so we can answer. Google
        Play or your device platform may also provide diagnostic or crash information under its
        own settings. Mandrake does not currently include Firebase Analytics or Crashlytics.
      </p>

      <h2>2. What Mandrake does not collect</h2>
      <ul>
        <li>No advertising identifiers, advertising or cross-app tracking.</li>
        <li>No location, contacts, photos, camera or microphone data.</li>
        <li>No sale or rental of data.</li>
        <li>No use of urge data to train AI or to build commercial profiles.</li>
      </ul>
      <p>
        The app requests notification permission for reminders you choose and vibration access
        for haptic feedback.
      </p>

      <h2>3. Why we process information</h2>
      <p>We process the minimum information needed to:</p>
      <ul>
        <li>save and show your history, patterns, milestones and rewards;</li>
        <li>provide optional screening and support signposting;</li>
        <li>validate and restore a purchase; and</li>
        <li>answer support requests and maintain the security and reliability of the app.</li>
      </ul>

      <h2>4. Legal basis in the UK and EEA</h2>
      <p>
        We process app data because it is necessary to provide the Mandrake service you request.
        Where urge records reveal special-category information, including health information, the
        relevant additional condition is explicit consent. The current Android release does not
        yet present a separate explicit-consent control before the first cloud upload; this is an
        app-side compliance gap, and this policy does not treat ordinary app use as a substitute
        for that control. You may stop further processing by no longer recording events and may
        request deletion as described below. We use legitimate interests to answer support
        requests and protect the service, where those interests are not overridden by your rights.
      </p>

      <h2>5. Storage, processors and international transfers</h2>
      <p>
        Google Firebase provides authentication and Firestore storage. Google Play processes the
        purchase, and RevenueCat checks purchase entitlement. These providers act under their own
        terms and applicable data-processing safeguards. Their processing may take place outside
        the UK; where required, recognised transfer safeguards apply.
      </p>

      <h2>6. Retention and deletion</h2>
      <p>
        Local records remain until you reset app data, clear the app&apos;s storage or uninstall it.
        Firestore urge events remain until the in-app cloud deletion succeeds or we fulfil a
        deletion request. Purchase and support records may be retained where reasonably needed for
        accounting, fraud prevention, legal claims or support history.
      </p>
      <p>
        Android backup is enabled for the current app, so Google may retain or restore an encrypted
        device backup according to your Android backup settings and Google&apos;s retention rules.
      </p>
      <p>
        The current Reset action clears the local database and then attempts to delete Firestore
        urge events. It does not delete the Firebase anonymous-authentication record or all locally
        stored preferences. See the <a href="/apps/mandrake/data-deletion">Data Deletion page</a>{' '}
        for the exact process and limitations.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, erase, restrict,
        object to or receive a copy of your personal data. Because Mandrake does not collect your
        name or email address, we may need the anonymous UID to locate cloud records and may be
        unable to identify them without it.
      </p>
      <p>
        Contact <a href="mailto:info@arcturusdc.com">info@arcturusdc.com</a>. You may also
        complain to the UK Information Commissioner&apos;s Office at{' '}
        <a href="https://ico.org.uk/make-a-complaint/" rel="noreferrer">ico.org.uk</a>.
      </p>

      <h2>8. Security</h2>
      <p>
        Data is encrypted in transit and at rest by our cloud provider, and access to production
        systems is restricted. No service is completely secure, so keep your device and app up to
        date and use a device passcode.
      </p>

      <h2>9. Age</h2>
      <p>
        Mandrake is for people aged 16 and over. If you believe someone under 16 has provided data,
        contact us so we can take appropriate action.
      </p>

      <h2>10. Changes and contact</h2>
      <p>
        We may update this policy when the app or legal requirements change. We will publish the
        new date here and flag material changes where appropriate.
      </p>
      <p>
        <strong>Arcturus Digital Consulting Ltd</strong><br />
        82 Victoria Street, Nottingham, NG15 7EA, United Kingdom<br />
        <a href="mailto:info@arcturusdc.com">info@arcturusdc.com</a>
      </p>
    </MandrakeLegalPage>
  );
}
