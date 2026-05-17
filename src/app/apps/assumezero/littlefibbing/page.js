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

.gf {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #1E1A14;
}

.gf iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
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
    <a href="/apps/assumezero" class="gn-back">← About Little Fibbing</a>
  </div>
</div>

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
`,
      }}
    />
  );
}
