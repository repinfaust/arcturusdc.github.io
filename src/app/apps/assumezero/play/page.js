export const metadata = {
  title: 'TruthNet · Play the Demo · AssumeZero',
  description: 'Play the AssumeZero TruthNet feed — a swipe game that teaches children to spot AI fakes, clickbait and engineered feelings. A v0.3 browser prototype by Arcturus Digital Consulting.',
  openGraph: {
    title: 'TruthNet · Play the Demo · AssumeZero',
    description: 'Real, or made to fool you? Swipe the feed, get caught, learn the trick. A v0.3 prototype by Arcturus Digital Consulting.',
    url: 'https://www.arcturusdc.com/apps/assumezero/play',
    siteName: 'Arcturus Digital Consulting',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TruthNet · Play the Demo · AssumeZero',
    description: 'Real, or made to fool you? Swipe the feed, get caught, learn the trick.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function TruthNetPlayPage() {
  return (
    <div
      id="tn-game-page"
      dangerouslySetInnerHTML={{
        __html: `<style>
/* Game page covers full viewport — sits above site chrome */
body:has(#tn-game-page) { overflow: hidden !important; }

#tn-game-page {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  background: #0e1116;
  font-family: 'IBM Plex Mono', monospace, ui-monospace, monospace;
}

.tn-nav {
  background: #0e1116;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding: 10px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 46px;
}
.tn-logo { font-size: 11px; color: #9aa6b2; text-decoration: none; letter-spacing: 1px; }
.tn-logo b { color: #eef2f6; font-weight: 700; }
.tn-right { display: flex; align-items: center; gap: 14px; }
.tn-badge {
  font-size: 9px; font-weight: 700; color: #22d3ee; background: #06222a;
  border: 1.5px solid #22d3ee; padding: 2px 7px; border-radius: 3px; letter-spacing: 1px;
  box-shadow: 0 0 6px rgba(34,211,238,0.25);
}
.tn-back { font-size: 11px; color: #9aa6b2; text-decoration: none; letter-spacing: 0.5px; transition: color 0.15s; }
.tn-back:hover { color: #eef2f6; }

/* Portrait, app-like presentation — the game is a phone-frame game */
.tn-stage {
  flex: 1; position: relative; min-height: 0;
  display: flex; align-items: stretch; justify-content: center;
  background: radial-gradient(circle at 50% 0%, #1b2330, #0e1116 60%);
}
.tn-frame { width: 100%; max-width: 440px; position: relative; }
.tn-frame iframe { width: 100%; height: 100%; border: none; display: block; }

.tn-load {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; background: #0e1116;
  pointer-events: none; transition: opacity 0.5s ease; z-index: 2;
}
.tn-load.hidden { opacity: 0; }
.tn-load .t { font-size: 12px; color: #22d3ee; letter-spacing: 2px; animation: tnblink 1.2s step-end infinite; }
.tn-load .s { font-size: 10px; color: #9aa6b2; letter-spacing: 1px; margin-top: 10px; }
@keyframes tnblink { 0%,100%{opacity:1} 50%{opacity:0} }
</style>

<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap" rel="stylesheet">

<div class="tn-nav">
  <a href="/" class="tn-logo"><b>Arcturus</b> Digital Consulting</a>
  <div class="tn-right">
    <div class="tn-badge">v0.3 PROTOTYPE</div>
    <a href="/apps/assumezero" class="tn-back">← About AssumeZero</a>
  </div>
</div>

<div class="tn-stage">
  <div class="tn-frame">
    <div class="tn-load" id="tn-load">
      <div class="t">&gt; LOADING TRUTHNET...</div>
      <div class="s">Real, or made to fool you?</div>
    </div>
    <iframe
      src="/games/truthnet/"
      title="TruthNet — Spot the fake"
      allowfullscreen
      allow="autoplay"
      onload="var l=document.getElementById('tn-load');if(l)l.classList.add('hidden')"
    ></iframe>
  </div>
</div>
`,
      }}
    />
  );
}
