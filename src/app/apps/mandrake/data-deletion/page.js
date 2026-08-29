import MandrakeLegalPage, { LegalCallout } from '../_components/MandrakeLegalPage';

export const metadata = {
  title: 'Mandrake — Data Deletion',
  description: 'How to delete data stored by the Mandrake Android app.',
};

export default function MandrakeDataDeletionPage() {
  return (
    <MandrakeLegalPage title="Delete Your Mandrake Data" updated="29 August 2026">
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
        <p className="font-bold text-neutral-950">Cloud deletion happens first</p>
        <p className="mt-1">
          Mandrake deletes your Firestore urge events before clearing anything from the device. If
          the cloud request fails, nothing is deleted locally and the app tells you to try again.
          Local data and preferences are cleared only after cloud deletion succeeds.
        </p>
      </LegalCallout>

      <h2>What Reset deletes</h2>
      <ul>
        <li>all urge events under the current anonymous UID in Firestore;</li>
        <li>the on-device urge-event database;</li>
        <li>local screening responses, scores, bands and risk assessments;</li>
        <li>local loops, milestones, rewards and related progress held in that database; and</li>
        <li>local app preferences, including points, onboarding, region and reminder settings.</li>
      </ul>

      <h2>What Reset does not currently delete</h2>
      <ul>
        <li>the Firebase anonymous-authentication record;</li>
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
        Because Mandrake does not collect your name or email address, include the anonymous UID
        assigned to the app installation so we can find the correct cloud records. In Mandrake,
        open <strong>Settings → Account</strong>, then copy the identifier shown there. If you no
        longer have access to the installed app or the identifier, tell us; without it we may be
        unable to identify anonymous cloud records.
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
