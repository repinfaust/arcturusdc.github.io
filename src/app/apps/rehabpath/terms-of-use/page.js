import {
  ContactBlock,
  LegalLinks,
  RehabPathLegalPage,
  Section,
} from "../_components/RehabPathLegalPage";

export const metadata = {
  title: "RehabPath - Terms of Use",
  description: "Read the RehabPath terms of use in HTML. Arcturus Digital Consulting Ltd.",
};

export default function RehabPathTermsOfUsePage() {
  return (
    <RehabPathLegalPage
      eyebrow="Terms"
      title="RehabPath Terms of Use"
      effectiveDate="June 11, 2026"
    >
      <p>
        These Terms of Use govern your use of the RehabPath mobile app on iOS and Android. By using
        RehabPath, you agree to these Terms. If you do not agree, do not use the app.
      </p>

      <Section title="What RehabPath is">
        <p>
          RehabPath is an offline-first mobile app that helps you follow, record, import, export,
          and review rehabilitation-related routines, progress, symptoms, activities, reminders,
          optional encrypted backups, and optional clinician progress packs.
        </p>
        <p>
          RehabPath is intended for general wellness, education, and personal tracking. It is not a
          medical device.
        </p>
      </Section>

      <Section title="Medical notice">
        <p>
          RehabPath does not provide medical advice, diagnosis, treatment, clinical decision support,
          or emergency assistance.
        </p>
        <p>
          You are responsible for deciding whether any activity is appropriate for you. Consult a
          licensed healthcare professional before starting, changing, skipping, or stopping any
          exercise or rehabilitation routine.
        </p>
        <p>
          Stop immediately and seek appropriate medical advice if you experience increased pain,
          numbness, tingling, weakness, dizziness, shortness of breath, chest pain, swelling, or any
          other concerning symptom.
        </p>
        <p>Do not use RehabPath for emergencies. In an emergency, contact local emergency services.</p>
      </Section>

      <Section title="Eligibility">
        <p>
          You must be able to understand and accept these Terms to use RehabPath. RehabPath is not
          intended for children under 13.
        </p>
      </Section>

      <Section title="Your data and device">
        <p>RehabPath stores app data locally on your device by default. You are responsible for:</p>
        <ul>
          <li>Keeping your device secure.</li>
          <li>Managing access to your device.</li>
          <li>Deciding what information to enter into the app.</li>
          <li>
            Reviewing imported plans, summaries, clinician packs, and other exports before relying
            on or sharing them.
          </li>
          <li>Keeping any exported backup files and clinician pack PDFs safe.</li>
          <li>Keeping your backup passphrase safe.</li>
        </ul>
        <p>RehabPath does not provide cloud sync, account recovery, or server-side backup recovery.</p>
      </Section>

      <Section title="Optional AI-assisted features">
        <p>RehabPath may include optional AI-assisted features, including:</p>
        <ul>
          <li>Importing a custom rehabilitation plan from a selectable-text PDF.</li>
          <li>Generating a summary for a clinician progress pack.</li>
        </ul>
        <p>
          These features require an internet connection and send limited, client-redacted,
          user-reviewed information to RehabPath's AI gateway and OpenAI for processing. They are
          optional and are not required for core app use.
        </p>
        <p>You understand and agree that:</p>
        <ul>
          <li>AI-assisted outputs may be incomplete, inaccurate, misread, or inappropriate for your circumstances.</li>
          <li>
            PDF import can structure information incorrectly, including exercise names, sets, reps,
            frequencies, weights, safety notes, phases, or milestones.
          </li>
          <li>
            AI-generated clinician summaries may omit context, overstate patterns, or describe
            app-entered data incorrectly.
          </li>
          <li>
            You must review and edit AI-assisted outputs before saving, following, relying on, or
            sharing them.
          </li>
          <li>
            RehabPath does not guarantee that personal details will be detected or removed
            automatically. Names in particular may not be detected automatically.
          </li>
          <li>
            You should not submit emergency, urgent, highly sensitive, or unreviewed personal
            information through the AI features.
          </li>
        </ul>
        <p>
          AI-assisted features do not create a clinician-patient relationship, do not replace a
          qualified clinician, and do not provide medical advice, diagnosis, treatment, clinical
          decision support, or emergency support.
        </p>
      </Section>

      <Section title="Custom plans and imported content">
        <p>
          If you enter or import a custom plan, you are responsible for checking that the plan
          accurately reflects instructions from your clinician or another appropriate source before
          using it.
        </p>
        <p>
          RehabPath may help structure a plan for tracking purposes, but it does not validate that a
          plan is safe, clinically appropriate, complete, or suitable for you.
        </p>
      </Section>

      <Section title="Clinician progress packs">
        <p>RehabPath may let you create a clinician progress pack PDF from app data.</p>
        <p>You understand and agree that:</p>
        <ul>
          <li>Clinician packs are patient-generated from self-logged app data.</li>
          <li>Clinician packs are intended to support discussion with a qualified clinician.</li>
          <li>
            Clinician packs are not a clinical record, diagnosis, medical device output, or
            treatment recommendation.
          </li>
          <li>You choose which sections to include and where to save or share the PDF.</li>
          <li>You are responsible for reviewing the PDF before sharing it.</li>
          <li>RehabPath does not automatically send clinician packs to clinicians or other recipients.</li>
        </ul>
      </Section>

      <Section title="Encrypted backups and passphrases">
        <p>
          If you create an encrypted backup, the backup is encrypted on your device using the
          passphrase you provide.
        </p>
        <p>You understand and agree that:</p>
        <ul>
          <li>RehabPath does not know or store your passphrase.</li>
          <li>RehabPath cannot recover a lost passphrase.</li>
          <li>If you lose your passphrase, restore is impossible.</li>
          <li>If you delete or lose an exported backup file, RehabPath cannot recover it.</li>
          <li>Restoring from a backup replaces current local app data with the backup data.</li>
        </ul>
      </Section>

      <Section title="Local reminders">
        <p>
          RehabPath may let you schedule local reminders. Reminders are informational only and are
          not medical instructions. You remain responsible for deciding whether to perform any
          activity.
        </p>
      </Section>

      <Section title="App updates">
        <p>
          RehabPath may receive app updates through app stores or Expo EAS Update. Updates may add,
          change, or remove app features, fix bugs, improve compatibility, or update privacy and
          safety flows.
        </p>
        <p>
          Some changes require a new app store build. Other changes may be delivered as over-the-air
          app updates. RehabPath's over-the-air updates are intended for compatible app code, user
          interface, copy, and other non-native changes.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>Use RehabPath in a way that violates applicable law.</li>
          <li>
            Attempt to reverse engineer, tamper with, overload, bypass usage limits, or disrupt the
            app or its optional AI gateway except where allowed by law.
          </li>
          <li>Misrepresent RehabPath as a medical device or clinical service.</li>
          <li>Use RehabPath as a substitute for professional medical judgment.</li>
          <li>Use RehabPath to provide emergency care or time-critical medical decisions.</li>
          <li>
            Submit content through AI-assisted features that you do not have the right to use or
            that you have not reviewed for personal or sensitive information.
          </li>
        </ul>
      </Section>

      <Section title="Intellectual property">
        <p>
          RehabPath, including its app design, text, logos, structure, and software, is owned by its
          developer or licensors and is protected by applicable intellectual property laws.
        </p>
        <p>
          These Terms give you a personal, limited, non-transferable right to use the app on devices
          you own or control, subject to these Terms and the applicable app store rules.
        </p>
      </Section>

      <Section title="Third-party platforms and services">
        <p>
          Your use of RehabPath may also be subject to rules from Apple, Google, your device
          operating system, Firebase, OpenAI, Expo, and any storage, messaging, email, or sharing
          provider you choose for exported backup files or clinician pack PDFs.
        </p>
        <p>
          Apple and Google are not responsible for RehabPath's content, support, or maintenance,
          except where their own app store rules say otherwise. If you downloaded the app from
          Apple's App Store or Google Play, the applicable store terms also apply.
        </p>
      </Section>

      <Section title="No warranty">
        <p>
          RehabPath is provided "as is" and "as available." To the maximum extent permitted by law,
          we do not promise that:
        </p>
        <ul>
          <li>The app will be error-free or uninterrupted.</li>
          <li>
            Any data entry, reminder, chart, backup, restore, import, export, AI-assisted feature,
            clinician pack, or update will always work without issue.
          </li>
          <li>AI-assisted outputs will be accurate, complete, safe, suitable, or free of personal information.</li>
          <li>The app will meet your medical, clinical, or personal needs.</li>
          <li>The app will prevent injury, illness, deterioration, or other harm.</li>
        </ul>
        <p>Nothing in these Terms limits rights that cannot be limited under applicable consumer law.</p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, RehabPath's developer is not liable for indirect,
          incidental, special, consequential, exemplary, or punitive damages, or for loss of data,
          loss of backup files, loss of clinician pack PDFs, loss of passphrases, device issues,
          health-related decisions, reliance on app content, or reliance on AI-assisted outputs.
        </p>
        <p>Where liability cannot be excluded, it is limited to the maximum extent permitted by law.</p>
      </Section>

      <Section title="Changes to the app or terms">
        <p>
          We may update the app and these Terms from time to time. If the Terms change materially,
          the updated Terms should be made available with a new effective date.
        </p>
        <p>Your continued use of RehabPath after updated Terms are made available means you accept the updated Terms.</p>
      </Section>

      <Section title="Ending use">
        <p>
          You may stop using RehabPath at any time. You can delete local app data through app
          settings or by uninstalling the app. Exported backup files, clinician pack PDFs, and other
          files saved outside the app must be deleted separately from wherever you saved or shared
          them.
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          These Terms are governed by the laws of England and Wales, except where local consumer
          protection laws require otherwise.
        </p>
      </Section>

      <Section title="Contact">
        <ContactBlock terms />
        <LegalLinks />
      </Section>
    </RehabPathLegalPage>
  );
}
