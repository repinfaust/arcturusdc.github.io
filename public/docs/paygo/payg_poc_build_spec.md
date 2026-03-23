# PAYG POC App — Build Specification
**Version:** 0.1 · **Status:** Draft  
**Purpose:** Stakeholder/client demo app. Neutral-branded shell, regional brand switching, modular features per customer profile. Runs on real devices. Uses mock data only.

---

## 1. App Architecture Overview

```
Shell App (neutral brand)
│
├── Region Selector                    → picks market context
│   ├── 🇬🇧 UK → Ember brand
│   ├── 🇮🇪 Ireland → Solas brand  
│   └── 🇺🇸 USA → Pulse brand
│
├── Customer Selector                  → picks persona
│   └── [filtered by region, shows profile summary card]
│
└── Consumer App                       → themed to brand
    ├── Feature set driven by config
    ├── All data from mock data layer
    └── Modular screens, toggled per customer/region
```

The key architectural rule: **nothing is hardcoded to a customer or region**. Every screen, feature, and data point is resolved at runtime from the config layer.

---

## 2. Central Config Architecture

This is the most important structural decision. All feature availability is driven by a single config object resolved from three inputs: `region` + `customerSegment` + `featureOverrides`.

### 2.1 Config Resolution Order

```
Base defaults (all off)
  └── + Region layer       (what this market supports)
        └── + Segment layer    (what this customer type gets)
              └── + Profile overrides  (individual customer exceptions)
                    └── = Resolved feature set for this session
```

Each layer only needs to define **differences from the layer above**. Anything not explicitly set inherits from the parent.

### 2.2 Config Schema

```json
{
  "regions": {
    "uk": {
      "brand": "ember",
      "smartMeterAvailable": true,
      "realTimeDataAvailable": true,
      "currency": "GBP",
      "currencySymbol": "£",
      "regulatoryContext": "ofgem",
      "segments": {
        "standard": { ... },
        "vulnerable": { ... },
        "debt-risk": { ... },
        "tech-savvy": { ... }
      }
    },
    "ie": {
      "brand": "solas",
      "smartMeterAvailable": false,
      "realTimeDataAvailable": false,
      "currency": "EUR",
      "currencySymbol": "€",
      "regulatoryContext": "cru",
      "segments": { ... }
    },
    "us": {
      "brand": "pulse",
      "smartMeterAvailable": true,
      "realTimeDataAvailable": true,
      "currency": "USD",
      "currencySymbol": "$",
      "regulatoryContext": "state-variable",
      "segments": {
        "standard": { ... },
        "ev-owner": { ... },
        "solar-exporter": { ... },
        "tech-savvy": { ... }
      }
    }
  }
}
```

### 2.3 Feature Flag Object (per resolved session)

```json
{
  "featureFlags": {

    // — Balance & visibility —
    "balanceDisplay":           true,   // Core balance widget. Always on.
    "daysRemainingEstimate":    true,   // "~9 days left" estimate. Non-smart: calculated.
    "usageGraph":               false,  // Historic usage chart. Requires data.
    "realTimeUsageBar":         false,  // Live usage indicator. Smart-only.

    // — Top-up models —
    "manualTopUp":              true,   // One-off top-up. Always on.
    "scheduledTopUp":           false,  // Fixed recurring top-up.
    "autoTopUp":                false,  // Threshold-triggered top-up.
    "rulesBasedTopUp":          false,  // If/then rules engine.
    "continuousBalanceMgmt":    false,  // Passive always-on management mode.

    // — Alerts & notifications —
    "lowBalanceAlert":          true,   // Balance below threshold. Always on.
    "predictiveWarning":        false,  // "At this rate, you'll run out in 2 days."
    "disconnectionWarning":     false,  // Pre-disconnection grace notification.
    "spendCapAlert":            false,  // Weekly/monthly spend ceiling alert.

    // — Payment management —
    "savedPaymentMethods":      true,   // Tokenised card on file.
    "paymentHistory":           true,   // Transaction log.
    "spendSummary":             false,  // Weekly/monthly spend breakdown.
    "debtRepaymentPlan":        false,  // Structured repayment schedule view.

    // — Vulnerability/safety features —
    "emergencyCredit":          false,  // Emergency credit draw-down.
    "friendlyHours":            false,  // No-disconnect periods. UK regulated.
    "warmHomeReminder":         false,  // Signpost to support schemes.
    "vulnerabilityFlag":        false,  // Internal flag, affects UX tone + features.

    // — Smart/real-time features —
    "touPricing":               false,  // Time-of-use rates display. Smart + US.
    "demandResponseAlerts":     false,  // Peak-time usage nudges.
    "halfHourlyUsageData":      false,  // AMI-level granularity.
    "usageComparison":          false,  // vs similar homes.

    // — Ecosystem features —
    "evChargingScheduler":      false,  // Schedule EV charge to off-peak.
    "solarExportSummary":       false,  // Export earnings display.
    "batteryStatusWidget":      false,  // Home battery level + mode.

    // — Account management —
    "meterReadSubmission":      false,  // Manual read entry. Non-smart.
    "tariffDisplay":            true,   // Current rate(s) displayed.
    "referralScheme":           false,
    "multiPropertyView":        false
  }
}
```

