export const metadata = {
  title: 'Dialled MTB — Terms of Use',
  description: 'Dialled MTB terms of use.',
};

export default function PolicyPage() {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:       #ffffff;
      --surface:  #f7f8fa;
      --border:   #e2e8f0;
      --text:     #1a1c1e;
      --muted:    #4a5568;
      --accent:   #1a5c1a;
      --accent-l: #e8f4e8;
      --link:     #1a5c1a;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      font-size: 16px;
    }

    nav {
      border-bottom: 1px solid var(--border);
      padding: 0 24px;
      display: flex;
      align-items: center;
      height: 56px;
      gap: 12px;
    }
    .nav-mark {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .nav-wordmark {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: var(--text);
    }
    .nav-wordmark span { color: #b8cc00; }
    nav .divider { width: 1px; height: 20px; background: var(--border); margin: 0 4px; }
    nav a.nav-link { font-size: 13px; color: var(--muted); text-decoration: none; }
    nav a.nav-link:hover { color: var(--accent); }

    .hero {
      background: #1a1c1e;
      padding: 48px 24px 40px;
      text-align: center;
    }
    .hero h1 {
      font-size: clamp(22px, 4vw, 32px);
      font-weight: 800;
      color: #e8ecf0;
      letter-spacing: 0.02em;
    }
    .hero .meta {
      margin-top: 10px;
      font-size: 13px;
      color: #6a7680;
      letter-spacing: 0.04em;
    }

    .summary {
      max-width: 740px;
      margin: 32px auto 0;
      padding: 0 24px;
    }
    .summary-box {
      background: var(--accent-l);
      border-left: 4px solid var(--accent);
      border-radius: 0 8px 8px 0;
      padding: 18px 20px;
    }
    .summary-box strong {
      display: block;
      font-size: 13px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 8px;
    }
    .summary-box p { font-size: 15px; color: var(--muted); line-height: 1.65; }

    .content {
      max-width: 740px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }

    h2 {
      font-size: 19px;
      font-weight: 700;
      color: var(--text);
      margin-top: 48px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--accent);
    }
    h3 {
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
      margin-top: 24px;
      margin-bottom: 8px;
    }
    p { color: var(--muted); margin-bottom: 14px; }
    ul {
      list-style: none;
      margin: 10px 0 16px 0;
      padding: 0;
    }
    ul li {
      position: relative;
      padding-left: 18px;
      color: var(--muted);
      margin-bottom: 6px;
      font-size: 15px;
    }
    ul li::before {
      content: "·";
      position: absolute;
      left: 4px;
      color: var(--accent);
      font-weight: 700;
    }
    a { color: var(--link); }
    strong { color: var(--text); font-weight: 600; }

    .warning-box {
      background: #fff8e1;
      border-left: 4px solid #f59e0b;
      border-radius: 0 8px 8px 0;
      padding: 14px 18px;
      margin: 16px 0;
    }
    .warning-box p { margin: 0; font-size: 14px; color: #78450a; }

    .contact-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px 24px;
      margin-top: 12px;
    }
    .contact-box p { margin: 4px 0; font-size: 15px; }

    footer {
      border-top: 1px solid var(--border);
      padding: 24px;
      text-align: center;
      font-size: 13px;
      color: #9ca3af;
    }
    footer a { color: #9ca3af; text-decoration: none; }
    footer a:hover { color: var(--accent); }
  </style>\n

  <nav>
    <a class="nav-mark" href="/apps/dialled-mtb">
      <svg width="28" height="28" viewBox="0 0 60 60" fill="none">
        <polygon points="30,7 54,51 6,51" stroke="#e8ecf0" stroke-width="2.2" fill="none" stroke-linejoin="round"/>
        <polygon points="30,20 42,42 18,42" fill="#e8ff47" opacity="0.95"/>
        <circle cx="30" cy="7" r="2.5" fill="#f2ff8a"/>
      </svg>
      <span class="nav-wordmark"><span>D</span>IALLED MTB</span>
    </a>
    <div class="divider"></div>
    <a class="nav-link" href="/apps/dialled-mtb">Home</a>
  </nav>

  <div class="hero">
    <h1>Terms of Use</h1>
    <p class="meta">Last updated: March 2026 &nbsp;·&nbsp; Applies to: Dialled MTB Android app, v0.1 and later</p>
  </div>

  <div class="summary">
    <div class="summary-box">
      <strong>The short version</strong>
      <p>Dialled is free to use. It helps you track bike maintenance, log rides, and get setup advice. The AI Advisor gives general guidance — it is not a substitute for a professional mechanic. Ride safely. Don't misuse the service. These terms are governed by the laws of England and Wales.</p>
    </div>
  </div>

  <div class="content">

    <h2>1. About Dialled MTB</h2>
    <p>Dialled MTB is a mountain bike maintenance tracking and setup application provided by <strong>Arcturus Digital Consulting</strong>, registered in England and Wales. The app helps riders track service intervals, log rides, calculate suspension and tyre setup, and get AI-assisted maintenance advice.</p>
    <p>By downloading or using Dialled MTB, you agree to these terms. If you do not agree, please do not use the app.</p>

    <h2>2. Using Dialled MTB</h2>

    <h3>What Dialled is for</h3>
    <p>Dialled MTB is for personal, non-commercial use. You may use it to:</p>
    <ul>
      <li>Track maintenance and service intervals for your own bikes</li>
      <li>Log rides manually or via Strava integration</li>
      <li>Calculate suspension PSI, sag, and tyre pressure for your setup</li>
      <li>Ask the AI Advisor general maintenance and setup questions</li>
    </ul>

    <h3>What Dialled is not</h3>
    <p>Dialled MTB is not a substitute for professional mechanical inspection or advice. Recommendations produced by the app — including suspension PSI values, sag targets, and tyre pressures — are starting points based on general guidelines. They are not tailored to your specific components and should be verified against manufacturer documentation.</p>

    <div class="warning-box">
      <p><strong>Safety:</strong> Always check your bike is mechanically safe before riding, regardless of what the app shows. A maintenance tracker does not replace a physical inspection. If you are unsure, consult a qualified bicycle mechanic.</p>
    </div>

    <h3>Emergency situations</h3>
    <p>Dialled MTB is not an emergency service. If you or someone else is in danger on or off the trail, call 999 (UK) or your local emergency number immediately.</p>

    <h2>3. Account and access</h2>
    <p>Dialled MTB requires a Google account to sign in. You are responsible for maintaining the security of your Google account. We are not liable for any loss or damage resulting from unauthorised access to your account.</p>
    <p>We reserve the right to suspend or terminate accounts that violate these terms, misuse the service, or engage in behaviour that harms other users or the integrity of the app.</p>

    <h2>4. Strava integration</h2>
    <p>Connecting your Strava account is optional. If you connect Strava, you grant Dialled MTB read-only access to your mountain bike activity data for the purpose of updating your maintenance counters. We do not post to Strava, modify your activities, or access data beyond what is described in the Privacy Policy.</p>
    <p>You can disconnect Strava at any time in Settings. Disconnecting immediately revokes our read access. Previously synced ride counts are retained in your maintenance records unless you choose to delete them.</p>

    <h2>5. AI Advisor — acceptable use</h2>
    <p>The AI Advisor uses OpenAI's API to generate responses to your maintenance and setup questions. You agree not to use the AI Advisor to:</p>
    <ul>
      <li>Attempt to bypass, manipulate, or jailbreak the AI system</li>
      <li>Generate harmful, abusive, or illegal content</li>
      <li>Submit personal data of third parties without their knowledge</li>
      <li>Use the feature for commercial, resale, or automated purposes</li>
    </ul>

    <h3>Accuracy of AI responses</h3>
    <p>AI Advisor responses are generated automatically and may sometimes be inaccurate, incomplete, or out of date. Always cross-reference important advice against your component manufacturer's documentation. We accept no liability for decisions made solely on the basis of AI Advisor output.</p>

    <p>Usage of the AI Advisor may be subject to rate limits to ensure fair access for all users. Limits are displayed in the app.</p>

    <h2>6. Your content</h2>
    <p>Bike profiles, maintenance records, and ride logs you create remain yours. We do not claim ownership of your data. By using the app, you grant us a limited licence to store and process this data solely to provide the service to you.</p>
    <p>Questions you send to the AI Advisor are processed by OpenAI as described in the <a href="/apps/dialled-mtb/privacy-policy">Privacy Policy</a>. We do not claim ownership of your questions or the generated replies.</p>

    <h2>7. Intellectual property</h2>
    <p>The Dialled MTB name, logo, mountain mark, and app design are owned by Arcturus Digital Consulting. You may not reproduce, modify, or redistribute any part of the app or its branding without our written permission.</p>
    <p>The 30-bike catalogue included in the app contains publicly available product information. Brand names and model names remain the property of their respective manufacturers. Dialled MTB has no commercial relationship with any bike brand listed.</p>

    <h2>8. Availability and updates</h2>
    <p>We aim to keep Dialled MTB reliable and available, but we cannot guarantee uninterrupted service. AI Advisor functionality depends on OpenAI availability. Strava integration depends on the Strava API remaining accessible under its current terms.</p>
    <p>We may update Dialled MTB to add features, fix issues, or comply with platform requirements. We may also update these terms and will provide in-app notice for material changes. Continued use of the app after a change constitutes acceptance of the updated terms.</p>

    <h2>9. Limitation of liability</h2>
    <p>To the extent permitted by law, Arcturus Digital Consulting is not liable for any indirect, incidental, or consequential loss or damage arising from your use of Dialled MTB, including but not limited to:</p>
    <ul>
      <li>Mechanical failure of a bike that was serviced or not serviced based on app recommendations</li>
      <li>Inaccurate PSI, sag, or tyre pressure outputs applied without independent verification</li>
      <li>Loss of ride data or maintenance records due to account deletion or technical failure</li>
      <li>Interruption of the Strava integration or AI Advisor service</li>
    </ul>
    <p>Nothing in these terms limits liability for death or personal injury caused by negligence, fraud, or any other matter that cannot be excluded by law.</p>

    <h2>10. Governing law</h2>
    <p>These terms are governed by the laws of England and Wales. Any disputes arising from your use of Dialled MTB are subject to the non-exclusive jurisdiction of the courts of England and Wales.</p>

    <h2>11. Contact</h2>
    <p>Questions about these terms?</p>
    <div class="contact-box">
      <p><strong>Email:</strong> <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a></p>
      <p><strong>Web:</strong> <a href="/apps/dialled-mtb/terms-of-use">dialledmtb.co.uk/terms-of-use</a></p>
    </div>

    <p style="margin-top: 32px; font-size: 14px; font-style: italic; color: #9ca3af;">These terms are written in plain English. If something is not clear, please contact us and we will explain.</p>

  </div>

  <footer>
    <p>© 2026 Arcturus Digital Consulting &nbsp;·&nbsp;
      <a href="/apps/dialled-mtb/privacy-policy">Privacy</a> &nbsp;·&nbsp;
      <a href="/apps/dialled-mtb/terms-of-use">Terms</a>
    </p>
  </footer>

`,
      }}
    />
  );
}
