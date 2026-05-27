import {
  LegalLinks,
  RehabPathLegalPage,
  Section,
} from "../_components/RehabPathLegalPage";

export const metadata = {
  title: "RehabPath – Delete Account or Data",
  description:
    "How to delete RehabPath app data, encrypted backups, and local reminder settings.",
};

export default function RehabPathDeleteAccountPage() {
  return (
    <RehabPathLegalPage
      eyebrow="Data deletion"
      title="Delete Account or Data"
      effectiveDate="May 27, 2026"
    >
      <p>
        RehabPath does not create user accounts and does not store rehabilitation data on RehabPath
        servers. There is no cloud account to delete.
      </p>
      <p>
        This page explains how to delete local RehabPath app data from your device and how to remove
        any encrypted backup files you exported.
      </p>

      <Section title="How to delete local app data">
        <div className="rounded-lg border border-[#D3DDD6] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4B6F68]">
            Option 1
          </p>
          <p className="mt-2">
            Open RehabPath, go to app settings, and use the reset option to clear local app data.
          </p>
        </div>
        <div className="rounded-lg border border-[#D3DDD6] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4B6F68]">
            Option 2
          </p>
          <p className="mt-2">
            Uninstall RehabPath from your device. The operating system removes local in-app data
            associated with the app, subject to normal iOS or Android behavior.
          </p>
        </div>
      </Section>

      <Section title="What is deleted">
        <ul>
          <li>Your selected rehabilitation program.</li>
          <li>Program progress, exercise completion, skipped exercises, and milestones.</li>
          <li>Activity logs, symptom logs, mood, motivation, notes, and related tracking values.</li>
          <li>Custom plan details, reminder preferences, and privacy/disclaimer acceptance state.</li>
          <li>Backup metadata stored inside the app.</li>
        </ul>
      </Section>

      <Section title="What is not automatically deleted">
        <p>
          Encrypted backup files that you exported are saved outside RehabPath in the location you
          chose, such as Files, Drive, Downloads, or another storage destination on your device.
        </p>
        <p>
          To delete an exported backup, remove the <code>.rehabpath-backup</code> file from every
          place where you saved or shared it. RehabPath does not receive or control those exported
          files.
        </p>
      </Section>

      <Section title="Retention period">
        <p>
          Because RehabPath does not operate user accounts or a server database for rehabilitation
          data, there is no server-side account record or server-side rehabilitation data retention
          period.
        </p>
        <p>
          Local app data remains on your device until you reset it or uninstall the app. Exported
          backup files remain wherever you saved them until you delete them.
        </p>
      </Section>

      <Section title="Need help?">
        <p>
          If you need help understanding how to delete RehabPath local data or exported backups,
          contact us at{" "}
          <a className="text-[#0F6B78] underline-offset-4 hover:underline" href="mailto:info@arcturusdc.com">
            info@arcturusdc.com
          </a>
          .
        </p>
        <LegalLinks />
      </Section>
    </RehabPathLegalPage>
  );
}