### 2.4 Segment Presets (what each segment inherits)

| Feature | standard | vulnerable | debt-risk | tech-savvy | ev-owner | solar-exporter |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| balanceDisplay | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| daysRemainingEstimate | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| autoTopUp | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| scheduledTopUp | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| rulesBasedTopUp | — | — | — | ✓ | ✓ | ✓ |
| continuousBalanceMgmt | — | — | — | ✓ | — | — |
| predictiveWarning | — | ✓ | ✓ | ✓ | — | — |
| emergencyCredit | — | ✓ | ✓ | — | — | — |
| friendlyHours | — | ✓ | — | — | — | — |
| vulnerabilityFlag | — | ✓ | — | — | — | — |
| debtRepaymentPlan | — | — | ✓ | — | — | — |
| touPricing | — | — | — | ✓ | ✓ | ✓ |
| evChargingScheduler | — | — | — | — | ✓ | — |
| solarExportSummary | — | — | — | — | — | ✓ |
| realTimeUsageBar | — | — | — | ✓ | ✓ | ✓ |
| usageGraph | — | — | — | ✓ | ✓ | ✓ |
| meterReadSubmission | — | ✓ | ✓ | — | — | — |

*Segment presets are further filtered by region capability. e.g. `realTimeUsageBar` is ON for `tech-savvy` but overridden to OFF for IE because `smartMeterAvailable: false`.*

---

## 3. Screen Inventory

### 3.1 Shell Screens (region/brand-agnostic)

| ID | Screen | Description |
|---|---|---|
| S-01 | Splash / Loading | Neutral logo, no brand |
| S-02 | Region Selector | 3 cards: UK / IE / USA with brief market descriptor |
| S-03 | Customer Selector | Grid of customer profile cards, filtered by region |
| S-04 | Config Panel *(demo mode)* | Toggle panel to override feature flags on-the-fly |

### 3.2 Consumer App Screens (branded, feature-gated)

| ID | Screen | Required features | Notes |
|---|---|---|---|
| A-01 | Home / Dashboard | balanceDisplay | Core screen. Always shown. |
| A-02 | Top-Up — manual | manualTopUp | Simple amount entry + pay |
| A-03 | Top-Up — scheduled | scheduledTopUp | Recurring setup flow |
| A-04 | Top-Up — auto | autoTopUp | Threshold + trigger setup |
| A-05 | Top-Up — rules builder | rulesBasedTopUp | If/then logic UI |
| A-06 | Balance management | continuousBalanceMgmt | Passive mode config |
| A-07 | Usage — graph | usageGraph | kWh over time chart |
| A-08 | Usage — real-time | realTimeUsageBar | Live household draw |
| A-09 | Usage — TOU rates | touPricing | Peak/off-peak breakdown |
| A-10 | Payment history | paymentHistory | Transaction log |
| A-11 | Spend summary | spendSummary | Weekly / monthly roll-up |
| A-12 | Emergency credit | emergencyCredit | Draw-down + confirmation |
| A-13 | Debt repayment | debtRepaymentPlan | Plan view + progress |
| A-14 | Meter read | meterReadSubmission | Photo or manual entry |
| A-15 | Notifications / alerts | lowBalanceAlert | Notification preferences |
| A-16 | EV scheduler | evChargingScheduler | Off-peak charge config |
| A-17 | Solar export | solarExportSummary | Export credits + earnings |
| A-18 | Battery widget | batteryStatusWidget | Charge level + mode |
| A-19 | Support / help | — | Always shown, context-aware |
| A-20 | Account settings | — | Always shown |

