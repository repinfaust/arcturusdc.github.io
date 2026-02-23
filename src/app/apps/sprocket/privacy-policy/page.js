export const metadata = {
  title: 'Sprocket: Calm Phone Helper - Privacy Policy',
  description: 'Sprocket: Calm Phone Helper privacy policy for the iOS app.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="prose prose-neutral mx-auto px-4 md:px-6 lg:px-8 py-8">
      <h1>Sprocket: Calm Phone Helper Privacy Policy</h1>
      <p><strong>Last updated:</strong> February 2026</p>
      <p><strong>Applies to:</strong> Sprocket: Calm Phone Helper iOS app, version 1.0.0 and later</p>

      <h2>The short version</h2>
      <p>
        Sprocket: Calm Phone Helper saves as little as possible. What you ask it to remember stays on your phone,
        and is backed up to our UK servers if you sign in. Your questions go to an AI service
        to get answers. We count how often features are used, not what you say or type.
      </p>

      <h2>1. What Sprocket: Calm Phone Helper does with what you say</h2>
      <p>
        When you ask Sprocket: Calm Phone Helper a question, by voice or by typing, your words are sent to
        <strong> OpenAI&apos;s AI service</strong> to generate a helpful reply.
      </p>
      <p>
        This is necessary for Sprocket: Calm Phone Helper to work. Without sending your question to OpenAI,
        Sprocket: Calm Phone Helper cannot answer you.
      </p>
      <p><strong>What OpenAI receives:</strong></p>
      <ul>
        <li>The text of your question or request (after any voice transcription)</li>
        <li>The mode you are using (for example: general question, tech help, untangle a message)</li>
        <li>A small amount of context from things you previously asked Sprocket: Calm Phone Helper to remember, only if relevant</li>
      </ul>
      <p><strong>What OpenAI does not receive:</strong></p>
      <ul>
        <li>Your name</li>
        <li>Your phone number or email</li>
        <li>Your location</li>
        <li>Your Apple ID or account information</li>
      </ul>
      <p>
        We have configured OpenAI API access to opt out of data use for model training where this option is available.
        For details, see{' '}
        <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer">
          https://openai.com/privacy
        </a>
        .
      </p>
      <p>Your messages travel securely via our server relay and are never sent directly from your phone to OpenAI.</p>

      <h2>2. Untangle a message - how this works</h2>
      <p>When you use the Untangle feature to paste a letter or message, the text is:</p>
      <ul>
        <li>Held temporarily in app memory while we analyse it</li>
        <li>Sent to OpenAI to generate a plain-English interpretation</li>
        <li>Discarded when you leave the screen or close the app</li>
      </ul>
      <p>
        The original text is <strong>never stored</strong> on your phone or anywhere else unless you
        explicitly tap &quot;Save summary.&quot; If you save a summary, only the plain-English interpretation is
        saved, not the original text.
      </p>
      <p>
        If pasted text contains sensitive information, for example a 6-digit code, a bank card number,
        or a National Insurance number, Sprocket: Calm Phone Helper warns you before processing. Saving is disabled until
        you confirm how you want to proceed.
      </p>

      <h2>3. How Sprocket: Calm Phone Helper protects sensitive information</h2>
      <p>
        Sprocket: Calm Phone Helper is designed to detect likely sensitive details and warn you before anything is sent or saved.
        This is a safety assist, not a guarantee that every sensitive detail will be caught.
      </p>
      <p><strong>What Sprocket: Calm Phone Helper looks for:</strong></p>
      <ul>
        <li>6-digit codes (such as one-time passcodes)</li>
        <li>Bank card numbers (13-19 digit sequences)</li>
        <li>UK National Insurance number patterns</li>
        <li>Phrases that suggest a password is being shared (for example: &quot;my password is...&quot;)</li>
      </ul>
      <p><strong>What happens when something is detected:</strong></p>
      <ul>
        <li>You see a clear warning before anything is sent to OpenAI</li>
        <li>Saving is disabled until you choose how to proceed</li>
        <li>You can continue without saving, or clear the input and start again</li>
        <li>Sprocket: Calm Phone Helper will never store a detected sensitive string in your notes</li>
      </ul>
      <p>
        This is designed for common accidental mistakes. It is not designed to detect every format
        of every type of sensitive data, and should not be relied on as a security tool.
      </p>

      <h2>4. What Sprocket: Calm Phone Helper stores and where</h2>
      <p><strong>On your phone only:</strong></p>
      <ul>
        <li>Your settings and preferences</li>
        <li>Your consent choices</li>
        <li>Any memory records marked as sensitive (these are intentionally never sent anywhere)</li>
      </ul>
      <p><strong>On your phone and securely backed up to our UK servers:</strong></p>
      <ul>
        <li>Notes you asked Sprocket: Calm Phone Helper to remember (except sensitive ones)</li>
        <li>Reminders you set</li>
      </ul>
      <p>
        Backed-up data is stored on Google Firebase servers located in the United Kingdom (London).
        It is used to restore your notes and reminders if you sign in on a new device. If you use
        Sprocket: Calm Phone Helper without signing in, this data stays on your device only.
      </p>
      <p><strong>On our UK servers only (not your phone):</strong></p>
      <ul>
        <li>An anonymous identifier so we can manage your usage limits</li>
        <li>A count of how many questions you&apos;ve asked</li>
        <li>Whether you&apos;ve purchased Sprocket Unlock</li>
        <li>Rate limiting records to prevent abuse</li>
      </ul>
      <p>
        Free access limits are different by account status: anonymous users get 3 free questions,
        and signed-in users get 20 free questions.
      </p>
      <p>
        <strong>To delete everything:</strong><br />
        Go to Settings -&gt; Clear My Data. This permanently removes all notes, reminders, and local data.
        Server-side usage counters and entitlement records are retained to prevent abuse of the free tier.
        If you want server-side counters or entitlement records deleted, contact{' '}
        <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a> or visit{' '}
        <a href="https://www.arcturusdc.com/apps/sprocket/privacy-policy" target="_blank" rel="noopener noreferrer">
          https://www.arcturusdc.com/apps/sprocket/privacy-policy
        </a>.
      </p>

      <h2>5. What we measure</h2>
      <p>Sprocket: Calm Phone Helper uses <strong>Firebase Analytics</strong> (Google) to count how often features are used.</p>
      <p><strong>What Firebase receives:</strong></p>
      <ul>
        <li>Anonymous counts of feature use (for example: voice button tapped, reminder created)</li>
        <li>Which playbooks are completed</li>
        <li>App session counts</li>
      </ul>
      <p><strong>What Firebase does not receive:</strong></p>
      <ul>
        <li>Anything you said or typed</li>
        <li>Your name, email, or contact details</li>
        <li>Any note or reminder content</li>
      </ul>
      <p>
        This data is anonymous and used to improve the app. Analytics are off by default until you give consent.
        You can withdraw consent at any time in Settings -&gt; Privacy -&gt; Usage data.
      </p>

      <h2>6. Payment and Sprocket Unlock</h2>
      <p>
        If you purchase Sprocket Unlock, payment is handled entirely by Apple through the App Store.
        We do not receive or store your payment card details. Sprocket Unlock is a one-time purchase
        with no subscriptions and no recurring charges.
      </p>

      <h2>7. Children</h2>
      <p>
        Sprocket: Calm Phone Helper is designed for adults. We do not knowingly collect data from children under 13.
        If you believe a child is using the app and have a concern, contact us.
      </p>

      <h2>8. Changes to this policy</h2>
      <p>
        If we make material changes to how Sprocket: Calm Phone Helper handles data, we will notify users in-app and update this policy.
        Minor clarifications may be made without notice.
      </p>

      <h2>9. Contact us</h2>
      <p>
        Questions about privacy?<br />
        <strong>Email:</strong> <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a><br />
        <strong>Web:</strong> <a href="https://www.arcturusdc.com/apps/sprocket/privacy-policy" target="_blank" rel="noopener noreferrer">https://www.arcturusdc.com/apps/sprocket/privacy-policy</a>
      </p>

      <h2>10. Your rights (UK / GDPR)</h2>
      <p>If you are in the UK or EU, you have rights under data protection law, including:</p>
      <ul>
        <li>The right to know what data we hold about you</li>
        <li>The right to have your data deleted</li>
        <li>The right to object to data processing</li>
      </ul>
      <p>
        Because Sprocket: Calm Phone Helper stores almost all data locally and does not require an account,
        most rights can be exercised directly in-app via Settings -&gt; Clear My Data.
      </p>
      <p>
        For data processed by OpenAI on our behalf, we are the data controller.
        Contact <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a> with any requests.
      </p>

      <h2>11. Where your data is held</h2>
      <p>
        All Sprocket: Calm Phone Helper server data, including backed-up notes, reminders, usage counters, and entitlement
        records, is stored on Google Firebase servers located in the United Kingdom (London, europe-west2 region).
        No Sprocket: Calm Phone Helper user data is transferred outside the UK for storage or processing, with the exception
        of questions you send to OpenAI as described in section 1.
      </p>

      <p>
        <em>
          This policy is available in plain English. If any part is unclear, contact us and we will explain.
        </em>
      </p>
    </main>
  );
}
