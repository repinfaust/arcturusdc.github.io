import MandrakeLegalPage, { LegalCallout } from '../_components/MandrakeLegalPage';

export const metadata = {
  title: 'Mandrake — Data Deletion',
  description: 'How to delete data stored by the Mandrake Android app.',
};

export default function MandrakeDataDeletionPage() {
  return (
    <MandrakeLegalPage title="Delete Your Mandrake Data" updated="28 August 2026">
      <p>
        Mandrake does not ask for a name, email address or password. It uses a random Firebase UID
        to keep cloud urge events separate. The current app provides a data-reset control rather
        than a user-visible account-deletion control.
      </p>

      <h2>Delete data in the app</h2>
      <ol>
        <li>Connect your device to the internet.</li>
        <li>Open Mandrake and go to <strong>Settings</strong>.</li>
        <li>Select <strong>Reset All Data</strong>, then confirm <strong>Reset</strong>.</li>
      </ol>

      <LegalCallout>
        <p className="font-bold text-neutral-950">Important limitation in the current release</p>
        <p className="mt-1">
          Reset clears the app&apos;s local database first and then attempts to delete your Firestore
          urge events. It does not separately confirm that the cloud step succeeded. If the device
          is offline or the cloud request fails, local records may be gone while cloud events
          remain. Email us if you need confirmation or help.
        </p>
      </LegalCallout>

      <h2>What Reset deletes</h2>
      <ul>
        <li>the on-device urge-event database;</li>
        <li>local screening responses, scores, bands and risk assessments;</li>
        <li>local loops, milestones, rewards and related progress held in that database; and</li>
        <li>if the cloud step succeeds, all urge events under the current anonymous UID in Firestore.</li>
      </ul>

      <h2>What Reset does not currently delete</h2>
      <ul>
        <li>the Firebase anonymous-authentication record;</li>
        <li>all local preferences, including onboarding, region and reminder settings;</li>
        <li>Google Play or RevenueCat purchase records needed to validate and restore a purchase; or</li>
        <li>support emails, subject to applicable legal retention requirements.</li>
      </ul>

      <h2>Request deletion without relying on Reset</h2>
      <p>
        Email <a href="mailto:info@arcturusdc.com?subject=Mandrake%20data%20deletion">info@arcturusdc.com</a>{' '}
        with the subject <strong>Mandrake data deletion</strong>. We will acknowledge the request
        within three working days and aim to complete a verifiable request within 30 days.
      </p>
      <p>
        Because Mandrake does not collect your name or email address, we may need the anonymous UID
        assigned to the app installation to find the correct cloud records. The current release
        does not display that UID in Settings. If you cannot provide it, tell us whether you still
        have access to the installed app; we will explain what can be verified, but we may be
        unable to identify anonymous cloud records after the app has been removed.
      </p>

      <h2>Uninstalling Mandrake</h2>
      <p>
        Uninstalling removes the installed app&apos;s local data but does not by itself delete
        Firestore urge events, purchase records or any Android backup retained under your Google
        account settings. Use Reset while online before uninstalling, or contact us.
      </p>

      <h2>Questions or complaints</h2>
      <p>
        <strong>Arcturus Digital Consulting Ltd</strong><br />
        <a href="mailto:info@arcturusdc.com">info@arcturusdc.com</a>
      </p>
      <p>
        You may complain to the UK Information Commissioner&apos;s Office at{' '}
        <a href="https://ico.org.uk/make-a-complaint/" rel="noreferrer">ico.org.uk</a>.
      </p>
    </MandrakeLegalPage>
  );
}
