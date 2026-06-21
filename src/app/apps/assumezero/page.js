export const metadata = {
  title: 'AssumeZero · A proven method for teaching children to question the feed',
  description: 'AssumeZero trains children to question what they’re shown — AI fakes, clickbait, manufactured outrage — using inoculation, a method shown to build real, lasting resistance to misinformation, delivered in the swipe-feed format children already live in. v0.3 is a working, playtested prototype.',
  openGraph: {
    title: 'AssumeZero · A proven method for teaching children to question the feed',
    description: 'A proven method (inoculation / prebunking) for teaching children a durable skill — questioning what they’re shown — built in the format they already live in. v0.3 is a working, playtested prototype.',
    url: 'https://www.arcturusdc.com/apps/assumezero',
    siteName: 'Arcturus Digital Consulting',
    images: [
      {
        url: 'https://www.arcturusdc.com/img/little-fibbing/mayor-grinwell.png',
        width: 1200,
        height: 630,
        alt: 'AssumeZero — media literacy for the AI era',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AssumeZero · A proven method for teaching children to question the feed',
    description: 'A proven method for teaching children to question what they’re shown, built in the format they already live in. v0.3 is a working, playtested prototype.',
    images: ['https://www.arcturusdc.com/img/little-fibbing/mayor-grinwell.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function AssumeZeroPage() {
  return (
    <div
      id="assumezero-page"
      dangerouslySetInnerHTML={{
        __html: `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,500&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
#assumezero-page{
  --green:#00FF88; --neon:#39FF14; --ink:#0D0D0D; --red:#FF2D55; --indigo:#1A1040; --paper:#FAFAF8;
  --amber:#D4873A; --teal:#3D6E6E; --rust:#A64B2A; --cream:#F5EDD6; --stone:#8C7B68; --sage:#4A7C59;
  --line:#1f2733;
  background:var(--ink); color:var(--paper); font-family:"IBM Plex Mono",monospace;
  line-height:1.55; -webkit-font-smoothing:antialiased; display:block; min-height:100vh;
}
#assumezero-page *{box-sizing:border-box; margin:0; padding:0}
#assumezero-page .wrap{max-width:980px; margin:0 auto; padding:0 24px}
#assumezero-page h1,#assumezero-page h2,#assumezero-page h3{font-family:"Playfair Display",serif; font-weight:900; line-height:1.08; letter-spacing:-.01em}
#assumezero-page a{color:var(--green); text-decoration:none}
#assumezero-page a:hover{text-decoration:underline}

#assumezero-page .marquee{border-top:1px solid var(--line); border-bottom:1px solid var(--line); overflow:hidden; white-space:nowrap; padding:10px 0; background:#070707}
#assumezero-page .marquee span{display:inline-block; font-size:12px; letter-spacing:.18em; color:var(--green); animation:az-scroll 38s linear infinite}
@keyframes az-scroll{from{transform:translateX(0)} to{transform:translateX(-50%)}}

#assumezero-page .eyebrow{font-size:11px; letter-spacing:.22em; color:var(--stone); text-transform:uppercase}
#assumezero-page .marker{font-size:12px; letter-spacing:.16em; color:var(--green); text-transform:uppercase; margin-bottom:18px; display:block}
#assumezero-page .marker.warm{color:var(--amber)}

#assumezero-page section{padding:68px 0; border-bottom:1px solid var(--line)}
#assumezero-page .hero{padding:84px 0 72px}
#assumezero-page .hero h1{font-size:clamp(40px,7vw,76px); margin:18px 0 26px}
#assumezero-page .hero h1 em{font-style:italic; color:var(--green)}
#assumezero-page .lead{font-size:18px; max-width:680px; color:#cfd6dd}
#assumezero-page .pill{display:inline-block; border:1px solid var(--line); border-radius:30px; padding:5px 14px; font-size:11px;
  letter-spacing:.12em; color:var(--stone); margin:24px 8px 0 0; text-transform:uppercase}
#assumezero-page .pill.live{color:var(--green); border-color:rgba(0,255,136,.4)}

#assumezero-page .cta{display:inline-block; background:var(--green); color:var(--ink); font-weight:700; letter-spacing:.08em;
  padding:15px 28px; border-radius:6px; margin-top:34px; font-size:14px}
#assumezero-page .cta:hover{text-decoration:none; background:var(--neon)}
#assumezero-page .cta.ghost{background:transparent; color:var(--green); border:1px solid rgba(0,255,136,.45); margin-left:12px}

#assumezero-page h2{font-size:clamp(28px,4.4vw,40px); margin-bottom:22px}
#assumezero-page p.body{font-size:15.5px; color:#c4ccd4; max-width:720px; margin-bottom:16px}
#assumezero-page p.body strong{color:var(--paper)}

#assumezero-page .quote{font-family:"Playfair Display",serif; font-style:italic; font-size:22px; line-height:1.4;
  border-left:3px solid var(--amber); padding:6px 0 6px 22px; color:var(--cream); max-width:760px; margin:8px 0 28px}

#assumezero-page .grid{display:grid; gap:18px; margin-top:30px}
#assumezero-page .g3{grid-template-columns:repeat(3,1fr)}
#assumezero-page .g2{grid-template-columns:repeat(2,1fr)}
@media(max-width:760px){#assumezero-page .g3,#assumezero-page .g2{grid-template-columns:1fr}}
#assumezero-page .card{border:1px solid var(--line); border-radius:12px; padding:22px; background:#0f1318}
#assumezero-page .card .n{font-size:11px; letter-spacing:.16em; color:var(--green); text-transform:uppercase; margin-bottom:10px}
#assumezero-page .card h3{font-size:20px; margin-bottom:8px}
#assumezero-page .card p{font-size:13.5px; color:#aab3bc}

#assumezero-page .ladder{display:grid; gap:12px; margin-top:26px}
#assumezero-page .rung{display:grid; grid-template-columns:90px 1fr; gap:16px; align-items:center; border:1px solid var(--line);
  border-radius:10px; padding:16px 18px; background:#0f1318}
#assumezero-page .rung .ks{font-weight:700; color:var(--green); font-size:13px; letter-spacing:.1em}
#assumezero-page .rung .q{font-family:"Playfair Display",serif; font-style:italic; font-size:18px; color:var(--cream)}
#assumezero-page .rung .d{font-size:12.5px; color:#9aa3ac; margin-top:3px}

#assumezero-page .stats{display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:8px}
@media(max-width:760px){#assumezero-page .stats{grid-template-columns:1fr}}
#assumezero-page .stat .big{font-family:"Playfair Display",serif; font-weight:900; font-size:50px; color:var(--green); line-height:1}
#assumezero-page .stat p{font-size:13px; color:#aab3bc; margin-top:10px}
#assumezero-page .stat .src{font-size:10.5px; color:var(--stone); margin-top:8px; letter-spacing:.04em}

#assumezero-page .status-row{display:grid; grid-template-columns:34px 1fr; gap:14px; padding:16px 0; border-top:1px solid var(--line)}
#assumezero-page .status-row .mk{font-size:18px}
#assumezero-page .status-row .done{color:var(--green)} #assumezero-page .status-row .now{color:var(--amber)} #assumezero-page .status-row .next{color:var(--stone)}
#assumezero-page .status-row h3{font-size:15px; font-family:"IBM Plex Mono",monospace; font-weight:600; letter-spacing:.06em; text-transform:uppercase; margin-bottom:6px}
#assumezero-page .status-row p{font-size:13.5px; color:#aab3bc}

#assumezero-page .ask{border:1px solid var(--line); border-radius:12px; padding:24px; background:#0f1318}
#assumezero-page .ask .ic{font-size:26px} #assumezero-page .ask h3{font-size:19px; margin:12px 0 8px} #assumezero-page .ask p{font-size:13.5px; color:#aab3bc; margin-bottom:14px}

#assumezero-page .keep{display:grid; grid-template-columns:1fr 1fr; gap:0; border:1px solid var(--line); border-radius:12px; overflow:hidden; margin-top:26px}
@media(max-width:760px){#assumezero-page .keep{grid-template-columns:1fr}}
#assumezero-page .keep>div{padding:24px}
#assumezero-page .keep .v2{background:#0c0f13; border-right:1px solid var(--line)}
@media(max-width:760px){#assumezero-page .keep .v2{border-right:none; border-bottom:1px solid var(--line)}}
#assumezero-page .keep h3{font-size:13px; font-family:"IBM Plex Mono",monospace; letter-spacing:.12em; text-transform:uppercase; margin-bottom:14px; font-weight:700}
#assumezero-page .keep .v2 h3{color:var(--amber)} #assumezero-page .keep .v3 h3{color:var(--green)}
#assumezero-page .keep li{list-style:none; font-size:13.5px; color:#b6bec6; padding:6px 0 6px 20px; position:relative}
#assumezero-page .keep .v2 li::before{content:"·"; position:absolute; left:4px; color:var(--amber)}
#assumezero-page .keep .v3 li::before{content:"✓"; position:absolute; left:0; color:var(--green); font-size:12px}

#assumezero-page .demo-box{border:1px solid var(--line); border-radius:12px; padding:26px; background:#0f1318; margin-top:24px}
#assumezero-page .demo-box .badge{display:inline-block; font-size:10px; letter-spacing:.14em; color:var(--amber); border:1px solid rgba(212,135,58,.4); border-radius:20px; padding:3px 10px; text-transform:uppercase; margin-bottom:14px}
#assumezero-page .demo-box h3{font-size:20px; margin-bottom:10px}
#assumezero-page .demo-box p{font-size:13.5px; color:#aab3bc; margin-bottom:14px; max-width:680px}

#assumezero-page .azfooter{padding:50px 0; text-align:center}
#assumezero-page .azfooter .tag{font-size:12px; letter-spacing:.18em; color:var(--green)}
#assumezero-page .azfooter .c{font-size:11px; color:var(--stone); margin-top:14px}
#assumezero-page .note{font-size:12px; color:var(--stone); margin-top:14px; max-width:720px}
</style>

<div class="marquee"><span>ASSUME ZERO · ASK THE QUESTION · START FROM ZERO · MEDIA LITERACY FOR THE AI ERA · KS1 → KS3+ · A GAME BY ARCTURUS DC · FREE PILOT FOR SCHOOLS · EDUCATORS WELCOME · ASSUME ZERO · ASK THE QUESTION · START FROM ZERO · MEDIA LITERACY FOR THE AI ERA · KS1 → KS3+ · A GAME BY ARCTURUS DC · FREE PILOT FOR SCHOOLS · EDUCATORS WELCOME · </span></div>

<div class="wrap">

  <div class="hero">
    <span class="eyebrow">Est. 2025 · A Game by Arcturus Digital Consulting · TruthNet Signal //</span>
    <h1>The feed is built<br>to fool them.<br><em>Teach them to see it.</em></h1>
    <p class="lead">AssumeZero trains children to question what they're shown — AI fakes, clickbait, manufactured outrage — using inoculation, a method shown to build real, lasting resistance to misinformation. The difference from everything else on offer: it's built in the format children already live in, so a proven method actually reaches them. v0.3 is a working prototype of that loop.</p>
    <div>
      <span class="pill live">● Inoculation-based</span>
      <span class="pill">KS1 → KS3+</span>
      <span class="pill">Pilot Schools Welcome</span>
      <span class="pill">Free · No Procurement</span>
    </div>
    <div>
      <a class="cta" href="/apps/assumezero/play">PLAY THE v0.3 DEMO →</a>
      <a class="cta ghost" href="https://www.arcturusdc.com/contact">GET IN TOUCH</a>
    </div>
  </div>

  <!-- THE PIVOT -->
  <section>
    <span class="marker">Why The Loop Changed // v0.2 → v0.3</span>
    <h2>The skill is a snap judgment. So is the game.</h2>
    <p class="body">Spotting manipulation in the wild isn't an essay — it's a two-second instinct, then a check. v0.2 proved the world was buildable, but the lesson arrived <strong>after</strong> too much reading, and read-not-played is exactly the failure mode of the provision schools already have. A child who has to do homework to learn this won't.</p>
    <p class="body">So v0.3 rebuilds the engine around the real skill. The core is a feed where the child makes a fast, visual call — <strong>real, or trying to fool me?</strong> — and only <strong>then</strong> does TruthNet reveal the trick, name the tactic, and reward the catch. The format that manipulates them becomes the format that trains them against it.</p>
    <p class="quote">The same warm world. The same TruthNet lesson. A loop built around how the skill actually works.</p>
  </section>

  <!-- THE LOOP -->
  <section id="loop">
    <span class="marker">The New Core Loop //</span>
    <h2>Spot. Reveal. Repeat.</h2>
    <p class="body">One judgment, dressed a hundred ways. The disguise changes; the question never does.</p>
    <div class="grid g3">
      <div class="card"><div class="n">01 · Spot</div><h3>The feed</h3><p>A card appears — a post, a photo, a clip. Real, or made to fool you? A two-second gut call. Swipe or tap. No wall of text, no homework face.</p></div>
      <div class="card"><div class="n">02 · Reveal</div><h3>TruthNet cuts in</h3><p>After the swipe, TruthNet names the tell — the seventh leg, the red arrow pointing at nothing, the feeling that was engineered. The "ohh" moment is the learning.</p></div>
      <div class="card"><div class="n">03 · Repeat</div><h3>Tokens &amp; boosters</h3><p>Catches earn Truth Tokens. Spotting fades without practice — so the game asks you back tomorrow for a booster. The replay loop is the lesson's delivery schedule.</p></div>
    </div>
    <p class="body" style="margin-top:30px"><strong>And then — make the lie.</strong> In Creator Mode the child stops spotting and starts building: pick a real photo, bolt on a panic caption, add the arrow, watch the likes inflate. Becoming the manipulator — briefly, safely, white-hat only — is the highest-potency version of the lesson, and the research agrees.</p>
    <div><a class="cta" href="/apps/assumezero/play">TRY THE LOOP YOURSELF →</a></div>
  </section>

  <!-- THE SPINE -->
  <section>
    <span class="marker">The Spine // One question, three depths</span>
    <h2>The lesson grows with the child.</h2>
    <p class="body">The same loop carries a different question at each Key Stage — because what kind of lie a child can even perceive changes as they grow. It future-proofs the game: even when AI fakery becomes flawless, "who benefits from me feeling this?" never stops working.</p>
    <div class="ladder">
      <div class="rung"><span class="ks">KS1<br>5–7</span><div><div class="q">"Is the picture fake?"</div><div class="d">Provenance. Spot the seventh leg, the melting background. Trust your eyes — and learn they can be tricked. Audio-led, no reading required.</div></div></div>
      <div class="rung"><span class="ks">KS2<br>7–11</span><div><div class="q">"Is the framing fake?"</div><div class="d">A real photo can still be a lie. Clickbait captions, the arrow pointing at nothing, numbers that don't add up. The hinge of the whole game.</div></div></div>
      <div class="rung"><span class="ks">KS3+<br>11–14</span><div><div class="q">"Is the feeling fake?"</div><div class="d">Who profits from me feeling this? Engineered emotion, manufactured generosity, the engagement economy. The system, not the individual.</div></div></div>
    </div>
  </section>

  <!-- WHY IT WORKS -->
  <section>
    <span class="marker">Why It Works // The method is proven</span>
    <h2>This isn't a hunch about gamification.</h2>
    <p class="body">It's <strong>inoculation theory</strong> — "prebunking." Expose a child to a weakened, controlled dose of a manipulation tactic and they build resistance to the real thing. It's been demonstrated in nearly this exact format: Cambridge's <em>Bad News</em> game conferred measurable resistance to misinformation across a ~15,000-person evaluation, holding regardless of age, education or politics — and the strongest effect came from letting players <strong>build</strong> the fakes, not just spot them. The EU Commission has called gamified prebunking one of the most sustainable paths to combating fake news.</p>
    <p class="body">The honest caveat we keep on the record: the effects are real but modest. We shift the odds. We don't immunise.</p>
    <div class="stats" style="margin-top:30px">
      <div class="stat"><div class="big">~⅓</div><p>of online 13–17s shown a celebrity product post failed to confidently identify it as influencer marketing.</p><div class="src">Ofcom, Media Use &amp; Attitudes, 2025</div></div>
      <div class="stat"><div class="big">Half</div><p>of online 8–17s now use AI tools — often for learning and schoolwork.</p><div class="src">Ofcom, Media Use &amp; Attitudes, 2025</div></div>
      <div class="stat"><div class="big">92%</div><p>of 8–17s recall an online-safety lesson at school — almost all of it read, not played.</p><div class="src">Ofcom, Media Use &amp; Attitudes, 2025</div></div>
    </div>
    <p class="note">The Online Safety Act has created statutory pull toward exactly this kind of provision — and there still isn't much children will <em>voluntarily</em> engage with. That's the gap.</p>
  </section>

  <!-- TWO WORLDS RECONCILED -->
  <section>
    <span class="marker warm">Two Worlds, Reconciled //</span>
    <h2>The village is the world. The feed is the engine.</h2>
    <p class="body">v0.3 doesn't retire Little Fibbing — it gives the village a job it's good at. The warm world and the sharp TruthNet register were always "the same mechanic in two registers." Now the digital register is the loop children play, and the village is the story that connects the rounds and answers <em>why</em> — delivered in small, voiced doses, never as a gate in front of the fun.</p>
    <div class="keep">
      <div class="v2"><h3>Carried over from v0.2</h3>
        <ul>
          <li>The Little Fibbing world &amp; cast — narrative frame</li>
          <li>TruthNet as the resolution / reveal mechanic</li>
          <li>The dual warm / digital visual architecture</li>
          <li>Uncertainty-first: "I can't tell yet," not false certainty</li>
          <li>PSHE / RSHE alignment, KS-tiered</li>
        </ul>
      </div>
      <div class="v3"><h3>New in v0.3</h3>
        <ul>
          <li>Swipe-to-judge feed as the core loop</li>
          <li>Provenance → framing → feeling spine across KS1–KS3+</li>
          <li>Truth Tokens + booster return mechanic</li>
          <li>Creator Mode — build the lie, white-hat</li>
          <li>Validated by playtest, not just buildable</li>
        </ul>
      </div>
    </div>
    <p class="note">Retired: the headline slider / Exagga-rometer as a primary mechanic — it leaned on words and dragged the pace. Its job (strip the hype, find what's left) now lives inside the reveal.</p>
  </section>

  <!-- STATUS -->
  <section>
    <span class="marker">Current Status // last updated June 2026</span>
    <h2>Where we are. What's next.</h2>
    <div class="status-row"><div class="mk done">✓</div><div><h3>Complete — v0.2 POC (web)</h3><p>Walkable village, NPC dialogue, the LIKELY / CAN'T TELL / UNLIKELY runner, three-state ad break, TruthNet cards. Proved the concept was buildable without a studio.</p></div></div>
    <div class="status-row"><div class="mk done">✓</div><div><h3>Complete — v0.3 core loop (web prototype)</h3><p>Working swipe-to-judge feed across the spine — provenance (real vs AI), framing (clickbait), and a system-level trap; TruthNet reveals; Truth Tokens; a Kling-generated behind-the-scenes sting; Creator Mode; and the booster end-screen. Real images, real loop — a short, deliberate proof slice.</p></div></div>
    <div class="status-row"><div class="mk done">✓</div><div><h3>Complete — playtest, first round</h3><p>Early testing with KS1 and KS2 children showed strong voluntary engagement, including repeat plays of the placeholder-art build — evidence the loop itself is the draw. Engagement is the delivery mechanism, not the goal; the next rounds test what matters most: whether the lesson sticks.</p></div></div>
    <div class="status-row"><div class="mk now">◉</div><div><h3>In progress — content volume</h3><p>The loop holds attention; the deck is short. Building a repeatable card pipeline (GPT-image + Kling) so content scales without becoming a bespoke art project per card.</p></div></div>
    <div class="status-row"><div class="mk next">○</div><div><h3>Upcoming — school pilot conversations</h3><p>Seeking 2–3 UK primaries for endorsement and a home-play distribution pilot. No procurement — heads look at something and tell us honestly what they think.</p></div></div>
    <div class="status-row"><div class="mk next">○</div><div><h3>Upcoming — designer engagement</h3><p>Game-native visual direction for the feed, cards and TruthNet reveals, plus a repeatable content-art system. The interim build is house-style; the next pass needs a children's illustrator.</p></div></div>
  </section>

  <!-- ASKS -->
  <section>
    <span class="marker">What I'm Looking For // Three clear asks. No fluff.</span>
    <h2>Educators. Designers. Funding.</h2>
    <div class="grid g3" style="margin-top:26px">
      <div class="ask"><div class="ic">🏫</div><h3>Educators</h3><p>KS1–KS3 teacher, PSHE lead or head? I want listening conversations — 30 minutes, no commitment — and 1–2 schools willing to endorse a pilot.</p><a href="https://www.arcturusdc.com/contact">Get in touch →</a></div>
      <div class="ask"><div class="ic">🎨</div><h3>Designers</h3><p>Game-native art for the feed and TruthNet reveals, plus a repeatable card-content system. Children's illustrator, UK preferred. Brief available.</p><a href="https://www.arcturusdc.com/contact">See the brief →</a></div>
      <div class="ask"><div class="ic">💷</div><h3>Funding</h3><p>Pre-seed. Individuals or small funds who get the edtech and consumer opportunity in children's media literacy. The gap is real, documented, and now playtested.</p><a href="https://www.arcturusdc.com/contact">Let's talk →</a></div>
    </div>
  </section>

  <!-- v0.2 — FIRST BUILD (demoted, kept as proof) -->
  <section>
    <span class="marker warm">v0.2 — First Build // It runs in a browser</span>
    <h2>The narrative world still exists. Right now.</h2>
    <p class="body">Before the feed, there was the village. The v0.2 proof-of-concept — a walkable Little Fibbing, NPC dialogue, the headline runner and TruthNet cards — still runs in a browser. It proved the concept was buildable without a studio, and it remains the narrative world that v0.3's feed plugs into.</p>
    <div class="demo-box">
      <span class="badge">v0.2 POC · Playable</span>
      <h3>Little Fibbing — The Pothole Incident</h3>
      <p>Walk the village, follow the rumours, judge the headlines. A short, deliberately rough slice — the first thing AssumeZero ever shipped to a browser.</p>
      <a class="cta ghost" style="margin-top:0; margin-left:0" href="/apps/assumezero/littlefibbing">Play the v0.2 demo →</a>
    </div>
  </section>

  <!-- FOUNDER -->
  <section style="border-bottom:none">
    <span class="marker">The Person Behind It //</span>
    <h2>David · Founder, Arcturus Digital Consulting</h2>
    <p class="body">I'm a product manager and app developer in the UK. AssumeZero grew out of a question I couldn't drop: if the information environment is this demanding for children, why does so much of what we hand them still assume the internet looks the way it did fifteen years ago?</p>
    <p class="body">The aim is narrow and durable — teach children to question what they're shown, with a method that has evidence behind it, in a form they'll actually choose. v0.3 is the build that puts that skill at the centre of the loop.</p>
    <p class="body" style="color:var(--stone); font-size:13.5px">Previous work includes Sprocket, STEa, and a tiered portfolio of consumer and B2B products under ArcturusDC.</p>
  </section>

</div>

<div class="azfooter">
  <div class="tag">ASSUME ZERO · ASK THE QUESTION · START FROM ZERO</div>
  <div class="c">© 2026 Arcturus Digital Consulting · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></div>
</div>
`,
      }}
    />
  );
}
