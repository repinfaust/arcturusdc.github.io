export const metadata = {
  title: 'Little Fibbing · Play the Demo',
  description: 'Play Little Fibbing — The Pothole Incident. A browser proof-of-concept by Arcturus Digital Consulting.',
  openGraph: {
    title: 'Little Fibbing · Play the Demo',
    description: 'Play Little Fibbing — The Pothole Incident. A browser proof-of-concept.',
    url: 'https://www.arcturusdc.com/apps/assumezero/littlefibbing',
    siteName: 'Arcturus Digital Consulting',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function LittleFibbingGamePage() {
  return (
    <div
      id="lf-game-page"
      dangerouslySetInnerHTML={{
        __html: `<style>
/* Game page covers full viewport — sits above site chrome */
body:has(#lf-game-page) { overflow: hidden !important; }

#lf-game-page {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  background: #1E1A14;
  font-family: 'IBM Plex Mono', monospace, ui-monospace, monospace;
}

.gn {
  background: #1E1A14;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 44px;
}

.gn-logo {
  font-size: 11px;
  color: #8C7B68;
  text-decoration: none;
  letter-spacing: 1px;
}
.gn-logo b { color: #F5EDD6; font-weight: 400; }

.gn-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.gn-badge {
  font-size: 9px;
  font-weight: 700;
  color: #00FF88;
  background: #0D0D0D;
  border: 1.5px solid #00FF88;
  padding: 2px 7px;
  border-radius: 3px;
  letter-spacing: 1px;
  box-shadow: 0 0 6px rgba(0,255,136,0.2);
  animation: gn-pulse 1.4s ease-in-out infinite;
}
@keyframes gn-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.75; }
}

.gn-back {
  font-size: 11px;
  color: #8C7B68;
  text-decoration: none;
  letter-spacing: 0.5px;
  transition: color 0.15s;
}
.gn-back:hover { color: #F5EDD6; }

/* Body splits into an info panel + the game frame */
.gbody {
  flex: 1;
  display: flex;
  min-height: 0;
}

.gpanel {
  width: 340px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 26px 22px;
  background: #16130E;
  border-right: 1px solid rgba(255,255,255,0.08);
  color: #C9BEA8;
}
.gpanel h1 {
  font-size: 17px;
  color: #F5EDD6;
  letter-spacing: 1px;
  margin: 0 0 4px;
}
.gpanel .gp-sub {
  font-size: 11px;
  color: #D4873A;
  letter-spacing: 1px;
  margin: 0 0 20px;
}
.gpanel h2 {
  font-size: 11px;
  color: #8C7B68;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin: 22px 0 8px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  padding-bottom: 5px;
}
.gpanel p { font-size: 12.5px; line-height: 1.6; margin: 0 0 10px; }
.gpanel .gp-keys { font-size: 12px; line-height: 1.7; }
.gpanel .gp-key {
  display: inline-block;
  background: #0D0D0D;
  border: 1px solid #3D3A33;
  border-radius: 3px;
  padding: 1px 6px;
  color: #F5EDD6;
  font-size: 11px;
}
.gpanel .gp-poc {
  margin-top: 22px;
  padding: 12px 14px;
  background: #0D0D0D;
  border: 1px solid #3D6E6E;
  border-radius: 4px;
  font-size: 11.5px;
  line-height: 1.55;
  color: #9FC2C2;
}
.gpanel .gp-poc b { color: #F5EDD6; }

.gf {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #1E1A14;
  min-width: 0;
}

.gf iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

/* On narrow screens, hide the panel so the game keeps the full width */
@media (max-width: 860px) {
  .gpanel { display: none; }
}

.gl {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1E1A14;
  pointer-events: none;
  transition: opacity 0.5s ease;
  z-index: 2;
}
.gl.hidden { opacity: 0; pointer-events: none; }
.gl-text {
  font-size: 12px;
  color: #00FF88;
  letter-spacing: 2px;
  animation: blink 1.2s step-end infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.gl-sub {
  font-size: 10px;
  color: #8C7B68;
  letter-spacing: 1px;
  margin-top: 10px;
}
</style>

<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap" rel="stylesheet">

<div class="gn">
  <a href="/" class="gn-logo"><b>Arcturus</b> Digital Consulting</a>
  <div class="gn-right">
    <div class="gn-badge">v0.2 POC</div>
    <a href="/apps/assumezero" class="gn-back">← About AssumeZero</a>
  </div>
</div>

<div class="gbody">
  <aside class="gpanel">
    <h1>Little Fibbing</h1>
    <p class="gp-sub">The Pothole Incident · a Truthnet game</p>

    <p>A cosy English village where not everything you read is true. You're
    spending the weekend at Nan's — and her tortoise, Keith, has made a break for
    it. Ask around, follow the rumours, and decide what to believe.</p>

    <h2>How to play</h2>
    <p class="gp-keys">
      <b>Village:</b> click anywhere to walk, or use
      <span class="gp-key">W A S D</span> /
      <span class="gp-key">← ↑ ↓ →</span>. Walk up to a villager to talk.<br><br>
      <b>The chase:</b> headlines from the Gazette fly past. Judge each one —
      <span class="gp-key">LIKELY</span>,
      <span class="gp-key">CAN'T TELL</span> or
      <span class="gp-key">UNLIKELY</span> — by tapping the buttons or pressing
      <span class="gp-key">←</span>
      <span class="gp-key">SPACE</span>
      <span class="gp-key">→</span>. Read carefully and you'll catch Keith.
    </p>

    <h2>What it teaches</h2>
    <p>It's a media-literacy game for children aged 8–16: questioning what you
    read, spotting manipulation, and being comfortable saying "I can't tell yet."
    Uncertainty-first — no false certainty.</p>

    <div class="gp-poc">
      <b>This is an early proof-of-concept (v0.2).</b> A single short slice built
      to test the world and the feel — not the finished game. Rough edges,
      placeholder bits and the occasional escaped tortoise are expected.
    </div>
  </aside>

  <div class="gf">
    <div class="gl" id="gl">
      <div class="gl-text">&gt; LOADING LITTLE FIBBING...</div>
      <div class="gl-sub">The village is almost ready.</div>
    </div>
    <iframe
      src="/games/little-fibbing/"
      title="Little Fibbing — The Pothole Incident"
      allowfullscreen
      allow="autoplay"
      onload="var l=document.getElementById('gl');if(l)l.classList.add('hidden')"
    ></iframe>
  </div>
</div>
`,
      }}
    />
  );
}
