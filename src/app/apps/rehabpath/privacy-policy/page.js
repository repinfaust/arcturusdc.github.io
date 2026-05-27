import {
  ContactBlock,
  LegalLinks,
  RehabPathLegalPage,
  Section,
} from "../_components/RehabPathLegalPage";

export const metadata = {
  title: "RehabPath – Privacy Policy",
  description: "Read the RehabPath privacy policy in HTML. Arcturus Digital Consulting Ltd.",
};

export default function RehabPathPrivacyPolicyPage() {
  return (
    <RehabPathLegalPage
      eyebrow="Privacy"
      title="RehabPath Privacy Policy"
      effectiveDate="May 27, 2026"
    >
      <p>
        This Privacy Policy explains how RehabPath handles information when you use the RehabPath
        mobile app on iOS or Android.
      </p>
      <p>
        RehabPath is designed as an offline-first, privacy-first rehabilitation tracking app. The app
        does not require an account, does not use cloud sync, and does not send your rehabilitation
        data to RehabPath servers.
      </p>

      <Section title="Summary">
        <ul>
          <li>No account is required.</li>
          <li>RehabPath does not collect your name, email address, or personal identifiers.</li>
          <li>
            RehabPath does not use analytics, advertising SDKs, tracking SDKs, or third-party usage
            telemetry.
          </li>
          <li>Your app data is stored locally on your device.</li>
          <li>Optional encrypted backup files are created only when you choose to export them.</li>
          <li>
            If you uninstall the app, local in-app data is removed by the operating system, but
            exported backup files remain wherever you saved them until you delete them.
          </li>
        </ul>
      </Section>

      <Section title="Information stored on your device">
        <p>RehabPath may store the following information locally on your device:</p>
        <ul>
          <li>Your selected rehabilitation program.</li>
          <li>
            Program progress, exercise completion, skipped exercises, confidence entries,
            milestones, and activity logs.
          </li>
          <li>
            Symptom and recovery logs, such as pain, stiffness, DOMS, mood, motivation, notes, and
            related tracking values you choose to enter.
          </li>
          <li>Custom plan details you enter, such as clinician name or plan notes.</li>
          <li>Local reminder preferences, including reminder time and backup reminder settings.</li>
          <li>Privacy/disclaimer acceptance state.</li>
          <li>Backup metadata, such as the last backup time and backup file name.</li>
        </ul>
        <p>
          This data is stored in local app storage and local SQLite storage on your device.
          RehabPath does not operate a server database for this data.
        </p>
      </Section>

      <Section title="Encrypted backups">
        <p>
          RehabPath lets you create an optional encrypted backup file with the{" "}
          <code>.rehabpath-backup</code> extension.
        </p>
        <p>When you create a backup:</p>
        <ul>
          <li>The backup is encrypted on your device before export.</li>
          <li>
            You choose where to save or share the backup file, such as Files, Drive, Downloads, or
            another destination available on your device.
          </li>
          <li>RehabPath does not receive the backup file.</li>
          <li>RehabPath does not know or store your backup passphrase.</li>
        </ul>
        <p>
          If you lose your passphrase, the backup cannot be restored. RehabPath cannot recover a
          lost passphrase or decrypt a backup for you.
        </p>
        <p>
          If you save a backup file to a third-party storage provider, that provider&apos;s own terms
          and privacy practices apply to the storage location you choose. The backup file itself
          remains encrypted by RehabPath.
        </p>
      </Section>

      <Section title="Local notifications">
        <p>
          RehabPath may ask for permission to send local notifications, such as daily reminders or
          backup reminders.
        </p>
        <p>
          These reminders are scheduled on your device. RehabPath does not use a remote push
          notification server to send reminder content.
        </p>
        <p>You can disable reminders in the app settings or through your device settings.</p>
      </Section>

      <Section title="App updates">
        <p>
          RehabPath may use Expo EAS Update to check for and download app updates. These update
          checks may contact Expo&apos;s update service and may include technical information needed to
          deliver a compatible update, such as app version, runtime version, platform, update
          channel, and standard network information such as IP address.
        </p>
        <p>
          RehabPath does not include your rehabilitation logs, symptoms, notes, backup contents, or
          other local health-related app data in update requests.
        </p>
      </Section>

      <Section title="What RehabPath does not do">
        <ul>
          <li>Create user accounts.</li>
          <li>Store your rehabilitation data on RehabPath servers.</li>
          <li>Provide cloud sync.</li>
          <li>Provide server-side backup recovery.</li>
          <li>Use analytics or advertising trackers.</li>
          <li>Sell personal information.</li>
          <li>Use your data for advertising.</li>
          <li>Share rehabilitation logs with third parties.</li>
        </ul>
      </Section>

      <Section title="Operating system and app store data">
        <p>
          Apple, Google, and your device operating system may collect crash reports, diagnostics,
          purchase history, download history, or other app-store/device information under their own
          policies and settings. RehabPath does not control those systems and does not receive your
          local rehabilitation data from them.
        </p>
      </Section>

      <Section title="Deleting your data">
        <p>
          You can delete local RehabPath data by using the reset option in the app settings or by
          uninstalling the app.
        </p>
        <p>
          Deleting the app removes local in-app data from that device, subject to normal operating
          system behavior. It does not delete encrypted backup files that you exported and saved
          outside the app. To remove exported backups, delete those files from the locations where
          you saved them.
        </p>
      </Section>

      <Section title="Medical and wellness information">
        <p>
          RehabPath is a non-clinical wellness and rehabilitation tracking tool. It is not a medical
          device and does not provide diagnosis, treatment, medical advice, or emergency support.
        </p>
        <p>
          You should consult a licensed healthcare professional before starting, changing, or
          stopping any rehabilitation activity. Stop using an exercise or activity and seek
          appropriate medical advice if symptoms worsen or you experience concerning symptoms.
        </p>
      </Section>

      <Section title="Children's privacy">
        <p>
          RehabPath is not intended for use by children under 13. If you believe a child has used the
          app in a way that requires attention, delete the local app data from the device and contact
          us if needed.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          We may update this Privacy Policy as the app changes. If the app&apos;s data handling changes
          materially, the policy should be updated before the changed version is released.
        </p>
      </Section>

      <Section title="Contact">
        <ContactBlock />
        <LegalLinks />
      </Section>
    </RehabPathLegalPage>
  );
}
