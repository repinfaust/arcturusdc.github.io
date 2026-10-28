import MandrakeLegalPage, { LegalCallout } from '../_components/MandrakeLegalPage';
import DeletionRequestForm from '../_components/DeletionRequestForm';

export const metadata = {
  title: 'Mandrake — Data Deletion',
  description: 'Delete Mandrake data in the app or request cloud deletion using only your app identifier.',
};

export default function MandrakeDataDeletionPage() {
  return (
    <MandrakeLegalPage title="Delete Your Mandrake Data" updated="28 October 2026">
      <p>
        Mandrake does not ask for a name, email address or password. It uses a random Firebase UID
        to keep cloud urge events separate. The current app provides a data-reset control rather
        than a user-visible account-deletion control.
      </p>

      <h2>Delete data in the app</h2>
      <ol>
        <li>Connect your device to the internet.</li>
        <li>Open Mandrake and go to <strong>Settings</strong>.</li>
        <li>Select <strong>Delete everything</strong> (<strong>Reset All Data</strong> on older versions), then confirm <strong>Reset</strong>.</li>
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
        <li>the cached urge events on the device;</li>
        <li>local screening responses, scores, bands and risk assessments;</li>
        <li>local loops, milestones, rewards and related progress held in that database; and</li>
        <li>local app preferences, including points, onboarding, region and reminder settings.</li>
      </ul>

      <h2>What Reset does not currently delete</h2>
      <ul>
        <li>the Firebase anonymous-authentication record;</li>
        <li>Google Play, Apple or RevenueCat purchase records needed to validate and restore a purchase; or</li>
        <li>support emails, subject to applicable legal retention requirements.</li>
      </ul>

      <h2>Request deletion without relying on Reset</h2>
      <p>
        Use the form below to request deletion of the cloud urge events associated with your app
        identifier. We review requests manually and aim to complete a verifiable request within
        30 days. The confirmation appears on this page.
      </p>
      <p>
        The form asks only for the UID shown in <strong>Settings → Account</strong>. It sends that
        identifier to our support inbox so we can find the cloud records. Keep a copy until the
        request is complete. Without the identifier, we may be unable to locate those records.
      </p>
      <DeletionRequestForm />
      <p>A request through this page cannot clear data stored locally on your device. Use the in-app control above to clear local records.</p>

      <h2>Uninstalling Mandrake</h2>
      <p>
        Uninstalling removes the installed app&apos;s local data but does not by itself delete
        Firestore urge events, purchase records or backups retained under your Google or Apple
        settings. On iOS, the anonymous identity may also persist in the system Keychain. Use
        Reset while online before uninstalling, or submit a cloud deletion request above.
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
