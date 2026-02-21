export const metadata = {
  title: 'Sprocket - Privacy Policy',
  description: 'Sprocket privacy policy for the iOS app.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="prose prose-neutral mx-auto px-4 md:px-6 lg:px-8 py-8">
      <h1>Sprocket Privacy Policy</h1>
      <p><strong>Last updated:</strong> February 2026</p>
      <p><strong>Applies to:</strong> Sprocket iOS app, version 1.0.0 and later</p>

      <h2>The short version</h2>
      <p>
        Sprocket saves as little as possible. What you ask it to remember stays on your phone.
        Your questions go to an AI service to get answers. We count how often features are used,
        not what you say or type.
      </p>

      <h2>1. What Sprocket does with what you say</h2>
      <p>
        When you ask Sprocket a question, by voice or by typing, your words are sent to
        <strong> OpenAI&apos;s AI service</strong> to generate a reply. This is required for Sprocket
        to work.
      </p>
      <p><strong>What OpenAI receives:</strong></p>
      <ul>
        <li>The text of your question or request (after voice transcription)</li>
        <li>The mode you are using (for example: general question, tech help, untangle a message)</li>
        <li>A small amount of relevant context from things you previously asked Sprocket to remember</li>
      </ul>
      <p><strong>What OpenAI does not receive:</strong></p>
      <ul>
        <li>Your name</li>
        <li>Your phone number or email</li>
        <li>Your location</li>
        <li>Your Apple ID or account information</li>
      </ul>
      <p>
        We configure OpenAI API usage to opt out of data use for model training where available.
        For details, see{' '}
        <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer">
          OpenAI&apos;s privacy policy
        </a>
        .
      </p>
      <p>Your messages travel securely via our server relay, not directly from your phone to OpenAI.</p>

      <h2>2. Untangle a message - how this works</h2>
      <p>When you use Untangle to paste a letter or message, the text is:</p>
      <ul>
        <li>Held temporarily in app memory while analysed</li>
        <li>Sent to OpenAI to generate a plain-English interpretation</li>
        <li>Discarded when you leave the screen or close the app</li>
      </ul>
      <p>
        The original text is <strong>never stored</strong> unless you explicitly tap
        &quot;Save summary.&quot; If saved, only the interpretation is stored, not the original text.
      </p>
      <p>
        If pasted text contains likely sensitive information, for example a 6-digit code, card number,
        or National Insurance number, Sprocket warns you before processing. Saving is disabled until you
        confirm how to proceed.
      </p>

      <h2>3. What we measure</h2>
      <p>
        Sprocket uses <strong>Firebase Analytics</strong> (Google) to count feature usage.
      </p>
      <p><strong>What Firebase receives:</strong></p>
      <ul>
        <li>Anonymous feature-use counts (for example: voice button tapped, reminder created)</li>
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
        You can disable this in Settings -&gt; Privacy -&gt; Usage data. Collection stops immediately.
      </p>

      <h2>4. What stays on your phone</h2>
      <p>The following is stored only on your iPhone in local storage:</p>
      <ul>
        <li>Notes you asked Sprocket to remember</li>
        <li>Reminders you set</li>
        <li>Your settings and preferences</li>
        <li>Your consent choices</li>
      </ul>
      <p>
        None of this is sent to our servers, backed up to cloud by us, or accessible to us.
        If you lose your phone or delete the app, this data is gone.
      </p>
      <p>
        To delete everything, use Settings -&gt; Clear My Data. This is permanent and cannot be undone.
      </p>

      <h2>5. Subscription and payment</h2>
      <p>
        If you subscribe to Sprocket Plus, payments are handled by Apple via the App Store.
        We do not receive or store payment card details.
      </p>

      <h2>6. Children</h2>
      <p>
        Sprocket is designed for adults. We do not knowingly collect data from children under 13.
        If you believe a child is using the app and have a concern, contact us below.
      </p>

      <h2>7. Changes to this policy</h2>
      <p>
        If we make material changes to data handling, we will notify users in-app and update this policy.
        Minor clarifications may be made without notice.
      </p>

      <h2>8. Contact us</h2>
      <p>
        Questions about privacy?<br />
        <strong>Email:</strong> <a href="mailto:privacy@sprocket.app">privacy@sprocket.app</a><br />
        <strong>Web:</strong> <a href="https://sprocket.app/privacy" target="_blank" rel="noopener noreferrer">https://sprocket.app/privacy</a>
      </p>

      <h2>9. Your rights (UK / GDPR)</h2>
      <p>If you are in the UK or EU, you have rights under data protection law, including:</p>
      <ul>
        <li>The right to know what data we hold about you</li>
        <li>The right to have your data deleted</li>
        <li>The right to object to data processing</li>
      </ul>
      <p>
        Because Sprocket stores almost all data locally and does not require an account,
        most rights can be exercised directly through Settings -&gt; Clear My Data.
      </p>
      <p>
        For data processed by OpenAI on our behalf, we act as the data controller.
        Contact <a href="mailto:privacy@sprocket.app">privacy@sprocket.app</a> with requests.
      </p>

      <p>
        <em>
          This policy is available in plain English. If anything is unclear, contact us and we will explain.
        </em>
      </p>
    </main>
  );
}