### 3.3 Home Dashboard Composition

The dashboard is itself modular — widgets are rendered or hidden based on flags:

```
┌─────────────────────────────────┐
│  [Brand header + account name]  │ always
├─────────────────────────────────┤
│  [Balance widget]               │ always
│  [Days remaining]               │ daysRemainingEstimate
│  [Real-time usage bar]          │ realTimeUsageBar
├─────────────────────────────────┤
│  [Predictive warning banner]    │ predictiveWarning (conditional)
│  [Emergency credit prompt]      │ emergencyCredit + low balance
│  [Debt repayment nudge]         │ debtRepaymentPlan (if active plan)
├─────────────────────────────────┤
│  [Quick top-up action]          │ always
│  [Auto top-up status pill]      │ autoTopUp (if configured)
│  [Scheduled top-up status pill] │ scheduledTopUp (if active)
├─────────────────────────────────┤
│  [Usage mini-chart]             │ usageGraph
│  [TOU rate indicator]           │ touPricing
│  [EV charge status]             │ evChargingScheduler
│  [Solar export today]           │ solarExportSummary
└─────────────────────────────────┘
```

---

## 4. Mock Customer Profiles

Six profiles across three regions. Each profile card shows a summary on the selector screen, then populates the entire consumer app with consistent mock data.

### UK — Ember

**UK-01: Sarah M.**
- Segment: `standard`
- Balance: £18.40 · ~9 days remaining
- Auto top-up: configured (£20 when < £10)
- Payment: Visa ending 4242
- Smart meter: yes
- Story hook: *steady user, set-and-forget, light engagement*

**UK-02: David T.**
- Segment: `vulnerable`
- Balance: £4.20 · ~2 days remaining ⚠️
- Emergency credit: available (unused)
- Friendly hours: active (6am–10am, 4pm–7pm)
- Smart meter: yes
- Story hook: *low income, erratic top-up pattern, needs intervention*

### Ireland — Solas

**IE-01: Aoife R.**
- Segment: `standard`
- Balance: €22.00 · ~11 days remaining (estimated)
- Scheduled top-up: every 2 weeks (€30)
- Smart meter: no — estimate-based days remaining
- Last meter read: 8 days ago
- Story hook: *comfortable, wants visibility but no smart capability*

**IE-02: Ciarán B.**
- Segment: `debt-risk`
- Balance: €7.50 · ~3 days remaining (estimated)
- Active repayment plan: €5/week
- Meter read: due (prompting)
- Smart meter: no
- Story hook: *recovering from debt, needs structured support, non-smart constraints*

### USA — Pulse

**US-01: Jordan K.**
- Segment: `ev-owner`
- Balance: $41.00 · ~14 days remaining
- TOU rates: active (Super Off-Peak 12am–6am)
- EV: scheduled to charge 1am–5am
- Solar: no
- Smart meter: AMI enabled
- Story hook: *optimising EV charge cost, engaged user, loves data*

**US-02: Maya C.**
- Segment: `solar-exporter`
- Balance: $63.20 (net of export credits) · 22 days remaining
- Solar export today: $4.80 earned
- Battery: 78% charged, auto-discharge after 5pm
- TOU rates: active
- Story hook: *prosumer, energy self-sufficiency goal, most complex profile*

