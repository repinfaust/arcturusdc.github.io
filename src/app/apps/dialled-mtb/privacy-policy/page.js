export const metadata = {
  title: 'Dialled MTB — Privacy Policy',
  description: 'Dialled MTB privacy policy.',
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

    /* ── NAV ── */
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
    .nav-mark svg { flex-shrink: 0; }
    .nav-wordmark {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: var(--text);
    }
    .nav-wordmark span { color: #b8cc00; }
    nav .divider { width: 1px; height: 20px; background: var(--border); margin: 0 4px; }
    nav a.nav-link {
      font-size: 13px;
      color: var(--muted);
      text-decoration: none;
    }
    nav a.nav-link:hover { color: var(--accent); }

    /* ── HERO ── */
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

    /* ── SUMMARY BOX ── */
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
    .summary-box p {
      font-size: 15px;
      color: var(--muted);
      line-height: 1.65;
    }

    /* ── CONTENT ── */
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

    .contact-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px 24px;
      margin-top: 12px;
    }
    .contact-box p { margin: 4px 0; font-size: 15px; }

    /* ── FOOTER ── */
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
    <h1>Privacy Policy</h1>
    <p class="meta">Last updated: March 2026 &nbsp;·&nbsp; Applies to: Dialled MTB Android app, v0.1 and later</p>
  </div>

  <div class="summary">
    <div class="summary-box">
      <strong>The short version</strong>
      <p>Dialled collects only what it needs to track your bike maintenance and rides. Your ride data comes from Strava if you connect it — we only read it, we never post on your behalf. AI advisor questions are sent to OpenAI to generate replies. We count feature usage anonymously. We do not sell your data.</p>
    </div>
  </div>

  <div class="content">

    <h2>1. Who we are</h2>
    <p>Dialled MTB is provided by Arcturus Digital Consulting, registered in England and Wales. Questions about this policy can be directed to <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a>.</p>

    <h2>2. What data we collect and why</h2>

    <h3>Account information</h3>
    <p>When you sign in with Google, we receive your name, email address, and a Google user identifier. This is used solely to identify your account and keep your data consistent across devices. We do not receive your Google password.</p>

    <h3>Bike profiles</h3>
    <p>Bike details you enter (brand, model, type, wheel size, travel, riding style) are stored in your account so the maintenance tracker and setup calculator can work correctly. This data stays in your account and is not shared.</p>

    <h3>Ride data (Strava)</h3>
    <p>If you connect your Strava account, we request read-only access to your activity data. Specifically:</p>
    <ul>
      <li>Activity type (we only process rides tagged as MountainBikeRide)</li>
      <li>Distance, duration, and date of qualifying rides</li>
      <li>Activity name (stored for display in your ride log)</li>
    </ul>
    <p><strong>We never post to Strava on your behalf.</strong> We never read heart rate, power, GPS route data, or any data beyond what is listed above. You can disconnect Strava at any time in Settings, which revokes our access immediately.</p>

    <h3>Maintenance records</h3>
    <p>Service task completions, notes you add, and maintenance history are stored in your account. This data is yours — it is not analysed, shared, or used for any purpose other than powering your maintenance tracker.</p>

    <h3>AI Advisor questions</h3>
    <p>When you use the AI Advisor, your question is sent to <strong>OpenAI's API</strong> along with context about your bike (model, ride count, overdue tasks). This is necessary for the feature to work.</p>
    <p><strong>What OpenAI receives:</strong></p>
    <ul>
      <li>The text of your question</li>
      <li>Your bike type, ride count, and overdue task list</li>
    </ul>
    <p><strong>What OpenAI does not receive:</strong></p>
    <ul>
      <li>Your name, email, or Google account details</li>
      <li>Your location</li>
      <li>Your Strava account or full ride history</li>
    </ul>
    <p>We have configured OpenAI API access to opt out of data use for model training where this option is available. See <a href="https://openai.com/privacy" target="_blank">openai.com/privacy</a> for details. AI Advisor conversation history is session-only and is not stored after you close the screen.</p>

    <h3>Usage analytics</h3>
    <p>We use <strong>Firebase Analytics</strong> (Google) to count how often features are used — for example, how many times the maintenance tracker is opened, or how many rides are logged. This data is anonymous and contains no personal information, message content, or identifiable details. It is used solely to understand which features are valuable and improve the app.</p>

    <h2>3. Where your data is stored</h2>
    <p>Your account data, bike profiles, ride records, and maintenance history are stored on <strong>Google Firebase / Firestore</strong> servers. We use the <strong>europe-west2 (London)</strong> region, meaning your data is held in the United Kingdom.</p>
    <p>The exception is questions sent to the AI Advisor, which are processed by OpenAI on servers outside the UK. No personal identifying information is included in these requests as described in section 2.</p>

    <h2>4. How long we keep your data</h2>
    <p>Your data is kept for as long as your account is active. If you delete your account (via Settings → Delete Account), all bike profiles, ride records, and maintenance history are permanently deleted within 30 days. Firebase Analytics data is anonymised and cannot be attributed to a deleted account.</p>

    <h2>5. Third-party services</h2>
    <ul>
      <li><strong>Google Firebase</strong> — authentication, database, analytics. <a href="https://firebase.google.com/support/privacy" target="_blank">Firebase Privacy</a></li>
      <li><strong>Strava</strong> — optional ride data integration. <a href="https://www.strava.com/legal/privacy" target="_blank">Strava Privacy Policy</a></li>
      <li><strong>OpenAI</strong> — AI Advisor responses. <a href="https://openai.com/privacy" target="_blank">OpenAI Privacy Policy</a></li>
    </ul>

    <h2>6. Children</h2>
    <p>Dialled MTB is intended for users aged 13 and over. We do not knowingly collect data from children under 13. If you believe a child has created an account, please contact us and we will delete it.</p>

    <h2>7. Your rights (UK / GDPR)</h2>
    <p>If you are in the UK or EU, you have rights under data protection law, including:</p>
    <ul>
      <li>The right to access the data we hold about you</li>
      <li>The right to have your data corrected or deleted</li>
      <li>The right to object to or restrict processing</li>
      <li>The right to data portability</li>
    </ul>
    <p>Most of these rights can be exercised directly in the app via Settings. For requests relating to data processed by OpenAI or Strava on our behalf, contact us and we will assist.</p>

    <h2>8. Changes to this policy</h2>
    <p>If we make material changes to how Dialled handles your data, we will notify you in-app and update this policy. The date at the top of this page will always reflect the most recent revision.</p>

    <h2>9. Contact us</h2>
    <div class="contact-box">
      <p><strong>Email:</strong> <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a></p>
      <p><strong>Web:</strong> <a href="/apps/dialled-mtb/privacy-policy">dialledmtb.co.uk/privacy-policy</a></p>
    </div>

    <p style="margin-top: 32px; font-size: 14px; font-style: italic; color: #9ca3af;">This policy is written in plain English. If any part is unclear, contact us and we will explain.</p>

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
