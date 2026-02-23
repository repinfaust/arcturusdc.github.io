import Script from "next/script";

export const metadata = {
  title: 'AssumeZero — Arcturus Digital Consulting',
  description: 'AssumeZero teaser page.',
  openGraph: {
    title: 'AssumeZero — Arcturus Digital Consulting',
    description: 'AssumeZero teaser page.',
    url: 'https://www.arcturusdc.com/apps/assumezero',
    siteName: 'Arcturus Digital Consulting',
    images: [
      {
        url: 'https://www.arcturusdc.com/img/assumezero/image.png',
        width: 1227,
        height: 2000,
        alt: 'Mayor Reginald Grinwell poster artwork',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AssumeZero — Arcturus Digital Consulting',
    description: 'AssumeZero teaser page.',
    images: ['https://www.arcturusdc.com/img/assumezero/image.png'],
  },
};

export default function AssumeZeroPage() {
  return (
    <>
      <Script id="assumezero-mayor-reveal" strategy="afterInteractive">
        {`
          (() => {
            const root = document.getElementById('assumezero-page');
            if (!root) return;
            const portrait = root.querySelector('.mayor-portrait');
            const img = portrait ? portrait.querySelector('img') : null;
            if (!img || !portrait) return;

            const update = () => {
              const rect = portrait.getBoundingClientRect();
              const vh = window.innerHeight || document.documentElement.clientHeight;
              // Keep the top of the poster visible on load, then pan down progressively.
              const trigger = vh * 0.6;
              const end = -rect.height * 0.35;
              const raw = (trigger - rect.top) / (trigger - end);
              const p = Math.max(0, Math.min(1, raw));
              const pos = p * 78;
              img.style.setProperty('--mayor-pos', pos.toFixed(2) + '%');
            };

            let ticking = false;
            const onScroll = () => {
              if (ticking) return;
              ticking = true;
              requestAnimationFrame(() => {
                update();
                ticking = false;
              });
            };

            update();
            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', update);
          })();
        `}
      </Script>
      <Script id="assumezero-staggered-reveal" strategy="afterInteractive">
        {`
          (() => {
            if (!('IntersectionObserver' in window)) return;
            const root = document.getElementById('assumezero-page');
            if (!root) return;

            const itemSelector = [
              '.stat-cell',
              '.status-item',
              '.ask-card',
              '.pilot-row',
              '.act-dot',
              '.comparison-card',
              '.phone-frame',
              '.type-col',
              '.swatch',
              '.phase-card',
              '.mode-pill',
              '.body-copy',
              '.pull-quote',
              '.timeline-note',
              'p'
            ].join(', ');

            const sections = root.querySelectorAll('section.reveal');
            sections.forEach((section) => {
              let items = Array.from(section.querySelectorAll(itemSelector));
              if (!items.length) {
                items = Array.from(section.children);
              }

              items = items.filter((el) => !el.closest('.mayor-portrait'));
              items.forEach((el, i) => {
                el.classList.add('reveal-child');
                el.style.setProperty('--reveal-delay', Math.min(i * 70, 840) + 'ms');
              });
            });

            root.classList.add('seq-init');

            const observer = new IntersectionObserver((entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add('seq-visible');
                  observer.unobserve(entry.target);
                }
              });
            }, { threshold: 0.12 });

            sections.forEach((section) => observer.observe(section));
          })();
        `}
      </Script>
      <div
        id="assumezero-page"
        dangerouslySetInnerHTML={{
          __html: `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=IBM+Plex+Mono:wght@400;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<style>
:root {
  --mustard:     #D4873A;
  --teal:        #3D6E6E;
  --rust:        #A64B2A;
  --parchment:   #F5EDD6;
  --warm-grey:   #8C7B68;
  --green:       #4A7C59;
  --dark-text:   #1E1A14;
  --phosphor:    #00FF88;
  --neon:        #39FF14;
  --crt-black:   #0D0D0D;
  --glitch-red:  #FF2D55;
  --indigo:      #1A1040;
  --off-white:   #FAFAF8;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--dark-text);
  color: var(--dark-text);
  font-family: 'Lora', serif;
  overflow-x: hidden;
}

/* ─── NOISE TEXTURE ─── */
.paper { position: relative; }
.paper::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  opacity: 0.055;
  mix-blend-mode: multiply;
  pointer-events: none;
  z-index: 1;
}

.crt::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,136,0.025) 3px, rgba(0,255,136,0.025) 6px);
  pointer-events: none;
  z-index: 1;
}

/* ─── NAV ─── */
nav {
  background: var(--dark-text);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding: 14px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}
nav .logo {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  color: var(--warm-grey);
  letter-spacing: 1px;
  text-decoration: none;
}
nav .logo span { color: var(--parchment); }
.truth-chip {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--phosphor);
  background: var(--crt-black);
  border: 1.5px solid var(--phosphor);
  padding: 4px 10px;
  border-radius: 3px;
  box-shadow: 0 0 10px rgba(0,255,136,0.3);
  animation: phosphor-pulse 1.2s ease-in-out infinite;
}
@keyframes phosphor-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 10px rgba(0,255,136,0.3); }
  50% { opacity: 0.85; box-shadow: 0 0 6px rgba(0,255,136,0.15); }
}

/* ─── MARQUEE ─── */
.marquee-wrap {
  background: var(--mustard);
  overflow: hidden;
  padding: 0;
  border-top: 2px solid var(--dark-text);
  border-bottom: 2px solid var(--dark-text);
}
.marquee-track {
  display: flex;
  white-space: nowrap;
  animation: marquee 24s linear infinite;
  width: max-content;
}
.marquee-track span {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--dark-text);
  letter-spacing: 2px;
  padding: 8px 20px;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

/* ─── HERO ─── */
.hero {
  background: var(--parchment);
  padding: 0;
  position: relative;
  overflow: hidden;
}
.gazette-masthead {
  border-bottom: 4px solid var(--dark-text);
  padding: 18px 24px 12px;
  text-align: center;
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
}
.gazette-above {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 4px;
  color: var(--warm-grey);
  margin-bottom: 8px;
  text-transform: uppercase;
}
.gazette-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(32px, 6vw, 60px);
  font-weight: 900;
  color: var(--dark-text);
  text-transform: uppercase;
  letter-spacing: -1px;
  line-height: 1;
  border-top: 3px solid var(--teal);
  border-bottom: 3px double var(--teal);
  padding: 8px 0;
  margin: 8px 0;
  animation: glitch 10s ease infinite;
}
@keyframes glitch {
  0%, 90%, 100% { transform: none; filter: none; }
  91% { transform: translateX(2px); filter: hue-rotate(45deg); }
  92% { transform: translateX(-2px); }
  93% { transform: none; filter: none; }
}
.gazette-below {
  display: flex;
  justify-content: space-between;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  color: var(--warm-grey);
  letter-spacing: 1px;
  margin-top: 6px;
}

/* CRT intrusion in hero */
.crt-intrusion {
  position: absolute;
  top: 20px;
  right: 30px;
  background: var(--crt-black);
  border: 2px solid var(--phosphor);
  border-radius: 4px;
  padding: 10px 14px;
  box-shadow: 0 0 20px rgba(0,255,136,0.4);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--phosphor);
  line-height: 1.8;
  animation: phosphor-pulse 1.2s ease-in-out infinite;
  z-index: 10;
}
.crt-intrusion .crt-label {
  font-size: 9px;
  opacity: 0.7;
  margin-bottom: 4px;
  letter-spacing: 1px;
}

/* Hero body */
.hero-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 28px;
  padding: 36px 24px 28px;
  align-items: start;
  max-width: 1200px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .hero-body { grid-template-columns: 1fr; }
  .crt-intrusion { position: static; margin: 16px 16px 0; }
}
.hero-headline {
  font-family: 'Playfair Display', serif;
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 900;
  color: var(--dark-text);
  line-height: 1.15;
  margin-bottom: 16px;
}
.hero-standfirst {
  font-family: 'Lora', serif;
  font-size: 16px;
  line-height: 1.8;
  color: var(--dark-text);
  max-width: 560px;
  margin-bottom: 24px;
}
.hero-tag {
  display: inline-block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  letter-spacing: 1px;
  font-weight: 700;
  color: var(--parchment);
  background: var(--teal);
  padding: 4px 12px;
  border-radius: 2px;
  margin-right: 8px;
  margin-bottom: 8px;
}

/* Mayor portrait box */
.mayor-box {
  border: 2px solid var(--dark-text);
  box-shadow: 4px 4px 0 var(--warm-grey);
}
.mayor-portrait {
  background: #3D5C44;
  height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.mayor-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center var(--mayor-pos, 0%);
  display: block;
  transition: object-position 120ms linear;
}
.mayor-fallback {
  display: none;
  width: 100%;
  height: 100%;
  place-items: center;
  font-size: 72px;
}
.mayor-caption {
  background: var(--dark-text);
  padding: 6px 10px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  color: var(--parchment);
  line-height: 1.5;
  text-align: center;
}
.mayor-desc {
  padding: 10px;
  background: var(--parchment);
  font-family: 'Lora', serif;
  font-size: 11px;
  font-style: italic;
  color: var(--warm-grey);
  text-align: center;
  line-height: 1.5;
}

/* ─── SECTION SHARED ─── */
section { position: relative; }
.section-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 24px;
}
.section-label.warm { color: var(--teal); }
.section-label.cold { color: var(--phosphor); }

/* ─── PROBLEM ─── */
.problem-section {
  background: #F0E6CC;
  padding: 60px 24px;
}
.pull-quote {
  font-family: 'Playfair Display', serif;
  font-size: clamp(18px, 3vw, 26px);
  font-style: italic;
  color: var(--dark-text);
  line-height: 1.5;
  border-left: 5px solid var(--mustard);
  padding-left: 24px;
  margin: 32px 0;
  max-width: 700px;
}
.body-copy {
  font-family: 'Lora', serif;
  font-size: 16px;
  line-height: 1.85;
  color: var(--dark-text);
  max-width: 700px;
  margin-bottom: 16px;
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin-top: 48px;
  border: 2px solid var(--dark-text);
}
@media (max-width: 600px) { .stats-row { grid-template-columns: 1fr; } }
.stat-cell {
  padding: 24px 20px;
  border-right: 1px solid var(--dark-text);
  border-top: 4px solid var(--mustard);
  background: var(--parchment);
}
.stat-cell:last-child { border-right: none; }
.stat-number {
  font-family: 'Playfair Display', serif;
  font-size: 48px;
  font-weight: 900;
  color: var(--teal);
  line-height: 1;
  margin-bottom: 8px;
}
.stat-label {
  font-family: 'Lora', serif;
  font-size: 13px;
  font-style: italic;
  color: var(--warm-grey);
  line-height: 1.5;
  margin-bottom: 6px;
}
.stat-source {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  color: var(--warm-grey);
  opacity: 0.7;
}

/* ─── THE GAME ─── */
.game-section {
  background: var(--dark-text);
  padding: 60px 24px;
  position: relative;
}
.mechanic-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0;
  border: 1px solid rgba(255,255,255,0.1);
  margin: 40px 0;
}
@media (max-width: 700px) { .mechanic-grid { grid-template-columns: 1fr; } }
.mechanic-cell {
  padding: 32px 24px;
  border-right: 1px solid rgba(255,255,255,0.1);
}
.mechanic-cell:last-child { border-right: none; border-right: none; }
.mechanic-cell.warm {
  background: var(--parchment);
}
.mechanic-cell.cold {
  background: var(--crt-black);
  position: relative;
}
.mechanic-cell.cold::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,136,0.02) 3px, rgba(0,255,136,0.02) 6px);
  pointer-events: none;
}
.mechanic-icon {
  font-size: 28px;
  margin-bottom: 12px;
}
.mechanic-title {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 900;
  margin-bottom: 10px;
}
.mechanic-cell.warm .mechanic-title { color: var(--dark-text); }
.mechanic-cell.cold .mechanic-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 18px;
  color: var(--phosphor);
  text-shadow: 0 0 8px rgba(0,255,136,0.4);
}
.mechanic-body { font-family: 'Lora', serif; font-size: 14px; line-height: 1.7; }
.mechanic-cell.warm .mechanic-body { color: var(--warm-grey); }
.mechanic-cell.cold .mechanic-body {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  color: var(--off-white);
  position: relative;
  z-index: 2;
}

/* Game modes */
.mode-pills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
.mode-pill {
  font-family: 'Playfair Display', serif;
  font-size: 14px;
  color: var(--dark-text);
  background: var(--mustard);
  border: 2px solid var(--dark-text);
  padding: 6px 18px;
  border-radius: 24px;
  cursor: default;
}

/* Act timeline */
.act-timeline {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 48px 0 16px;
  position: relative;
}
.act-timeline::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--mustard), var(--rust), var(--glitch-red), var(--phosphor));
  transform: translateY(-50%);
  z-index: 0;
}
.act-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  z-index: 1;
}
.act-dot-circle {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--dark-text);
  background: var(--mustard);
  margin-bottom: 8px;
}
.act-dot:nth-child(3) .act-dot-circle { background: var(--rust); }
.act-dot:nth-child(4) .act-dot-circle { background: var(--glitch-red); }
.act-dot:nth-child(5) .act-dot-circle { background: var(--phosphor); }
.act-dot-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  text-align: center;
  line-height: 1.4;
  max-width: 70px;
}
.act-dot:nth-child(1) .act-dot-label,
.act-dot:nth-child(2) .act-dot-label { color: var(--warm-grey); }
.act-dot:nth-child(3) .act-dot-label { color: var(--rust); }
.act-dot:nth-child(4) .act-dot-label { color: var(--glitch-red); }
.act-dot:nth-child(5) .act-dot-label { color: var(--phosphor); }
.act-dot-num {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 8px;
  color: var(--warm-grey);
  margin-bottom: 4px;
  opacity: 0.6;
}
.timeline-note {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  color: var(--warm-grey);
  text-align: center;
  margin-top: 8px;
  opacity: 0.8;
}
.timeline-note span { color: var(--phosphor); }

/* section headline */
.section-headline {
  font-family: 'Playfair Display', serif;
  font-weight: 900;
  line-height: 1.15;
  margin-bottom: 16px;
}
.section-headline.warm { color: var(--dark-text); }
.section-headline.cold { color: var(--off-white); }

/* ─── MARKET ─── */
.market-section {
  background: #F0E6CC;
  padding: 60px 24px;
}
.market-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 40px;
}
@media (max-width: 768px) { .market-grid { grid-template-columns: 1fr; } }
.market-body {
  font-family: 'Lora', serif;
  font-size: 15px;
  line-height: 1.85;
  color: var(--dark-text);
}
.comparison-card {
  border: 1.5px solid var(--warm-grey);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 16px;
}
.comparison-card-header {
  padding: 8px 14px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  font-weight: 700;
}
.comparison-card.existing .comparison-card-header {
  background: var(--warm-grey);
  color: var(--parchment);
}
.comparison-card.lf .comparison-card-header {
  background: var(--crt-black);
  color: var(--phosphor);
  border-bottom: 1px solid var(--phosphor);
  box-shadow: inset 0 0 10px rgba(0,255,136,0.1);
}
.comparison-card-body { padding: 12px 14px; }
.comparison-card.existing .comparison-card-body { background: var(--parchment); }
.comparison-card.lf .comparison-card-body {
  background: #0D1A12;
  position: relative;
}
.comparison-card.lf .comparison-card-body::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,136,0.02) 3px, rgba(0,255,136,0.02) 6px);
}
.comparison-item {
  font-family: 'Lora', serif;
  font-size: 13px;
  line-height: 1.6;
  padding: 3px 0;
}
.comparison-card.existing .comparison-item { color: var(--warm-grey); }
.comparison-card.lf .comparison-item {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  color: var(--phosphor);
  position: relative;
  z-index: 1;
}
.curriculum-strip {
  background: var(--mustard);
  padding: 12px 20px;
  margin-top: 32px;
  border: 2px solid var(--dark-text);
}
.curriculum-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--dark-text);
  opacity: 0.6;
  margin-bottom: 4px;
}
.curriculum-text {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  color: var(--dark-text);
  line-height: 1.8;
}

/* ─── LOOK & FEEL ─── */
.lookfeel-section {
  background: #12100C;
  padding: 60px 24px;
  position: relative;
}
.lookfeel-sub {
  font-family: 'Lora', serif;
  font-size: 16px;
  font-style: italic;
  color: var(--warm-grey);
  max-width: 600px;
  line-height: 1.7;
  margin-bottom: 48px;
}
.phone-frames {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 48px;
}
@media (max-width: 768px) { .phone-frames { grid-template-columns: 1fr; max-width: 300px; margin: 0 auto 48px; } }
.phone-frame {
  background: #111;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0,0,0,0.8);
  transition: transform 0.2s;
}
.phone-frame:hover { transform: translateY(-4px); }
.phone-frame.warm { border: 3px solid var(--warm-grey); }
.phone-frame.digital { border: 3px solid var(--phosphor); box-shadow: 0 24px 60px rgba(0,0,0,0.8), 0 0 30px rgba(0,255,136,0.15); }
.phone-notch {
  height: 8px;
  background: #111;
  display: flex;
  justify-content: center;
  align-items: center;
}
.phone-notch-bar { width: 36px; height: 3px; background: #333; border-radius: 2px; }
.phone-screen {
  height: 300px;
  position: relative;
  overflow: hidden;
}
.phone-screen img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}
.phone-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--crt-black);
  position: relative;
}
.phone-placeholder::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,136,0.025) 3px, rgba(0,255,136,0.025) 6px);
}
.phone-placeholder-text {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--phosphor);
  text-align: center;
  letter-spacing: 1px;
  line-height: 1.8;
  position: relative;
  z-index: 2;
  opacity: 0.8;
}
.phone-home-mockup {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #8FB4C8 0%, #A8C8D8 40%, #7A9570 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.phone-home-title {
  margin-top: 16px;
  background: var(--parchment);
  border: 2px solid var(--teal);
  border-radius: 8px;
  padding: 8px 18px;
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 900;
  color: var(--teal);
  text-align: center;
  line-height: 1.1;
  box-shadow: 2px 2px 0 var(--warm-grey);
}
.phone-home-crt {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--crt-black);
  border: 1.5px solid var(--phosphor);
  border-radius: 3px;
  padding: 3px 6px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  color: var(--phosphor);
  box-shadow: 0 0 8px rgba(0,255,136,0.4);
}
.phone-home-btn {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(180deg, var(--mustard) 0%, #C07028 100%);
  border: none;
  border-radius: 24px;
  padding: 10px 28px;
  font-family: 'Playfair Display', serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--dark-text);
  white-space: nowrap;
  box-shadow: 0 4px 0 #8B5000;
}
.phone-footer {
  height: 12px;
  background: #111;
  display: flex;
  justify-content: center;
  align-items: center;
}
.phone-footer-bar { width: 24px; height: 4px; background: #333; border-radius: 2px; }
.phone-caption {
  margin-top: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  color: var(--warm-grey);
  text-align: center;
  letter-spacing: 1px;
}

/* Palette strips */
.palette-section { margin-top: 48px; }
.palette-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  margin-bottom: 10px;
}
.palette-label.warm { color: var(--warm-grey); }
.palette-label.cold { color: var(--phosphor); }
.palette-swatches { display: flex; gap: 8px; margin-bottom: 24px; }
.swatch {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  border: 1.5px solid rgba(255,255,255,0.15);
  position: relative;
  flex-shrink: 0;
}
.swatch.glowing { box-shadow: 0 0 10px currentColor; }
.swatch-hex {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 8px;
  color: var(--warm-grey);
  white-space: nowrap;
}

/* Type specimen */
.type-specimen {
  border: 1px solid rgba(255,255,255,0.1);
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: 56px;
  overflow: hidden;
  border-radius: 4px;
}
.type-col {
  padding: 24px;
}
.type-col.warm { background: var(--parchment); }
.type-col.cold { background: var(--crt-black); position: relative; }
.type-col.cold::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,136,0.02) 3px, rgba(0,255,136,0.02) 6px);
}
.type-eyebrow {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  margin-bottom: 8px;
}
.type-col.warm .type-eyebrow { color: var(--warm-grey); }
.type-col.cold .type-eyebrow { color: var(--phosphor); opacity: 0.7; position: relative; z-index: 2; }
.type-sample-warm {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--dark-text);
  line-height: 1.3;
  margin-bottom: 6px;
}
.type-sample-sub-warm {
  font-family: 'Lora', serif;
  font-size: 13px;
  font-style: italic;
  color: var(--warm-grey);
}
.type-sample-cold {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--phosphor);
  line-height: 1.6;
  text-shadow: 0 0 6px rgba(0,255,136,0.4);
  position: relative;
  z-index: 2;
}

/* ─── STATUS ─── */
.status-section {
  background: var(--indigo);
  padding: 60px 24px;
  border-top: 2px solid var(--phosphor);
  position: relative;
}
.status-section::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,136,0.015) 3px, rgba(0,255,136,0.015) 6px);
  pointer-events: none;
}
.status-timestamp {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--warm-grey);
  margin-bottom: 8px;
  opacity: 0.7;
}
.status-timeline {
  margin-top: 40px;
  padding-left: 24px;
  border-left: 1px solid rgba(255,255,255,0.1);
  position: relative;
  z-index: 2;
}
.status-item {
  display: flex;
  gap: 20px;
  margin-bottom: 28px;
  padding-bottom: 28px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.status-item:last-child { border-bottom: none; margin-bottom: 0; }
.status-dot {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
  flex-shrink: 0;
  width: 20px;
  margin-top: 2px;
}
.status-dot.complete { color: var(--phosphor); }
.status-dot.inprogress { color: var(--mustard); }
.status-dot.upcoming { color: var(--warm-grey); }
.status-content {}
.status-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}
.status-item .status-dot.complete ~ .status-content .status-title { color: var(--phosphor); }
.status-item .status-dot.inprogress ~ .status-content .status-title { color: var(--mustard); }
.status-item .status-dot.upcoming ~ .status-content .status-title { color: var(--warm-grey); }
.status-desc {
  font-family: 'Lora', serif;
  font-size: 14px;
  color: var(--off-white);
  line-height: 1.7;
  opacity: 0.8;
}

/* ─── THREE ASKS ─── */
.asks-section {
  background: var(--crt-black);
  padding: 60px 24px;
  border-top: 1px solid rgba(0,255,136,0.2);
  position: relative;
}
.asks-section::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,136,0.015) 3px, rgba(0,255,136,0.015) 6px);
  pointer-events: none;
}
.asks-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 40px;
  position: relative;
  z-index: 2;
}
@media (max-width: 768px) { .asks-grid { grid-template-columns: 1fr; } }
.ask-card {
  background: rgba(255,255,255,0.03);
  border: 1.5px solid rgba(0,255,136,0.3);
  border-radius: 8px;
  padding: 28px 24px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.ask-card:hover {
  border-color: var(--phosphor);
  box-shadow: 0 0 24px rgba(0,255,136,0.1);
}
.ask-icon { font-size: 28px; margin-bottom: 14px; }
.ask-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--phosphor);
  letter-spacing: 1px;
  margin-bottom: 12px;
  text-shadow: 0 0 6px rgba(0,255,136,0.3);
}
.ask-body {
  font-family: 'Lora', serif;
  font-size: 14px;
  color: var(--off-white);
  line-height: 1.75;
  margin-bottom: 20px;
  opacity: 0.85;
}
.ask-btn {
  display: inline-block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--phosphor);
  border: 1.5px solid var(--phosphor);
  padding: 7px 18px;
  border-radius: 3px;
  text-decoration: none;
  letter-spacing: 1px;
  transition: background 0.15s, color 0.15s;
}
.ask-btn:hover {
  background: var(--phosphor);
  color: var(--crt-black);
}

/* ─── ABOUT ─── */
.pilot-section {
  background: var(--parchment);
  padding: 80px 40px;
  position: relative;
  overflow: hidden;
}
@media (max-width: 768px) {
  .pilot-section .pilot-grid { grid-template-columns: 1fr !important; }
}
.about-section {
  background: var(--parchment);
  padding: 60px 24px;
  border-top: 3px solid var(--dark-text);
}
/* desktop readability: avoid ultra-wide, sparse layouts */
.problem-section > *,
.game-section > *,
.market-section > *,
.lookfeel-section > *,
.status-section > *,
.asks-section > *,
.pilot-section > *,
.about-section > * {
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}
.about-grid {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 40px;
  margin-top: 40px;
  align-items: start;
}
@media (max-width: 600px) { .about-grid { grid-template-columns: 1fr; } }
.about-portrait {
  border: 2px solid var(--dark-text);
  box-shadow: 3px 3px 0 var(--warm-grey);
}
.about-portrait-box {
  height: 160px;
  background: #D4C4A0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.about-initials {
  font-family: 'Playfair Display', serif;
  font-size: 56px;
  font-weight: 900;
  color: var(--warm-grey);
}
.about-caption {
  background: var(--dark-text);
  padding: 6px 10px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  color: var(--parchment);
  text-align: center;
  letter-spacing: 1px;
}
.about-body {
  font-family: 'Lora', serif;
  font-size: 16px;
  line-height: 1.85;
  color: var(--dark-text);
}
.about-body p { margin-bottom: 16px; }
.about-body p:last-child { margin-bottom: 0; }
.about-body em {
  color: var(--teal);
  font-style: italic;
}
.other-apps {
  margin-top: 24px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.app-pill {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--teal);
  border: 1.5px solid var(--teal);
  padding: 4px 14px;
  border-radius: 24px;
  text-decoration: none;
  letter-spacing: 0.5px;
  transition: background 0.15s, color 0.15s;
}
.app-pill:hover { background: var(--teal); color: var(--parchment); }

/* ─── FOOTER ─── */
footer {
  background: var(--dark-text);
  padding: 32px 40px 24px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.footer-crt {
  text-align: center;
  margin-bottom: 24px;
}
.footer-crt-chip {
  display: inline-block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--phosphor);
  background: var(--crt-black);
  border: 1.5px solid var(--phosphor);
  padding: 6px 18px;
  border-radius: 3px;
  letter-spacing: 2px;
  box-shadow: 0 0 16px rgba(0,255,136,0.2);
  animation: phosphor-pulse 1.2s ease-in-out infinite;
}
.footer-links {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.footer-copy {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--warm-grey);
  letter-spacing: 0.5px;
}
.footer-nav {
  display: flex;
  gap: 20px;
}
.footer-nav a {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--warm-grey);
  text-decoration: none;
  letter-spacing: 0.5px;
  transition: color 0.15s;
}
.footer-nav a:hover { color: var(--parchment); }

/* ─── SCROLL REVEAL ─── */
.reveal {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
#assumezero-page.seq-init section.reveal .reveal-child {
  opacity: 0;
  transform: translateY(16px);
  filter: blur(1px);
  transition: opacity 520ms ease, transform 560ms ease, filter 560ms ease;
  transition-delay: var(--reveal-delay, 0ms);
  will-change: opacity, transform;
}
#assumezero-page.seq-init section.reveal.seq-visible .reveal-child {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}
</style>


<!-- NAV -->
<nav>
  <a href="/" class="logo"><span>Arcturus</span> Digital Consulting</a>
  <div class="truth-chip">&lt;TRUTH&gt;</div>
</nav>

<!-- HERO -->
<section class="hero paper">
  <div class="gazette-masthead">
    <div class="gazette-above">Est. 2025 · A Game by Arcturus Digital Consulting</div>
    <div class="gazette-title">The AssumeZero Gazette</div>
    <div class="gazette-below">
      <span>KS2 &amp; KS3+ EDITION</span>
      <span>IN DEVELOPMENT · 2026</span>
      <span>PILOT SCHOOLS WELCOME</span>
    </div>
    <div class="crt-intrusion">
      <div class="crt-label">TRUTHNET SIGNAL //</div>
      <div>&gt; ASSUME ZERO</div>
      <div>&gt; ASK THE QUESTION</div>
      <div>&gt; START FROM ZERO</div>
    </div>
  </div>

  <div class="marquee-wrap">
    <div class="marquee-track">
      <span>ASSUMEZERO</span><span>·</span>
      <span>A GAME BY ARCTURUS DC</span><span>·</span>
      <span>KS2 &amp; KS3+</span><span>·</span>
      <span>IN DEVELOPMENT</span><span>·</span>
      <span>FREE PILOT FOR SCHOOLS</span><span>·</span>
      <span>EDUCATORS WELCOME</span><span>·</span>
      <span>ASSUME ZERO</span><span>·</span>
      <span>ASK THE QUESTION</span><span>·</span>
      <span>ASSUMEZERO</span><span>·</span>
      <span>A GAME BY ARCTURUS DC</span><span>·</span>
      <span>KS2 &amp; KS3+</span><span>·</span>
      <span>IN DEVELOPMENT</span><span>·</span>
      <span>FREE PILOT FOR SCHOOLS</span><span>·</span>
      <span>EDUCATORS WELCOME</span><span>·</span>
      <span>ASSUME ZERO</span><span>·</span>
      <span>ASK THE QUESTION</span><span>·</span>
    </div>
  </div>

  <div class="hero-body">
    <div>
      <h1 class="hero-headline">Can your child tell<br>when they're being<br>fibbed to?</h1>
      <p class="hero-standfirst">AssumeZero is a mobile game that teaches children aged 8–16 to question what they read, spot manipulation, and think critically — before the real world demands it of them.</p>
      <div>
        <span class="hero-tag">KS2</span>
        <span class="hero-tag">KS3+</span>
        <span class="hero-tag">In Development</span>
        <span class="hero-tag">Pilot Schools Welcome</span>
      </div>
    </div>
    <div>
      <div class="mayor-box">
        <div class="mayor-portrait">
          <img src="/img/assumezero/image.png" alt="Mayor Reginald Grinwell, AssumeZero c.1958" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">
          <div class="mayor-fallback" aria-hidden="true">🎩</div>
        </div>
        <div class="mayor-caption">Mayor Reginald Grinwell<br>AssumeZero, c.1958</div>
        <div class="mayor-desc">Beloved civic leader.<br>Entirely trustworthy.<br><em>Definitely.</em></div>
      </div>
    </div>
  </div>
</section>

<!-- PROBLEM -->
<section class="problem-section paper reveal">
  <div class="section-label warm">THE PROBLEM //</div>
  <blockquote class="pull-quote">
    "The information environment children are growing up in is unlike anything that came before it. The tools we give them to navigate it are PDF printouts from 2009."
  </blockquote>
  <p class="body-copy">AI-generated content is now indistinguishable from real photography, video, and writing. Social feeds are engineered to trigger emotional responses before rational ones. The average child encounters hundreds of information claims every day before they've finished breakfast.</p>
  <p class="body-copy">The current school response — well-meaning PDFs, charity worksheets, occasional PSHE lessons — was built for a different world. It assumes children have time to deliberate, access to experts, and the motivation to engage with material that looks like homework. They don't.</p>
  <p class="body-copy">AssumeZero is built on a different premise: teach critical thinking through a mechanic children will voluntarily play, on a device they already have, in the time they already spend on it.</p>

  <div class="stats-row">
    <div class="stat-cell">
      <div class="stat-number">41%</div>
      <div class="stat-label">of UK adults regularly encounter misinformation online</div>
      <div class="stat-source">Source: Ofcom, 2025</div>
    </div>
    <div class="stat-cell">
      <div class="stat-number">59%</div>
      <div class="stat-label">use online intermediaries as their primary news source</div>
      <div class="stat-source">Source: Ofcom, 2025</div>
    </div>
    <div class="stat-cell">
      <div class="stat-number">97%</div>
      <div class="stat-label">of UK online adults visit a news service monthly</div>
      <div class="stat-source">Source: Ofcom, 2025</div>
    </div>
  </div>
  <div class="reveal d5" style="margin-top: 32px; padding: 16px 24px; border-left: 3px solid var(--teal); background: rgba(61,110,110,0.08);">
    <p style="font-family: 'Lora', serif; font-size: 14px; color: var(--warm-grey); line-height: 1.7; margin: 0;">
      Research consistently shows that <em>inoculation</em> — exposure to weakened forms of manipulation before encountering the real thing — is more effective at building misinformation resilience than correction after the fact. Little Fibbing is inoculation, delivered as a game.
    </p>
    <p style="font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--teal); letter-spacing: 1px; margin: 8px 0 0;">
      Ref: Lewandowsky &amp; van der Linden, 2021 · Psychological Science in the Public Interest
    </p>
  </div>
</section>

<!-- THE GAME -->
<section class="game-section reveal">
  <div class="section-label cold">THE GAME //</div>
  <h2 class="section-headline cold" style="font-size: clamp(24px, 4vw, 40px);">Two worlds. One mechanic.</h2>

  <div class="mechanic-grid">
    <div class="mechanic-cell warm">
      <div class="mechanic-icon">🏃</div>
      <div class="mechanic-title">Run</div>
      <p class="mechanic-body" style="color: var(--warm-grey);">You're a news runner in AssumeZero — a cosy 1950s English village where Mayor Grinwell's word is law and the Gazette prints only the finest truths.</p>
    </div>
    <div class="mechanic-cell warm">
      <div class="mechanic-icon">📰</div>
      <div class="mechanic-title">Read</div>
      <p class="mechanic-body" style="color: var(--warm-grey);">Headlines from the AssumeZero Gazette appear as obstacles on your route. Some are true. Some are exaggerated. Some are complete fabrications.</p>
    </div>
    <div class="mechanic-cell cold crt">
      <div class="mechanic-icon" style="position:relative;z-index:2">⚡</div>
      <div class="mechanic-title">Decide</div>
      <p class="mechanic-body">LIKELY or UNLIKELY? Or CAN'T TELL — always a valid answer. The lane you choose IS the lesson. No right answer without a reason.</p>
    </div>
  </div>

  <div class="act-timeline">
    <div class="act-dot">
      <div class="act-dot-num">ACT I</div>
      <div class="act-dot-circle"></div>
      <div class="act-dot-label">Everything As It Always Was</div>
    </div>
    <div class="act-dot">
      <div class="act-dot-num">ACT II</div>
      <div class="act-dot-circle"></div>
      <div class="act-dot-label">The Edges Begin to Curl</div>
    </div>
    <div class="act-dot">
      <div class="act-dot-num">ACT III</div>
      <div class="act-dot-circle"></div>
      <div class="act-dot-label">Feed the Narrative</div>
    </div>
    <div class="act-dot">
      <div class="act-dot-num">ACT IV</div>
      <div class="act-dot-circle"></div>
      <div class="act-dot-label">The Mask Slips</div>
    </div>
    <div class="act-dot">
      <div class="act-dot-num">ACT V</div>
      <div class="act-dot-circle"></div>
      <div class="act-dot-label">Wake Up</div>
    </div>
  </div>
  <div class="timeline-note">&gt; The visual shift from folk warmth to digital interference <span>IS the media literacy lesson</span>.</div>

  <div class="mode-pills">
    <div class="mode-pill">Fake or Real?</div>
    <div class="mode-pill">Bias Alert</div>
    <div class="mode-pill">Evidence Run</div>
    <div class="mode-pill">Fallacy Dash</div>
  </div>
</section>

<!-- MARKET -->
<section class="market-section paper reveal">
  <div class="section-label warm">MARKET CONTEXT //</div>
  <h2 class="section-headline warm" style="font-size: clamp(22px, 3.5vw, 36px);">A quality gap wide enough to drive a bus through.</h2>

  <div class="market-grid">
    <div>
      <p class="market-body">The dominant format for digital literacy education in UK primary and secondary schools is the PDF. Often hand-designed, rarely updated, and distributed via school apps where they are opened once and forgotten.</p>
      <br>
      <p class="market-body">AssumeZero is not competing with Duolingo. It's competing with a PDF about the perils of TikTok, illustrated in clip art, sent home on ClassDojo on a Tuesday.</p>
      <br>
      <p class="market-body">The bar is low. The opportunity is significant. And the Online Safety Act has created statutory pull toward exactly this kind of provision — without anyone yet delivering something children will actually use.</p>
    </div>
    <div>
      <div class="comparison-card existing">
        <div class="comparison-card-header">WHAT EXISTS NOW</div>
        <div class="comparison-card-body">
          <p class="comparison-item">○ &nbsp;Charity worksheets &amp; PDFs (free)</p>
          <p class="comparison-item">○ &nbsp;PSHE lesson plans (static, dated)</p>
          <p class="comparison-item">○ &nbsp;Oak National / BBC Bitesize</p>
          <p class="comparison-item">○ &nbsp;Think U Know (CEOP) — better, still web-only</p>
          <p class="comparison-item">○ &nbsp;No engaging game mechanic anywhere in category</p>
        </div>
      </div>
      <div class="comparison-card lf">
        <div class="comparison-card-header">WHERE ASSUMEZERO SITS</div>
        <div class="comparison-card-body">
          <p class="comparison-item">✓ &nbsp;Game mechanic, not worksheet</p>
          <p class="comparison-item">✓ &nbsp;Voluntary engagement on existing devices</p>
          <p class="comparison-item">✓ &nbsp;School-endorsed, home-played via ClassDojo</p>
          <p class="comparison-item">✓ &nbsp;KS2 &amp; KS3 curriculum-aligned</p>
          <p class="comparison-item">✓ &nbsp;Uncertainty-first — no false certainty</p>
        </div>
      </div>
    </div>
  </div>

  <div class="curriculum-strip">
    <div class="curriculum-label">CURRICULUM ALIGNMENT</div>
    <div class="curriculum-text">KS2: English (Reading Comprehension) · PSHE · Trust &amp; Authority<br>KS3+: Citizenship · Media Studies · English Language · Computing · Online Safety</div>
  </div>
</section>

<!-- LOOK & FEEL -->
<section class="lookfeel-section reveal">
  <div class="section-label cold" style="text-align:center">ASSUMEZERO — ASSUMEZERO · Visual Direction v1.0</div>
  <h2 class="section-headline cold" style="font-size: clamp(24px, 4vw, 42px); text-align:center; margin-bottom: 16px;">Two worlds. One lesson.</h2>
  <p class="lookfeel-sub" style="margin: 0 auto 48px; text-align:center;">The warm AssumeZero aesthetic and the sharp AssumeZero digital identity aren't two visual styles — they're the same mechanic expressed in two registers. Players feel the shift before they understand it.</p>

  <div class="phone-frames">
    <!-- Frame 1: Home Screen -->
    <div>
      <div class="phone-frame warm">
        <div class="phone-notch"><div class="phone-notch-bar"></div></div>
        <div class="phone-screen">
          <div class="phone-home-mockup">
            <div class="phone-home-crt">&lt;TRUTH&gt;</div>
            <div style="height:60px"></div>
            <div class="phone-home-title">Little<br>Fibbing</div>
            <div class="phone-home-btn">Start Delivery</div>
          </div>
        </div>
        <div class="phone-footer"><div class="phone-footer-bar"></div></div>
      </div>
      <div class="phone-caption">HOME SCREEN<br>AssumeZero world</div>
    </div>

    <!-- Frame 2: Gameplay -->
    <div>
      <div class="phone-frame warm">
        <div class="phone-notch"><div class="phone-notch-bar"></div></div>
        <div class="phone-screen">
          <div style="width:100%; height:100%; background: linear-gradient(180deg, #A8C4D0 0%, #8BAA80 35%, #7A9060 100%); position:relative; overflow:hidden;">
            <div style="position:absolute; top:0; left:0; right:0; height:36px; background: rgba(245,237,214,0.95); border-bottom: 2px solid #1E1A14; display:flex; align-items:center; justify-content:space-between; padding:0 10px;">
              <span style="font-family:'IBM Plex Mono',monospace; font-size:14px; font-weight:700; color:#1E1A14; letter-spacing:2px">0257</span>
              <span style="font-family:'IBM Plex Mono',monospace; font-size:8px; color:#8C7B68">ACT I</span>
            </div>
            <div style="position:absolute; top:36px; bottom:0; left:50%; transform:translateX(-50%); width:140px; background:#A09080;"></div>
            <!-- Gazette obstacle -->
            <div style="position:absolute; top:22%; right:15%; width:90px;">
              <div style="background:#D4873A; padding:3px 6px; font-family:'Georgia',serif; font-size:7px; font-weight:bold; color:#F5EDD6; border:1.5px solid #1E1A14; border-bottom:none">GAZETTE</div>
              <div style="background:#F5EDD6; padding:6px; border:1.5px solid #1E1A14; font-family:'Georgia',serif; font-size:8px; font-weight:bold; color:#1E1A14; line-height:1.2; text-align:center">BIG TURNIP<br>TO BREAK<br>RECORDS</div>
            </div>
            <!-- Runner -->
            <div style="position:absolute; bottom:30%; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center;">
              <div style="width:22px; height:12px; background:#3D6E6E; border-radius:50% 50% 0 0; border:1.5px solid #1E1A14; margin-bottom:-1px"></div>
              <div style="width:18px; height:18px; background:#E8C0A0; border-radius:50%; border:1.5px solid #1E1A14"></div>
              <div style="width:22px; height:24px; background:#3D6E6E; border:1.5px solid #1E1A14; border-radius:3px 3px 6px 6px"></div>
            </div>
            <!-- Lane labels -->
            <div style="position:absolute; bottom:16%; left:0; right:0; display:flex; justify-content:space-around; padding:0 16px;">
              <div style="background:#4A7C59CC; color:#F5EDD6; font-family:'IBM Plex Mono',monospace; font-size:8px; font-weight:bold; padding:3px 10px; border-radius:12px; letter-spacing:1px">LIKELY</div>
              <div style="background:#A64B2ACC; color:#F5EDD6; font-family:'IBM Plex Mono',monospace; font-size:8px; font-weight:bold; padding:3px 10px; border-radius:12px; letter-spacing:1px">UNLIKELY</div>
            </div>
          </div>
        </div>
        <div class="phone-footer"><div class="phone-footer-bar"></div></div>
      </div>
      <div class="phone-caption">GAMEPLAY<br>Lane mechanic, Act I</div>
    </div>

    <!-- Frame 3: Truthnet -->
    <div>
      <div class="phone-frame digital">
        <div class="phone-notch"><div class="phone-notch-bar"></div></div>
        <div class="phone-screen">
          <div style="width:100%; height:100%; background: linear-gradient(180deg, #8BAA80, #7A9060); position:relative; overflow:hidden; filter:blur(1.5px) brightness(0.7);">
            <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:140px; height:6px; background:#A09080"></div>
          </div>
          <!-- CRT panel overlay -->
          <div style="position:absolute; top:10%; right:4%; bottom:10%; width:56%; background:#0D0D0D; border:2px solid #00FF88; border-radius:4px; box-shadow: 0 0 20px rgba(0,255,136,0.4); padding:14px; overflow:hidden;">
            <div style="position:absolute; inset:0; background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,136,0.025) 3px, rgba(0,255,136,0.025) 6px); pointer-events:none;"></div>
            <div style="position:relative; z-index:2; font-family:'IBM Plex Mono',monospace; font-size:11px; line-height:1.7;">
              <div style="color:#39FF14; font-weight:bold; margin-bottom:6px; font-size:10px; letter-spacing:0.5px">TRUTHNET //</div>
              <div style="color:#00FF88">&gt; Mayor says biggest</div>
              <div style="color:#00FF88">&gt; &nbsp;&nbsp;turnip ever.</div>
              <div style="color:#00FF88; margin-top:6px">&gt; Which record?</div>
              <div style="color:#F5EDD6; font-style:italic; margin-top:6px; font-size:10px">&gt; Who keeps it?</div>
              <div style="color:#F5EDD6; font-style:italic; font-size:10px">&gt; Has anyone</div>
              <div style="color:#F5EDD6; font-style:italic; font-size:10px">&nbsp;&nbsp; checked?</div>
              <div style="color:#39FF14; font-weight:bold; margin-top:10px; letter-spacing:1px; font-size:10px">[ ASSUME ZERO ]</div>
            </div>
          </div>
        </div>
        <div class="phone-footer"><div class="phone-footer-bar"></div></div>
      </div>
      <div class="phone-caption" style="color:var(--phosphor)">TRUTHNET INTERRUPTION<br>AssumeZero breaks through</div>
    </div>
  </div>

  <!-- Palette strips -->
  <div class="palette-section">
    <div style="max-width:600px; margin:0 auto;">
      <div class="palette-label warm">ASSUMEZERO — WARM WORLD</div>
      <div class="palette-swatches" style="margin-bottom:36px;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:20px" >
          <div class="swatch" style="background:#D4873A"></div>
          <div class="swatch-hex" style="position:static;transform:none;">#D4873A</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:20px">
          <div class="swatch" style="background:#3D6E6E"></div>
          <div class="swatch-hex" style="position:static;transform:none;">#3D6E6E</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:20px">
          <div class="swatch" style="background:#A64B2A"></div>
          <div class="swatch-hex" style="position:static;transform:none;">#A64B2A</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:20px">
          <div class="swatch" style="background:#F5EDD6; border-color:rgba(0,0,0,0.2)"></div>
          <div class="swatch-hex" style="position:static;transform:none;">#F5EDD6</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:20px">
          <div class="swatch" style="background:#8C7B68"></div>
          <div class="swatch-hex" style="position:static;transform:none;">#8C7B68</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:20px">
          <div class="swatch" style="background:#4A7C59"></div>
          <div class="swatch-hex" style="position:static;transform:none;">#4A7C59</div>
        </div>
      </div>

      <div class="palette-label cold">ASSUMEZERO — DIGITAL WORLD</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:20px">
          <div class="swatch glowing" style="background:#00FF88;box-shadow:0 0 10px #00FF88;"></div>
          <div class="swatch-hex" style="position:static;transform:none;color:var(--phosphor)">#00FF88</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:20px">
          <div class="swatch" style="background:#0D0D0D;border-color:rgba(255,255,255,0.2)"></div>
          <div class="swatch-hex" style="position:static;transform:none;">#0D0D0D</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:20px">
          <div class="swatch glowing" style="background:#39FF14;box-shadow:0 0 10px #39FF14;"></div>
          <div class="swatch-hex" style="position:static;transform:none;color:#39FF14">#39FF14</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:20px">
          <div class="swatch glowing" style="background:#FF2D55;box-shadow:0 0 10px #FF2D55;"></div>
          <div class="swatch-hex" style="position:static;transform:none;color:#FF2D55">#FF2D55</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:20px">
          <div class="swatch" style="background:#1A1040;border-color:rgba(255,255,255,0.15)"></div>
          <div class="swatch-hex" style="position:static;transform:none;">#1A1040</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:20px">
          <div class="swatch" style="background:#FAFAF8;border-color:rgba(0,0,0,0.2)"></div>
          <div class="swatch-hex" style="position:static;transform:none;color:#666">#FAFAF8</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Type specimen -->
  <div class="type-specimen" style="max-width:600px;margin:0 auto;">
    <div class="type-col warm">
      <div class="type-eyebrow">PLAYFAIR DISPLAY — THE MAYOR'S WORLD</div>
      <div class="type-sample-warm">The truth is whatever I say it is.</div>
      <div class="type-sample-sub-warm">Warm · Authoritative · Slightly self-important</div>
    </div>
    <div class="type-col cold crt">
      <div class="type-eyebrow">IBM PLEX MONO — TRUTHNET</div>
      <div class="type-sample-cold">&gt; ASSUME NOTHING.<br>&gt; QUESTION EVERYTHING.<br>&gt; START FROM ZERO.</div>
    </div>
  </div>
</section>

<!-- STATUS -->
<section class="status-section crt reveal">
  <div class="section-label cold">CURRENT STATUS //</div>
  <div class="status-timestamp">&gt; last updated: February 2026</div>
  <h2 class="section-headline cold" style="font-size: clamp(22px, 3vw, 34px); position:relative; z-index:2;">Where we are. What's next.</h2>

  <div class="status-timeline">
    <div class="status-item">
      <div class="status-dot complete">✓</div>
      <div class="status-content">
        <div class="status-title" style="color:var(--phosphor)">COMPLETE — Visual Bible v1.0</div>
        <div class="status-desc">Full design system, character specifications, dual aesthetic architecture, asset priorities for Unity prototype, and age-tier system (KS2/KS3+). Available on request to designers and collaborators.</div>
      </div>
    </div>
    <div class="status-item">
      <div class="status-dot complete">✓</div>
      <div class="status-content">
        <div class="status-title" style="color:var(--phosphor)">COMPLETE — Concept Art Volumes I & II</div>
        <div class="status-desc">Interactive concept art covering home screen, gameplay, Truthnet interruption, Gazette front page, Mayor Grinwell character card, act escalation, results system, and KS3+ three-lane mechanics.</div>
      </div>
    </div>
    <div class="status-item">
      <div class="status-dot inprogress">◉</div>
      <div class="status-content">
        <div class="status-title" style="color:var(--mustard)">IN PROGRESS — Unity Prototype</div>
        <div class="status-desc">Core runner mechanic with placeholder assets. Target completion Q1 2026. Seeking short-engagement Unity developer (scoped brief available).</div>
      </div>
    </div>
    <div class="status-item">
      <div class="status-dot upcoming">○</div>
      <div class="status-content">
        <div class="status-title" style="color:var(--warm-grey)">UPCOMING — Playtest, KS2 Cohort</div>
        <div class="status-desc">Initial testing with 8–10 year olds. Felix, 9, is Chief Testing Officer. He has access to other 9-year-olds. This is considered a significant asset.</div>
      </div>
    </div>
    <div class="status-item">
      <div class="status-dot upcoming">○</div>
      <div class="status-content">
        <div class="status-title" style="color:var(--warm-grey)">UPCOMING — School Pilot Conversations</div>
        <div class="status-desc">Seeking 2–3 UK primary schools for initial endorsement and ClassDojo distribution pilot. No procurement required at this stage — we're asking heads to look at something and tell us honestly what they think.</div>
      </div>
    </div>
    <div class="status-item">
      <div class="status-dot upcoming">○</div>
      <div class="status-content">
        <div class="status-title" style="color:var(--warm-grey)">UPCOMING — Designer Engagement</div>
        <div class="status-desc">Minimum viable asset set defined in Visual Bible Section 8. Priority asset: News Runner character sprite sheet (8-frame run loop). Seeking children's illustrator, UK-based preferred. Full brief available.</div>
      </div>
    </div>
  </div>
</section>

<!-- THREE ASKS -->
<section class="asks-section reveal">
  <div class="section-label cold">WHAT I'M LOOKING FOR //</div>
  <h2 class="section-headline cold" style="font-size: clamp(22px, 3vw, 34px); position:relative; z-index:2;">Three clear asks. No fluff.</h2>
  <div class="asks-grid">
    <div class="ask-card">
      <div class="ask-icon">🏫</div>
      <div class="ask-title">EDUCATORS</div>
      <p class="ask-body">Are you a KS2 or KS3 teacher, PSHE lead, or headteacher? I'm looking for listening conversations — 30 minutes, no commitment — and 1–2 schools willing to endorse a pilot via ClassDojo.</p>
      <a href="https://www.arcturusdc.com/contact" class="ask-btn">GET IN TOUCH →</a>
    </div>
    <div class="ask-card">
      <div class="ask-icon">🎨</div>
      <div class="ask-title">DESIGNERS</div>
      <p class="ask-body">The Visual Bible is complete. I need a children's illustrator for character sprite sheets — specifically the News Runner (4 states, 8-frame run loop). Full brief and style references available immediately.</p>
      <a href="https://www.arcturusdc.com/contact" class="ask-btn">SEE THE BRIEF →</a>
    </div>
    <div class="ask-card">
      <div class="ask-icon">💷</div>
      <div class="ask-title">FUNDING</div>
      <p class="ask-body">Pre-seed. Looking for individuals or small funds who understand the edtech and consumer opportunity in media literacy for children. The market gap is real and documented. Happy to share research.</p>
      <a href="https://www.arcturusdc.com/contact" class="ask-btn">LET'S TALK →</a>
    </div>
  </div>
</section>

<!-- HOW A PILOT WORKS -->
<section class="pilot-section paper">
  <div class="section-label warm reveal">PILOT SCHOOLS //</div>
  <h2 class="section-headline warm reveal d1" style="font-size: clamp(22px, 3vw, 34px);">What a pilot actually looks like.</h2>

  <div class="pilot-grid reveal d2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; max-width: 900px; margin: 32px auto 0; align-items: start;">
    
    <div>
      <div style="display: flex; flex-direction: column; gap: 20px;">
        
        <div class="pilot-row reveal d2" style="display: flex; gap: 16px; align-items: flex-start;">
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--teal); font-weight: 700; letter-spacing: 1px; min-width: 72px; padding-top: 2px;">4 WEEKS</div>
          <div style="font-family: 'Lora', serif; font-size: 14px; color: var(--warm-grey); line-height: 1.6;">Structured pilot period. No commitment beyond the four weeks. Honest feedback at the end is the only ask.</div>
        </div>

        <div class="pilot-row reveal d3" style="display: flex; gap: 16px; align-items: flex-start;">
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--teal); font-weight: 700; letter-spacing: 1px; min-width: 72px; padding-top: 2px;">10 MIN</div>
          <div style="font-family: 'Lora', serif; font-size: 14px; color: var(--warm-grey); line-height: 1.6;">Per session. Designed to fit inside a PSHE slot or go home as voluntary play. No lesson planning required.</div>
        </div>

        <div class="pilot-row reveal d4" style="display: flex; gap: 16px; align-items: flex-start;">
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--teal); font-weight: 700; letter-spacing: 1px; min-width: 72px; padding-top: 2px;">ZERO PREP</div>
          <div style="font-family: 'Lora', serif; font-size: 14px; color: var(--warm-grey); line-height: 1.6;">No CPD, no marking, no moderation. Optional discussion prompts are available if teachers want them — but nothing requires teacher involvement to function.</div>
        </div>

        <div class="pilot-row reveal d5" style="display: flex; gap: 16px; align-items: flex-start;">
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--teal); font-weight: 700; letter-spacing: 1px; min-width: 72px; padding-top: 2px;">FREE</div>
          <div style="font-family: 'Lora', serif; font-size: 14px; color: var(--warm-grey); line-height: 1.6;">Pilot schools pay nothing. The exchange is access and honest feedback — both of which matter more at this stage than revenue.</div>
        </div>

      </div>
    </div>

    <div class="reveal d3">
      <div style="background: rgba(61,110,110,0.06); border: 1.5px solid rgba(61,110,110,0.2); border-radius: 6px; padding: 24px;">
        <div style="font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--teal); letter-spacing: 2px; margin-bottom: 16px;">STATUTORY ALIGNMENT</div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="font-family: 'Lora', serif; font-size: 13px; color: var(--warm-grey); line-height: 1.5; padding-left: 12px; border-left: 2px solid var(--teal);">Supports statutory RSHE digital literacy requirements (DfE 2021)</div>
          <div style="font-family: 'Lora', serif; font-size: 13px; color: var(--warm-grey); line-height: 1.5; padding-left: 12px; border-left: 2px solid var(--teal);">Supports Online Safety Act duties around critical evaluation of online content</div>
          <div style="font-family: 'Lora', serif; font-size: 13px; color: var(--warm-grey); line-height: 1.5; padding-left: 12px; border-left: 2px solid var(--teal);">KS2: English reading comprehension, PSHE — trust and authority</div>
          <div style="font-family: 'Lora', serif; font-size: 13px; color: var(--warm-grey); line-height: 1.5; padding-left: 12px; border-left: 2px solid var(--teal);">KS3+: Citizenship, Media Studies, Computing, Online Safety</div>
        </div>
        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(61,110,110,0.15); font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--warm-grey); line-height: 1.7;">
          Content is fictional and non-partisan throughout. No current events, no real political figures, no user-generated content. Designed to be parent-complaint-proof.
        </div>
      </div>
    </div>

  </div>

  <div class="reveal d5" style="text-align: center; margin-top: 40px;">
    <a href="mailto:david@arcturusdc.com?subject=Little Fibbing - Pilot school enquiry" 
       style="display: inline-block; font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 700; letter-spacing: 2px; color: var(--teal); border: 2px solid var(--teal); padding: 12px 32px; border-radius: 3px; text-decoration: none; transition: all 0.2s;"
       onmouseover="this.style.background='var(--teal)'; this.style.color='var(--parchment)'"
       onmouseout="this.style.background='transparent'; this.style.color='var(--teal)'">
      REGISTER PILOT INTEREST →
    </a>
    <div style="font-family: 'Lora', serif; font-size: 12px; color: var(--warm-grey); margin-top: 10px; font-style: italic;">Seeking 2–3 UK primary schools for Q2 2026. No commitment required at this stage.</div>
  </div>

</section>

<!-- ABOUT -->
<section class="about-section paper reveal">
  <div class="section-label warm">THE PERSON BEHIND IT //</div>
  <div class="about-grid">
    <div>
      <div class="about-portrait">
        <div class="about-portrait-box">
          <div class="about-initials">D</div>
        </div>
        <div class="about-caption">David · Founder<br>Arcturus Digital Consulting</div>
      </div>
    </div>
    <div>
      <div class="about-body">
        <p>I'm David, a product manager and app developer based in the UK. <em>Arcturus Digital Consulting</em> is where I build products that sit at the intersection of technology and everyday life.</p>
        <p>AssumeZero grew out of a question I couldn't stop asking: if the information environment is genuinely dangerous for children, why does every educational response to it look like it was made on a Sunday afternoon with a printer?</p>
        <p>My son Felix, 9, is my first tester, harshest critic, and Chief Testing Officer. He has access to other 9-year-olds. This is considered an asset.</p>
        <p>Background in digital product, analytics, and mobile development. Previous work includes Sprocket (calm admin support for anxious users) and STEa.</p>
        <p>AssumeZero is the most ambitious thing I've attempted. I think the timing is right.</p>
      </div>
      <div class="other-apps">
        <a href="/apps/sprocket" class="app-pill">Sprocket →</a>
        <a href="/apps/stea/explore" class="app-pill">STEa →</a>
        <a href="/apps" class="app-pill">All Apps →</a>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-crt">
    <span class="footer-crt-chip">ASSUME ZERO · ASK THE QUESTION · START FROM ZERO</span>
  </div>
  <div class="footer-links">
    <div class="footer-copy">© 2026 Arcturus Digital Consulting</div>
    <div class="footer-nav">
      <a href="/">Home</a>
      <a href="/apps">Apps</a>
      <a href="/contact">Contact</a>
      <a href="/privacy">Privacy</a>
    </div>
  </div>
</footer>

`,
      }}
    />
    </>
  );
}