---

## 5. Mock Data Layer

All data is static JSON, structured to mirror what a real API would return. No live calls. This allows the app to work offline and demos to be scripted.

### 5.1 Data Files

```
/mock-data/
  customers/
    uk-01-sarah.json
    uk-02-david.json
    ie-01-aoife.json
    ie-02-ciaran.json
    us-01-jordan.json
    us-02-maya.json
  usage/
    [customerId]-daily.json       ← 30 days of kWh data
    [customerId]-halfhourly.json  ← 48-slot today (smart only)
  payments/
    [customerId]-history.json     ← last 12 transactions
  rates/
    ember-standard.json
    solas-standard.json
    pulse-tou-california.json
```

### 5.2 Customer JSON Shape

```json
{
  "id": "uk-02-david",
  "name": "David T.",
  "region": "uk",
  "segment": "vulnerable",
  "featureOverrides": {
    "emergencyCredit": true,
    "friendlyHours": true,
    "warmHomeReminder": true,
    "predictiveWarning": true,
    "meterReadSubmission": false
  },
  "account": {
    "balance": 4.20,
    "balanceCurrency": "GBP",
    "daysRemaining": 2,
    "daysRemainingBasis": "smart-actual",
    "emergencyCredit": {
      "available": true,
      "limit": 10.00,
      "drawn": 0.00
    },
    "debtBalance": 0,
    "tariff": "ember-standard",
    "meterType": "smart"
  },
  "paymentMethods": [
    { "type": "visa", "last4": "9871", "isDefault": true }
  ],
  "topUpConfig": {
    "auto": null,
    "scheduled": null
  },
  "alerts": {
    "lowBalanceThreshold": 5.00,
    "notificationsEnabled": true
  }
}
```

---

## 6. Brand / Theme System

Each brand is a self-contained theme token set. The app loads the correct theme on region selection.

```json
{
  "ember": {
    "primaryColor": "#BA7517",
    "primaryLight": "#EF9F27",
    "primaryDark": "#412402",
    "surfaceColor": "#FAEEDA",
    "fontDisplay": "Georgia, serif",
    "fontBody": "system-ui, sans-serif",
    "logoComponent": "EmberLogo",
    "appName": "Ember"
  },
  "solas": {
    "primaryColor": "#1D9E75",
    "primaryLight": "#5DCAA5",
    "primaryDark": "#04342C",
    "surfaceColor": "#E1F5EE",
    "fontDisplay": "'Helvetica Neue', Helvetica, sans-serif",
    "fontBody": "system-ui, sans-serif",
    "logoComponent": "SolasLogo",
    "appName": "Solas"
  },
  "pulse": {
    "primaryColor": "#534AB7",
    "primaryLight": "#7F77DD",
    "primaryDark": "#26215C",
    "surfaceColor": "#EEEDFE",
    "fontDisplay": "'Arial Black', Arial, sans-serif",
    "fontBody": "system-ui, sans-serif",
    "logoComponent": "PulseLogo",
    "appName": "PULSE"
  }
}
```

---

## 7. Demo Config Panel (Critical Feature)

A persistent toggle panel accessible from the shell — **this is what makes the app a demo tool, not just a mockup**.

### Access
- Floating button in bottom-right corner of any consumer screen
- Labelled "Config" or use a wrench icon
- Slides up as a bottom sheet

### Panel Contents

**Section 1 — Active session**
- Current region (read-only)
- Current customer (read-only)
- Active segment label

**Section 2 — Feature toggles**
- Grouped by category (Payment Models / Alerts / Smart Features / Ecosystem)
- Toggle switch per feature
- Features impossible for this region greyed out with a tooltip explaining why
- Changes apply instantly to the UI behind the panel

**Section 3 — Quick scenarios**
- Preset buttons that apply a group of flags at once:
  - "Standard UK user" · "Vulnerable customer" · "Smart power user" · "Non-smart IE" · "EV + solar US"
