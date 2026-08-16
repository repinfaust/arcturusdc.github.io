import ThereaboutsLegalPage from '../_components/ThereaboutsLegalPage';

export const metadata = {
  title: 'thereabouts — Delete Account or Data',
  description: 'How to delete your thereabouts account, local data, and cloud backup.',
};

export default function ThereaboutsDeleteAccount() {
  return (
    <ThereaboutsLegalPage eyebrow="Data controls" title="Delete account or data">
      <p>
        thereabouts gives you two controls: one deletes your account and everything associated with
        it, and one deletes only the learner-created data on this device. Use the instructions below
        for the outcome you want.
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
        reviewed language supplied with the app remains, as it is app content rather than your personal
        data. Device settings remain so the app does not silently ask again for choices you already made.
      </p>

      <h2>Delete your account and everything with it</h2>
      <ol>
        <li>Open <strong>Settings</strong>.</li>
        <li>Find <strong>Your account</strong>.</li>
        <li>Choose <strong>Delete your account</strong> and confirm.</li>
      </ol>
      <p>
        This deletes cloud-mirrored records first, then the data on your device, then the Firebase
        Authentication account. If the cloud step fails, the account is kept rather than leaving
        records behind that nothing can reach — try again, or contact us. Audio files cached on your
        device are removed with your device data. We may retain the minimum information required to
        prevent fraud or abuse, resolve disputes, or comply with law.
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
        Uninstalling normally removes the local app database from that device. It does not delete the
        Firebase Authentication account or any cloud mirror. Use <strong>Delete your account</strong>
        {' '}before uninstalling, or contact us, if you want those records deleted as well.
      </p>

      <h2>Questions</h2>
      <p>
        See the <a href="/apps/thereabouts/privacy-policy">privacy policy</a> for the full data record,
        or contact <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a>.
      </p>
    </ThereaboutsLegalPage>
  );
}
