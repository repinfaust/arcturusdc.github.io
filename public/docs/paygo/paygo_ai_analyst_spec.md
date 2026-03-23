# PAYGO — AI Analyst Feature
## Build Specification: Contextual Insight Card
**Version:** 0.1 · **Status:** Draft  
**Feature flag:** `aiAnalystCard`  
**Markets:** UK (Ember) · Ireland (Solas) · USA (Pulse)  
**API:** OpenAI (gpt-4o)

---

## 1. Feature Summary

A proactively generated insight card that appears inline on the customer dashboard. It surfaces one relevant, data-grounded observation about the customer's balance, usage, or top-up pattern — in plain language. Tapping the card opens an expanded view where the customer can ask follow-up questions.

**What it is:** An interpreter of the customer's own data.  
**What it is not:** A chatbot. A generic energy tips engine. A tariff advisor.

The card fires once per session load. It does not persist between sessions. It does not replace any existing UI element — it is inserted as a widget in the dashboard stack.

---

## 2. Config Panel Integration

### Feature flag
```json
"aiAnalystCard": false
```
Added to the standard feature flag object. Off by default. Toggled per region/segment via the Config Panel.

### Config Panel toggle location
**Section: Smart Features**  
Label: `AI Energy Analyst`  
Sub-label: `Proactive insight card on dashboard`  
Toggle: on/off  
Behaviour: toggling on triggers card generation immediately (no page reload)

### Region availability
| Region | Available | Default |
|---|---|---|
| UK (Ember) | ✅ Yes | Off |
| Ireland (Solas) | ✅ Yes | Off — see degradation rules |
| USA (Pulse) | ✅ Yes | Off |

Ireland is available but runs in degraded mode — lower confidence outputs,
explicit estimate framing. Card still appears; language adapts automatically.

---

## 3. Dashboard Placement

The card is inserted in the dashboard widget stack between the balance/runway block and the top-up action:

```
[Balance widget]                  always
[Days remaining]                  daysRemainingEstimate
[Real-time usage bar]             realTimeUsageBar (smart only)

─── INSERT: AI Analyst Card ───   aiAnalystCard flag

[Quick top-up CTA]                always
[Auto top-up status pill]         if configured
```

One card. One insight. No scrollable list of tips.

---

## 4. Card UI Spec

### Collapsed state (default, on dashboard)

```
┌─────────────────────────────────────────┐
│  ✦  Your energy analyst                 │
│                                         │
│  "Your usage this week is running       │
│   about 30% higher than usual.          │
│   Cold snap since Tuesday is            │
│   likely the reason."                   │
│                                         │
│  [Ask a follow-up  →]                   │
└─────────────────────────────────────────┘
```

- Card background: brand `surfaceColor` with slight elevation shadow
- Icon: small spark/analyst mark (✦ or brand-specific equivalent)
- Label: "Your energy analyst" — small caps, muted
- Insight text: body font, 16px, 3 lines max in collapsed state
- CTA: text link style, brand `primaryColor`
- Loading state: skeleton shimmer while API call resolves

### Expanded state (bottom sheet or full-screen modal)

Opens on tap of card or "Ask a follow-up" CTA.

```
┌─────────────────────────────────────────┐
│  ✦  Your energy analyst          [ × ] │
├─────────────────────────────────────────┤
│                                         │
│  "Your usage this week is running       │
│   about 30% higher than usual.          │
│   The cold snap since Tuesday is        │
│   likely the main reason — heating      │
│   systems work harder below 5°C.        │
│   Nothing looks unusual beyond that."   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [How much should I top up to           │
│   last until the 28th?          ]  →   │
│                                         │
│  [Why did I spend so much last          │
│   week?                         ]  →   │
│                                         │
│  [Type your own question...]            │
│                                         │
└─────────────────────────────────────────┘
```

- Full insight text displayed (no truncation)
- 2–3 suggested follow-up questions, generated with the initial insight
- Free-text input for custom questions
- Each follow-up fires a new API call with full conversation context
- Conversation history maintained within the session (not persisted)
- Close button returns to dashboard with card in collapsed state

---

## 5. OpenAI API Integration

### Model
`gpt-4o` — balance of speed and quality. Insight card needs to feel instant;
target < 2s for initial card generation.

### Call architecture

Two call types:

**Call 1 — Proactive insight (on dashboard load)**
Generates the initial card content + suggested follow-up questions.
Fires once per session when `aiAnalystCard` flag is true.

**Call 2 — Follow-up response (on user question)**
Continues conversation with full context. Uses message history array.
Fires on each user question in the expanded view.

### Request shape

```javascript
const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: "gpt-4o",
    max_tokens: 300,
    temperature: 0.4,           // Low — we want consistent, grounded outputs
    messages: [
      { role: "system", content: buildSystemPrompt(customerContext) },
      { role: "user",   content: buildInsightRequest(customerContext) }
    ]
  })
});
```