- Useful for live demos where you don't want to toggle manually

**Section 4 — Data state**
- Slider or presets to change balance level: Critical / Low / Comfortable / High
- This changes the mock data state and triggers relevant conditional UI (warnings, emergency credit prompts etc.)
- Useful for showing the same customer in different balance states

---

## 8. Navigation Model

```
Shell                    Consumer App
──────                   ─────────────
Region Select   →        [Brand loads]
Customer Select →        Home Dashboard
                         │
                         ├── Top Up (modal or screen)
                         │   └── [Method sub-screens]
                         ├── Usage (tab or screen)
                         ├── Payments (tab or screen)
                         ├── Account (tab or screen)
                         └── Support
                         
Back to customer select: persistent back button in brand header
Back to region select: via account/settings screen "Switch demo"
```

**Nav pattern:** Bottom tab bar with 4–5 tabs. Tab items shown/hidden based on feature flags. If a tab has no active features, it is hidden rather than disabled — keeps the UI clean across different customer configs.

---

## 9. Build Phases

### Phase 1 — Shell + Config (foundation)
- [ ] Region selector screen
- [ ] Customer selector screen (cards with profile summary)
- [ ] Config resolution logic (region + segment + overrides → feature set)
- [ ] Brand theme switching
- [ ] Mock data layer (all 6 profiles, static JSON)

### Phase 2 — Core Consumer Screens
- [ ] Home dashboard (modular widget composition)
- [ ] Manual top-up flow (A-02)
- [ ] Payment history (A-10)
- [ ] Balance display + days remaining (smart and estimated variants)
- [ ] Low balance alert state
- [ ] Bottom tab navigation (feature-gated tabs)

### Phase 3 — Payment Model Screens
- [ ] Scheduled top-up (A-03)
- [ ] Auto top-up (A-04)
- [ ] Predictive warning banner
- [ ] Emergency credit flow (A-12)

### Phase 4 — Smart + Ecosystem Features
- [ ] Usage graph (A-07)
- [ ] Real-time usage bar (A-08)
- [ ] TOU pricing display (A-09)
- [ ] EV scheduler (A-16)
- [ ] Solar export summary (A-17)

### Phase 5 — Demo Config Panel
- [ ] Floating config button
- [ ] Toggle panel UI
- [ ] Live feature flag updates
- [ ] Balance state presets
- [ ] Scenario quick-load buttons

### Phase 6 — Non-Smart IE Variants
- [ ] Estimate-based days remaining logic
- [ ] Meter read submission (A-14)
- [ ] Scheduled-only top-up defaults
- [ ] Usage graph replaced with estimated consumption view

---

## 10. Key Design Constraints

| Constraint | Implication |
|---|---|
| Must run on real phones | React Native or responsive PWA. No desktop-only layouts. |
| Neutral shell, branded interior | Theme token swap on region/customer select. Shell uses no brand colour. |
| No live APIs | All data from mock JSON. No auth, no backend calls. |
| IE non-smart | Any smart-dependent feature must have a graceful fallback state or be hidden. |
| Demo-safe | No real payment UI (no card entry). Show saved card last-4 only. |
| Stakeholder use | Config panel must be intuitive enough for non-technical SLT to use during a presentation. |
| Modular by design | Adding a new feature = add to feature registry + add flag to relevant segment presets + build screen. Nothing else changes. |

---

## 11. Open Questions (to resolve before build)

1. **Tech stack:** React Native (true native, app store installable) vs PWA (browser-based, easier to share via URL)? Native is higher-fidelity but slower to iterate.
2. **Distribution:** TestFlight / internal Android track, or a shareable URL?
3. **Config panel access:** Should clients be able to see/use the config panel, or is it internal-only?
4. **Rules builder (A-05):** Complex UI. Phase 3 or defer to Phase 4?
5. **How many demo customers per region?** Spec has 2 each. Could expand to 3 if a third persona is needed (e.g. UK tech-savvy with rules engine).
6. **Meter read flow (IE):** Photo capture mock, or just manual number entry?
