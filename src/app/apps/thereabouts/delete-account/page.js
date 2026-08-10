import ThereaboutsLegalPage from '../_components/ThereaboutsLegalPage';

export const metadata = {
  title: 'thereabouts — Delete Account or Data',
  description: 'How to delete your thereabouts account, local data, and cloud backup.',
};

export default function ThereaboutsDeleteAccount() {
  return (
    <ThereaboutsLegalPage eyebrow="Data controls" title="Delete account or data">
      <p>
        thereabouts separates your local learning data, Firebase authentication account, and optional
        cloud mirror. This prevents one action from pretending to delete information held somewhere
        else. Use the instructions below for the outcome you want.
      </p>

      <h2>Delete everything you added from this device</h2>
      <ol>
        <li>Open thereabouts.</li>
        <li>Open <strong>Settings</strong>.</li>
        <li>Under <strong>Your data</strong>, choose <strong>Delete everything you have added</strong>.</li>
        <li>Read the confirmation and choose <strong>Delete all</strong>.</li>
      </ol>
      <p>
        This removes learner-created memories, trip moments, phrases, and replies from the device. The
        reviewed Italian supplied with the app remains, as it is app content rather than your personal
        data. Device settings remain so the app does not silently ask again for choices you already made.
      </p>

      <h2>Delete the authentication account</h2>
      <ol>
        <li>Open <strong>Settings</strong>.</li>
        <li>If you linked Apple or Google, find <strong>Your account</strong>.</li>
        <li>Choose <strong>Delete your account</strong> and confirm.</li>
      </ol>
      <p>
        The Firebase Authentication account is deleted and the app returns to a fresh anonymous owner.
        Data already present on the device stays until you delete it separately. The current development
        build does not automatically erase Firestore mirror records when the authentication account is
        deleted.
      </p>

      <h2>Delete cloud-mirrored records</h2>
      <p>
        Email <a href="mailto:help@arcturusdc.com?subject=thereabouts%20data%20deletion">help@arcturusdc.com</a>{' '}
        with the subject <strong>thereabouts data deletion</strong>. If possible, send the request while
        you can still access the linked account so ownership can be verified. Do not email phrase text,
        memories, identity documents, passwords, or sign-in tokens.
      </p>
      <p>
        After verification, we will delete records held under your user path in Firestore and confirm
        completion. We may retain the minimum information required to document the request, prevent
        fraud or abuse, resolve disputes, or comply with law.
      </p>

      <h2>If you cannot open the app</h2>
      <p>
        Email <a href="mailto:help@arcturusdc.com?subject=thereabouts%20account%20help">help@arcturusdc.com</a>{' '}
        from the address linked through Apple or Google, if one was used. We will ask only for the
        information reasonably necessary to locate and verify the account. Anonymous accounts that were
        never linked may not be identifiable from an email address.
      </p>

      <h2>What uninstalling does</h2>
      <p>
        Uninstalling normally removes the local app database from that device. It does not reliably
        delete the Firebase Authentication account or any cloud mirror. Use the controls above or
        contact us if you want those records deleted as well.
      </p>

      <h2>Questions</h2>
      <p>
        See the <a href="/apps/thereabouts/privacy-policy">privacy policy</a> for the full data record,
        or contact <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a>.
      </p>
    </ThereaboutsLegalPage>
  );
}
