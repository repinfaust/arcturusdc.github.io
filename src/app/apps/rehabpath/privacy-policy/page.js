import {
  ContactBlock,
  LegalLinks,
  RehabPathLegalPage,
  Section,
} from "../_components/RehabPathLegalPage";

export const metadata = {
  title: "RehabPath - Privacy Policy",
  description: "Read the RehabPath privacy policy in HTML. Arcturus Digital Consulting Ltd.",
};

export default function RehabPathPrivacyPolicyPage() {
  return (
    <RehabPathLegalPage
      eyebrow="Privacy"
      title="RehabPath Privacy Policy"
      effectiveDate="July 21, 2026"
    >
      <p>
        This Privacy Policy explains how RehabPath handles information when you use the RehabPath
        mobile app on iOS or Android.
      </p>
      <p>
        RehabPath is designed as an offline-first, privacy-first rehabilitation tracking app. The app
        does not require a RehabPath account, does not use cloud sync, and stores your
        rehabilitation data locally on your device by default. Some optional AI-assisted features
        send limited, reviewed information off your device when you choose to use them, as described
        below.
      </p>

      <Section title="Summary">
        <ul>
          <li>No RehabPath account is required.</li>
          <li>
            RehabPath does not collect your name, email address, or personal identifiers for account
            purposes.
          </li>
          <li>
            RehabPath does not use analytics, advertising SDKs, tracking SDKs, or third-party usage
            telemetry.
          </li>
          <li>Your app data is stored locally on your device by default.</li>
          <li>Optional encrypted backup files are created only when you choose to export them.</li>
          <li>
            Optional clinician pack PDFs are created on your device and shared only through the
            destination you choose.
          </li>
          <li>
            Optional AI features may send client-redacted, user-reviewed content to RehabPath's AI
            gateway and OpenAI to import a plan from a PDF or generate a clinician summary.
          </li>
          <li>
            If you uninstall the app, local in-app data is removed by the operating system, but
            exported backup files and PDFs remain wherever you saved or shared them until you delete
            them.
          </li>
        </ul>
      </Section>

      <Section title="Information stored on your device">
        <p>RehabPath may store the following information locally on your device:</p>
        <ul>
          <li>Your selected rehabilitation program or custom plan.</li>
          <li>
            Program progress, exercise completion, skipped exercises, confidence entries,
            milestones, and activity logs.
          </li>
          <li>
            Symptom and recovery logs, such as pain, stiffness, DOMS, mood, motivation, notes, and
            related tracking values you choose to enter.
          </li>
          <li>
            Custom plan details you enter or import, such as plan title, phases, exercises,
            milestones, clinician/service name, and plan notes.
          </li>
          <li>Local reminder preferences, including reminder time and backup reminder settings.</li>
          <li>Privacy/disclaimer acceptance state.</li>
          <li>Backup metadata, such as the last backup time and backup file name.</li>
        </ul>
        <p>
          This data is stored in local app storage and local SQLite storage on your device.
          RehabPath does not operate a cloud account, cloud sync service, or server database for your
          rehabilitation records.
        </p>
      </Section>

      <Section title="Optional AI features">
        <p>
          RehabPath includes optional AI-assisted features. These features are not required to use
          the app.
        </p>
        <h3 className="text-xl font-semibold tracking-tight text-[#17211E]">
          Custom plan PDF import
        </h3>
        <p>If you choose to import a rehabilitation plan from a PDF:</p>
        <ul>
          <li>The app reads selectable PDF text on your device.</li>
          <li>Scanned or photographed plans are not supported by this feature.</li>
          <li>
            The app redacts high-confidence personal details on your device before any network
            request, including detected email addresses, phone numbers, NHS numbers, labelled dates
            of birth, and UK postcodes.
          </li>
          <li>
            Names are not reliably detected automatically, so the app shows you the exact redacted
            text before it is sent and asks you to remove anything personal that remains.
          </li>
          <li>
            Only the reviewed text is sent to RehabPath's AI gateway so it can be structured into a
            custom plan.
          </li>
          <li>The imported plan is shown to you for review and editing before you save it.</li>
        </ul>
        <h3 className="text-xl font-semibold tracking-tight text-[#17211E]">
          AI clinician summary
        </h3>
        <p>If you choose to generate an AI summary for a clinician pack:</p>
        <ul>
          <li>
            The app sends only structured metrics from the sections you selected, such as activity
            counts, symptom scores, and milestone status.
          </li>
          <li>
            Your written notes are not sent to the AI summary feature. If you include notes in the
            clinician pack, they are included in the exported PDF exactly as app data, not as AI
            input.
          </li>
          <li>
            Custom milestone text is redacted on-device before it is included in the AI summary
            request.
          </li>
          <li>
            The AI-generated summary is shown to you for review and editing before it is included in
            the clinician pack.
          </li>
          <li>
            The clinician pack is exported as a PDF through your device's sharing options. RehabPath
            does not automatically send it to a clinician or upload it to a portal.
          </li>
        </ul>
        <h3 className="text-xl font-semibold tracking-tight text-[#17211E]">
          AI gateway, Firebase, and OpenAI
        </h3>
        <p>
          The optional AI features use a Firebase callable function operated for RehabPath as a
          stateless gateway to OpenAI.
        </p>
        <p>When you use an AI feature:</p>
        <ul>
          <li>
            Firebase anonymous authentication may create a random per-install identifier. This is
            used to control abuse and usage limits, not to create a RehabPath account.
          </li>
          <li>
            RehabPath's server stores only usage/rate-limit counters for that identifier, such as
            daily request counts. It does not store your PDF text, rehabilitation logs, AI prompts,
            imported plan payloads, or generated summaries.
          </li>
          <li>
            The gateway may log metadata such as request mode, platform, app version, status,
            latency, and token counts. It is designed not to log request or response content.
          </li>
          <li>
            The reviewed/redacted content needed for the AI task is sent to OpenAI to generate the
            requested output.
          </li>
          <li>
            OpenAI's own terms, privacy, security, and data-handling policies apply to information
            processed by OpenAI.
          </li>
        </ul>
        <p>
          Do not use the AI features for emergency, urgent, highly sensitive, or unreviewed personal
          information.
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
          If you save a backup file to a third-party storage provider, that provider's own terms and
          privacy practices apply to the storage location you choose. The backup file itself remains
          encrypted by RehabPath.
        </p>
      </Section>

      <Section title="Clinician pack exports">
        <p>
          RehabPath lets you create an optional clinician progress pack PDF from data stored in the
          app.
        </p>
        <p>When you export a clinician pack:</p>
        <ul>
          <li>The PDF is generated on your device.</li>
          <li>
            You choose whether to include sections such as activity summary, symptom trends,
            milestones, recent notes, AI summary, and activity log.
          </li>
          <li>
            You choose where to save or share the PDF through your device's available sharing
            options.
          </li>
          <li>RehabPath does not receive the PDF.</li>
        </ul>
        <p>
          If you save or share the PDF with another app, storage provider, or person, their own
          terms and privacy practices apply.
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
          checks may contact Expo's update service and may include technical information needed to
          deliver a compatible update, such as app version, runtime version, platform, update
          channel, and standard network information such as IP address.
        </p>
        <p>
          RehabPath does not include your rehabilitation logs, symptoms, notes, backup contents, PDF
          contents, clinician pack contents, or other local health-related app data in update
          requests.
        </p>
      </Section>

      <Section title="What RehabPath does not do">
        <p>RehabPath does not:</p>
        <ul>
          <li>Create RehabPath user accounts.</li>
          <li>Provide cloud sync.</li>
          <li>Provide server-side backup recovery.</li>
          <li>Store your rehabilitation records in a RehabPath cloud database.</li>
          <li>Use analytics or advertising trackers.</li>
          <li>Sell personal information.</li>
          <li>Use your data for advertising.</li>
          <li>Automatically share rehabilitation logs with clinicians or other third parties.</li>
          <li>
            Send app data to AI services unless you choose to use an optional AI feature and approve
            the reviewed content or output required for that feature.
          </li>
        </ul>
      </Section>

      <Section title="Operating system, app store, and third-party service data">
        <p>
          Apple, Google, and your device operating system may collect crash reports, diagnostics,
          purchase history, download history, or other app-store/device information under their own
          policies and settings. RehabPath does not control those systems and does not receive your
          local rehabilitation data from them.
        </p>
        <p>
          If you use optional AI features, Firebase and OpenAI process the information needed to
          provide those features as described above and under their own applicable terms and privacy
          practices.
        </p>
        <p>
          If you save or share backups or PDFs through third-party storage, messaging, email, or
          sharing services, those services process the files according to their own terms and privacy
          practices.
        </p>
      </Section>

      <Section title="Data retention and deletion">
        <p>RehabPath retains each category of data as follows:</p>
        <ul>
          <li>
            <strong>Rehabilitation data stored in the app:</strong> retained on your device until
            you use the reset option in the app settings or uninstall the app.
          </li>
          <li>
            <strong>Encrypted backups and clinician pack PDFs:</strong> retained in the location
            where you save or share them until you delete them. RehabPath does not receive or keep
            a server copy of these files.
          </li>
          <li>
            <strong>Content submitted to an optional AI feature:</strong> processed to return the
            requested result and not stored in RehabPath's server database after the request is
            completed. OpenAI processes that content under its own data-retention terms and
            policies.
          </li>
          <li>
            <strong>AI usage and rate-limit counters:</strong> daily counters associated with the
            random Firebase identifier are retained for 31 days from their last update and are then
            scheduled for automatic deletion. They contain request counts and timestamps, not PDF
            text, rehabilitation records, prompts, imported plans, or generated summaries.
          </li>
          <li>
            <strong>AI gateway operational logs:</strong> metadata-only logs are retained for 30
            days. They may include the random Firebase identifier, request mode, platform, app
            version, status, latency, and token counts, but not request or response content.
          </li>
          <li>
            <strong>Firebase anonymous authentication record:</strong> the random authentication
            identifier and Firebase authentication metadata may be retained for as long as the
            optional AI service operates, unless removed earlier during service maintenance. It is
            not linked by RehabPath to a name, email address, rehabilitation record, or AI content.
          </li>
        </ul>
        <p>
          You can delete local RehabPath data by using the reset option in the app settings or by
          uninstalling the app.
        </p>
        <p>
          Deleting the app removes local in-app data from that device, subject to normal operating
          system behavior. It does not delete encrypted backup files, exported clinician pack PDFs,
          or other files you saved outside the app. To remove exported files, delete them from the
          locations where you saved or shared them.
        </p>
      </Section>

      <Section title="Medical and wellness information">
        <p>
          RehabPath is a non-clinical wellness and rehabilitation tracking tool. It is not a medical
          device and does not provide diagnosis, treatment, medical advice, clinical decision
          support, or emergency support.
        </p>
        <p>
          AI-assisted import and summary features may help structure or summarise information you
          provide, but they can be incomplete or wrong. You must review and edit AI-assisted outputs
          before relying on them or sharing them.
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
          We may update this Privacy Policy as the app changes. If the app's data handling changes
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