Temperature at 0.4: factual and consistent, but not robotic.

---

## 6. Prompt Architecture

### 6.1 System prompt

The system prompt is built dynamically from the customer context object.
It has three fixed sections and one variable section.

```
SECTION 1 — Role definition (fixed)
SECTION 2 — Customer data context (dynamic, injected per session)
SECTION 3 — Market/data quality rules (dynamic, by region)
SECTION 4 — Hard guardrails (fixed)
```

**Section 1 — Role definition**
```
You are an energy analyst assistant embedded in a prepayment energy app.
Your job is to interpret the customer's own energy and payment data and
explain it in plain, friendly language. You are not a general energy advisor.
You do not discuss competitors, tariff switching, or energy policy.
You only interpret the data you are given.
```

**Section 2 — Customer data context (injected)**
```
Here is the current customer's data:

Name: {customer.name}
Region: {customer.region}
Current balance: {currency}{customer.account.balance}
Days remaining (estimated): {customer.account.daysRemaining}
Days remaining basis: {customer.account.daysRemainingBasis}
  // "smart-actual" | "estimated-from-reads" | "estimated-low-confidence"
Average daily spend (last 30 days): {currency}{derivedBurnRate}
Last top-up: {currency}{lastTopUp.amount} on {lastTopUp.date}
Top-up frequency (last 90 days): {topUpFrequency} times
Tariff type: {customer.account.tariff}
Meter type: {customer.account.meterType}  // "smart" | "non-smart"
Usage this week vs 4-week average: {usageVariance}%
  // positive = higher than usual, negative = lower
Season: {currentSeason}
```

**Section 3 — Market/data quality rules (injected by region)**

```
// UK (smart)
Data quality: HIGH. Smart meter reads are near-real-time.
You may state usage figures with confidence.
Seasonal context (UK): {month} — {seasonalNote}

// Ireland (non-smart)
Data quality: ESTIMATED. Meter reads occur infrequently.
Usage figures are estimates based on read intervals.
You MUST prefix any usage-based claim with "Based on your estimated usage"
or similar. Do not state estimates as facts.
Never give a days-remaining figure without noting it is an estimate.

// USA (smart/AMI)
Data quality: HIGH. AMI meter data is available at 15-30 min intervals.
You may reference time-of-use patterns if touPricing flag is true.
State: {usState} — note any relevant seasonal context.
```

**Section 4 — Hard guardrails (fixed)**
```
RULES — never break these:
- Never recommend a specific tariff or suggest switching supplier
- Never discuss competitors by name
- Never give debt or financial advice beyond explaining the customer's own data
- Never state a figure you have not been given in the customer data
- Never fabricate usage data or patterns
- If you do not have enough data to make a confident observation, say so
  plainly: "I don't have enough recent data to give you a reliable picture yet."
- Keep the proactive insight to 3 sentences maximum
- Keep the tone warm and plain — no jargon, no energy industry terminology
- Always end the proactive insight JSON with 2-3 suggested follow-up questions
```

---

### 6.2 Insight request (Call 1)

```
Return a JSON object with this exact shape:

{
  "insight": "Your insight text here — 2-3 sentences max.",
  "confidenceLevel": "high" | "medium" | "low",
  "suggestedQuestions": [
    "Question 1?",
    "Question 2?",
    "Question 3?"
  ]
}

Return only valid JSON. No preamble, no markdown fences.

Generate one proactive insight about this customer's energy situation.
Focus on whichever of these is most relevant given the data:
- Is their balance unusually high or low for their pattern?
- Is their usage higher or lower than their own recent history?
- Is a top-up likely to be needed soon based on burn rate?
- Has anything notable changed in their recent pattern?

Pick the single most useful observation. Do not list multiple things.
```

### 6.3 Follow-up request (Call 2)

Append user question to message history. No new system prompt needed —
context is maintained in the conversation array.

```javascript
messages: [
  { role: "system", content: systemPrompt },          // original
  { role: "user",   content: initialInsightRequest }, // original
  { role: "assistant", content: previousInsightJSON },// Call 1 response
  { role: "user",   content: userFollowUpQuestion }   // new
]
```

Follow-up responses: plain text, not JSON. Max 4 sentences. Same guardrails apply.

---

## 7. Customer Context Object

Built client-side from Firestore data before the API call fires.
Derives the fields the prompt needs that aren't stored directly.

```javascript
function buildCustomerContext(customerDoc, usageHistory, paymentHistory) {
  const burnRate = deriveDailyBurnRate(usageHistory);        
  // avg daily spend over last 30 days of payment/ledger data
  
  const usageVariance = deriveUsageVariance(usageHistory);   
  // this week's spend vs 4-week rolling average, as %
  
  const lastTopUp = paymentHistory[0];
  
  const topUpFrequency = paymentHistory
    .filter(p => p.type === 'topup')
    .filter(p => isWithinDays(p.date, 90)).length;

  return {
    customer: customerDoc,
    derivedBurnRate: burnRate,
    usageVariance: usageVariance,
    lastTopUp: lastTopUp,
    topUpFrequency: topUpFrequency,
    currentSeason: deriveSeason(customerDoc.region),
    currency: regionConfig.currencySymbol
  };
}
```

