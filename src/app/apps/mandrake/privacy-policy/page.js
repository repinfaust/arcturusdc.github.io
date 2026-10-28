import MandrakeLegalPage, { LegalCallout } from '../_components/MandrakeLegalPage';

export const metadata = {
  title: 'Mandrake — Privacy Policy',
  description: 'How Mandrake stores, uses, protects and deletes app data.',
};

export default function MandrakePrivacyPolicyPage() {
  return (
    <MandrakeLegalPage title="Privacy Policy" updated="28 October 2026">
      <p>
        Mandrake is published by <strong>Arcturus Digital Consulting Ltd</strong>. We are the
        controller for personal data processed through the app. Contact us at{' '}
        <a href="mailto:info@arcturusdc.com">info@arcturusdc.com</a>.
      </p>

      <LegalCallout>
        <p className="font-semibold text-neutral-950">The short version</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>No name, email or password—just a random app identifier.</li>
          <li>Urge entries are stored securely in the cloud under that identifier.</li>
          <li>Screening answers remain on your device. Text you type under "Other" is not saved.</li>
          <li>There are no ads or analytics SDKs in the Android or iOS app.</li>
          <li>You can reset app data in Settings and can request cloud deletion by email.</li>
        </ul>
      </LegalCallout>

      <h2>1. Information Mandrake processes</h2>

      <h3>Anonymous app identity</h3>
      <p>
        On first use, Firebase Authentication assigns the app a random user identifier (UID).
        Mandrake does not ask you for a name, email address or password. The UID keeps cloud records
        separated by anonymous app identity. On iOS, the identity may persist after reinstalling
        because authentication credentials are stored in the system Keychain. Although it is
        pseudonymous rather than a name, we still protect it as personal data.
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
        If you tap &quot;Save check-in&quot; on the Today screen, Mandrake also saves a check-in: the
        time, how strong an urge is (0 to 10) and your mood. Check-ins are saved only when you tap
        the button, never automatically, and are stored the same way as urge events.
      </p>
      <p>
        These records can reveal information about health, substance use or behaviour and are
        treated as sensitive. They are stored under the anonymous UID in Google Cloud Firestore.
        Firebase also keeps a cached copy of these same fields on your device so the app works
        offline.
      </p>
      <p>
        If you choose &quot;Other&quot; for the urge or the tactic and type a description, only the
        choice &quot;Other&quot; is recorded. The text you type is not uploaded and is not kept on
        your device either.
      </p>

      <h3>Information stored only on your device</h3>
      <ul>
        <li>optional screening responses, scores and risk bands;</li>
        <li>loops, milestones, rewards and progress; and</li>
        <li>settings such as support region and reminder preferences.</li>
      </ul>

      <h3>Purchases</h3>
      <p>
        A one-time unlock is sold by Google Play on Android or the Apple App Store on iOS and
        checked by RevenueCat. The relevant store handles the payment details. Purchases are
        separate on each platform; an Android unlock does not unlock iOS, or vice versa. RevenueCat
        processes the identifiers and transaction information needed to validate and restore the
        purchase; it does not receive your urge log from Mandrake.
      </p>

      <h3>Support and platform diagnostics</h3>
      <p>
        If you email us, we process the information you choose to send so we can answer. Google
        Play, Apple or your device platform may also provide diagnostic or crash information under
        its own settings. Mandrake does not currently include Firebase Analytics or Crashlytics.
      </p>

      <h2>2. What Mandrake does not collect</h2>
      <ul>
        <li>No advertising identifiers, advertising or cross-app tracking.</li>
        <li>No location, contacts, photos, camera or microphone data.</li>
        <li>No sale or rental of data.</li>
        <li>No use of urge data to train AI or to build commercial profiles.</li>
      </ul>
      <p>
        The app requests notification permission for reminders you choose. It also uses device
        haptics (and Android vibration access) for feedback. Reminders are scheduled locally on your
        device.
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
        relevant additional condition is explicit consent. The current Android and iOS
        implementations do not yet present a separate explicit-consent control before the first
        cloud upload; this is an app-side compliance gap, and this policy does not treat ordinary
        app use as a substitute for that control. You may stop further processing by no longer
        recording events and may request deletion as described below. We use legitimate interests to
        answer support requests and protect the service, where those interests are not overridden by
        your rights.
      </p>

      <h2>5. Storage, processors and international transfers</h2>
      <p>
        Google Firebase provides authentication and Firestore storage. Google Play or Apple
        processes the purchase on the relevant platform, and RevenueCat checks purchase entitlement.
        These providers act under their own terms and applicable data-processing safeguards. Their
        processing may take place outside the UK; where required, recognised transfer safeguards
        apply.
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
        On iOS, app data may be included in iCloud or computer backups according to your
        Apple/device settings. Deleting the app does not delete cloud urge records or necessarily
        remove the iOS Keychain identity. Use the in-app deletion control or contact us to remove
        cloud records.
      </p>
      <p>
        The Reset action deletes Firestore urge events first. Only after that succeeds does it
        clear the local database and app preferences. If cloud deletion fails, the app leaves the
        local data in place and asks you to try again. Reset does not delete the Firebase anonymous
        authentication record. See the <a href="/apps/mandrake/data-deletion">Data Deletion page</a>{' '}
        for the exact process.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, erase, restrict,
        object to or receive a copy of your personal data. Because Mandrake does not collect your
        name or email address, we need the anonymous UID to locate cloud records. You can copy it
        from the Account section in Mandrake Settings.
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
        <a href="mailto:info@arcturusdc.com">info@arcturusdc.com</a>
      </p>
    </MandrakeLegalPage>
  );
}
