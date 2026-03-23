import PaygoMagicLinkGate from './_components/PaygoMagicLinkGate';

export default function PaygoWebMirrorPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px 16px',
        background: 'radial-gradient(circle at 12% 18%, #1e293b 0, #0f172a 34%, #020617 68%)',
      }}
    >
      <PaygoMagicLinkGate>
        <section className="paygo-layout">
          <aside className="left-copy card">
            <h2>PAYGO - Demo App</h2>
            <p>
              This app is a product demonstration tool built to explore prepayment energy management concepts across UK, Irish, and
              US markets.
            </p>
            <p>
              All customer profiles, account data, and energy usage shown are entirely fictional. No real customer information,
              payment details, or live energy accounts are used at any point.
            </p>
            <p>This is not a consumer product. No personal data is collected or stored.</p>
            <p className="attribution">Built by David Loake · david.loake@ensek.co.uk</p>
          </aside>

          <div className="phone-column">
            <p className="kicker">PAYGO iOS Mirror</p>
            <div className="phone-shell">
              <div aria-hidden className="phone-notch" />
              <div className="phone-screen">
                <iframe
                  title="PAYGO Web Mirror"
                  src="/apps/stea/paygo/runtime/index.html"
                  style={{ width: '100%', height: '100%', border: 0, background: '#000' }}
                  allow="clipboard-read; clipboard-write"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              </div>
            </div>
          </div>

          <aside className="right-copy card">
            <h2>Six profiles across three regions. Here&apos;s how each is tailored.</h2>
            <details>
              <summary>UK - Ember</summary>
              <p>
                Two profiles, both smart-metered, both GBP. The UK is the most feature-complete region so both profiles can showcase
                the full capability range - the contrast between them is about customer circumstance, not platform capability.
              </p>
              <details>
                <summary>Sarah M. (standard)</summary>
                <p>
                  Sarah M. (standard) is the baseline engaged customer. Comfortable balance (£18.40, ~9 days), auto top-up already
                  configured at £20 when she drops below £10, Visa on file. She demonstrates the set-and-forget model - she never
                  needs to think about energy. Her story is about the platform working invisibly. Smart meter gives her real usage
                  data and the real-time bar on her dashboard.
                </p>
              </details>
              <details>
                <summary>David T. (vulnerable)</summary>
                <p>
                  David T. (vulnerable) is the intervention story. Critically low balance (£4.20, ~2 days), no auto top-up
                  configured, erratic top-up history. Emergency credit available but not yet drawn. Friendly hours active
                  (6am-10am, 4pm-7pm - Ofgem-regulated, UK-only). His profile deliberately activates the features that do not exist
                  in the other markets: vulnerability flag affects UX tone throughout, warm home reminder signposts support schemes,
                  predictive warning banner on the dashboard. He is the profile that makes the compliance and duty-of-care story
                  land.
                </p>
              </details>
            </details>

            <details>
              <summary>Ireland - Solas</summary>
              <p>
                Two profiles, both non-smart - this is the defining constraint for the entire Ireland region.
                <code>smartMeterAvailable: false</code> in the region config cascades through everything: no real-time usage bar, no
                half-hourly data, no auto top-up (excluded at region level), usage graph replaced with estimated consumption view.
                Days remaining is always ~ prefixed to signal it is an estimate. Balance figures are in EUR.
              </p>
              <details>
                <summary>Aoife R. (standard)</summary>
                <p>
                  Aoife R. (standard) demonstrates that a good experience is still possible without smart meters. Comfortable balance
                  (€22.00, ~11 days estimated), scheduled top-up every two weeks (€30), last meter read 8 days ago. She shows the
                  non-smart world at its best - predictable, stable, estimate-based but clear about it. The meter read submission
                  prompt appears on her dashboard but is not urgent.
                </p>
              </details>
              <details>
                <summary>Ciarán B. (debt-risk)</summary>
                <p>
                  Ciarán B. (debt-risk) is the non-smart platform at its most constrained - and most important. Low balance (€7.50,
                  ~3 days estimated), active repayment plan at €5/week, meter read overdue and actively prompting. His profile shows
                  the debt repayment plan screen (A-13), the meter read submission flow (A-14), and demonstrates how the platform
                  maintains structure and dignity for a recovering customer even without real-time data. Emergency credit is available
                  for debt-risk in Ireland (unlike the US). Critically, his days-remaining estimate is flagged as lower confidence
                  because the meter read is overdue - the UI reflects this explicitly.
                </p>
              </details>
            </details>

            <details>
              <summary>USA - Pulse</summary>
              <p>
                Two profiles, both AMI-enabled - the US is the highest feature-ceiling region. TOU pricing is active for both.
                Balance in USD. The US profiles are the most complex in the app because they are the only ones where ecosystem
                features (EV, solar, battery) are live.
              </p>
              <details>
                <summary>Jordan K. (ev-owner)</summary>
                <p>
                  Jordan K. (ev-owner) is the optimisation story. Healthy balance ($41.00, ~14 days), Super Off-Peak TOU active
                  (cheapest rate 12am-6am), EV scheduled to charge 1am-5am to hit that window. His dashboard shows the EV charge
                  status widget and TOU rate indicator alongside the standard balance view. No solar. His story is about the platform
                  actively saving him money on his biggest variable cost - EV charging - without him having to think about it. AMI
                  data gives him a real usage graph and real-time bar.
                </p>
              </details>
              <details>
                <summary>Maya C. (solar-exporter)</summary>
                <p>
                  Maya C. (solar-exporter) is the most complex profile in the app and deliberately so. Net balance of $63.20
                  (~22 days), solar export earning $4.80 today, home battery at 78% set to auto-discharge after 5pm peak, TOU
                  active. Her dashboard shows all four ecosystem widgets: solar export today, battery status, EV (absent - she does
                  not have one, which is a deliberate contrast with Jordan), TOU rate indicator. She represents the prosumer end-state
                  - the platform managing a two-way energy relationship, not just a top-up balance. Her balance figure is explicitly
                  framed as net of export credits, which is a concept that does not exist in the UK or Ireland profiles.
                </p>
              </details>
            </details>

            <details>
              <summary>The cross-cutting decisions</summary>
              <p>
                A few things were deliberately consistent across all six regardless of region: every profile has a payment method on
                file (Visa, last 4 digits only - no real card data). Every profile has a low balance alert threshold set. Every
                profile has a 30-day daily usage history and a 12-transaction payment history in Firestore, so the usage graph and
                payment history screens are never empty. And every profile has a <code>_seed</code> field so it can be reset to its
                original state after a demo session has mutated it.
              </p>
              <p>
                The one thing explicitly excluded everywhere: no real customer data, no real PII, no real meter serial numbers. All
                names, addresses, card details, and meter references are fictional.
              </p>
            </details>
          </aside>
        </section>

        <style jsx>{`
          .paygo-layout {
            width: min(1520px, 100%);
            display: grid;
            grid-template-columns: minmax(260px, 420px) minmax(320px, 390px) minmax(320px, 600px);
            gap: 20px;
            align-items: start;
          }

          .card {
            border: 1px solid rgba(148, 163, 184, 0.35);
            background: linear-gradient(170deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
            box-shadow: 0 24px 60px rgba(2, 6, 23, 0.28);
            border-radius: 20px;
            padding: 18px;
            color: #0f172a;
          }

          .left-copy h2,
          .right-copy h2 {
            margin: 0 0 10px;
            font-size: 22px;
            line-height: 1.2;
          }

          .left-copy p,
          .right-copy p {
            margin: 0 0 10px;
            font-size: 14px;
            line-height: 1.5;
            color: #1e293b;
          }

          .left-copy .attribution {
            margin-top: 16px;
            margin-bottom: 0;
            font-weight: 600;
            color: #0f172a;
          }

          .right-copy {
            max-height: calc(100vh - 72px);
            overflow: auto;
          }

          .right-copy details {
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 10px 12px;
            margin-bottom: 10px;
            background: #fff;
          }

          .right-copy details details {
            margin-top: 8px;
            margin-bottom: 0;
            background: #f8fafc;
          }

          .right-copy summary {
            cursor: pointer;
            font-weight: 700;
            color: #0f172a;
          }

          .kicker {
            margin: 0 0 10px;
            color: #94a3b8;
            font-size: 13px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            text-align: center;
          }

          .phone-column {
            justify-self: center;
          }

          .phone-shell {
            width: min(390px, 94vw);
            aspect-ratio: 390 / 844;
            border-radius: 52px;
            background: linear-gradient(160deg, #0f172a, #0b1326);
            padding: 12px;
            box-shadow: 0 40px 120px rgba(2, 6, 23, 0.75), inset 0 0 0 1px rgba(255, 255, 255, 0.08);
            position: relative;
          }

          .phone-notch {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 130px;
            height: 28px;
            border-radius: 999px;
            background: #020617;
            z-index: 3;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
          }

          .phone-screen {
            width: 100%;
            height: 100%;
            border-radius: 42px;
            overflow: hidden;
            background: #000;
            position: relative;
          }

          @media (max-width: 1080px) {
            .paygo-layout {
              grid-template-columns: 1fr;
              justify-items: center;
            }

            .phone-column {
              order: 1;
            }

            .left-copy {
              order: 2;
              width: min(680px, 96vw);
            }

            .right-copy {
              order: 3;
              width: min(680px, 96vw);
              max-height: none;
            }
          }
        `}</style>
      </PaygoMagicLinkGate>
    </main>
  );
}