**Data availability by market:**

| Field | UK (smart) | Ireland (non-smart) | USA (AMI) |
|---|---|---|---|
| burnRate | Actual (30d smart reads) | Estimated (read intervals) | Actual (AMI) |
| usageVariance | Reliable | Low confidence | Reliable |
| daysRemaining | Smart-actual | Estimated | Smart-actual |
| touPatterns | If flag on | Not available | If flag on |

---

## 8. Confidence & Degradation Logic

Before firing the API call, score the data context:

```javascript
function scoreDataConfidence(customerContext) {
  let score = 100;
  
  if (customerContext.customer.account.meterType === 'non-smart') score -= 40;
  if (customerContext.customer.account.daysRemainingBasis 
      === 'estimated-low-confidence') score -= 20;
  if (daysSinceLastRead(customerContext) > 30) score -= 20;
  if (customerContext.topUpFrequency < 2) score -= 10; // thin history
  
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
```

**On `low` confidence:** The API call still fires, but the system prompt
instructs the model to use estimate language and the card displays a
`~` prefix on any figures and a small caveat label beneath the insight:
*"Based on estimated usage data."*

**On API failure:** Card does not render. Fail silently — no error state
shown to customer. Dashboard loads normally without the card.

---

## 9. Brand Theming

The card inherits the active brand theme. No separate styling needed beyond
mapping the card components to brand tokens:

| Element | Token |
|---|---|
| Card background | `surfaceColor` |
| Card border/shadow | `primaryColor` at 15% opacity |
| Icon | `primaryColor` |
| Label text | `primaryDark` at 60% |
| Insight text | `primaryDark` |
| CTA link | `primaryColor` |
| Skeleton shimmer | `primaryLight` at 30% |

---

## 10. Example Outputs by Profile

**UK-02 David T. (vulnerable, low balance, smart)**
> "Your balance is lower than usual for this point in the month — at your
> recent rate, you have around 2 days left. You've topped up 6 times in
> the last 90 days, often in small amounts. A slightly larger top-up now
> could reduce how often you need to think about it."

Suggested questions:
- "How much should I top up to last until the weekend?"
- "Why is my balance going down faster than usual?"
- "What's the minimum I need to avoid running out tonight?"

---

**IE-02 Ciarán B. (debt-risk, non-smart)**
> "Based on your estimated usage, you have around 3 days of energy
> remaining. Your meter read is due — submitting one now will give us
> a more accurate picture of your balance."

Suggested questions:
- "How do I submit a meter read?"
- "How much should I top up to get through this week?"
- "What happens if my balance runs out?"

*(Note: No usage variance claim — insufficient smart data to support it.
Model directed to prioritise meter read prompt given it is due.)*

---

**US-01 Jordan K. (EV owner, smart/AMI, TOU active)**
> "Your usage last night between 1–5am was lower cost than usual —
> your EV charge schedule is working well. You're on track for your
> typical usage pattern this week, with around 14 days of balance
> remaining at this rate."

Suggested questions:
- "When's the cheapest time to run my dishwasher today?"
- "How much am I saving with off-peak EV charging?"
- "Will my balance cover me until the end of the month?"

---

## 11. Build Checklist

### Config
- [ ] Add `aiAnalystCard` to feature flag schema
- [ ] Add toggle to Config Panel — Smart Features section
- [ ] Region degradation mode passed to context builder

### Data layer
- [ ] `buildCustomerContext()` function — derives burnRate, variance, frequency
- [ ] `scoreDataConfidence()` function
- [ ] `buildSystemPrompt()` — assembles dynamic system prompt from context
- [ ] `buildInsightRequest()` — Call 1 user message

### API
- [ ] OpenAI API key in environment config (not client-bundled)
- [ ] Call 1: proactive insight on dashboard load
- [ ] JSON parse + validation on Call 1 response
- [ ] Call 2: follow-up with message history
- [ ] Error handling — silent fail on API error

### UI
- [ ] Insight card component — collapsed state
- [ ] Loading/skeleton state
- [ ] Confidence caveat label (low/medium confidence)
- [ ] Expanded bottom sheet
- [ ] Suggested questions as tappable chips
- [ ] Free-text input for custom questions
- [ ] Brand token mapping for all card elements
- [ ] Graceful absence (no card shown if flag off or API fails)

---

## 12. What This Is Not (Scope Guardrails)

To be clear during implementation — do not build:

- A persistent chat history across sessions
- General energy advice or tips content
- Tariff comparison or switching prompts
- Anything that writes back to customer account data
- A notification/push trigger (card is in-app only)
- A named AI persona ("Meet Ember Assist" etc.) — not yet

These are valid future directions. They are out of scope for v1.
