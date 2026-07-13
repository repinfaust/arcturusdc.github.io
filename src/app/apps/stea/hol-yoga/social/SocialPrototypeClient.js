'use client';

import { useState } from 'react';
import { useHolYogaAccess } from '../HolYogaAccessGate';
import { HolYogaHeader, HolYogaShell, PrototypeBadge, holColors } from '../HolYogaChrome';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: '📘', accent: '#1877F2' },
  { id: 'instagram', label: 'Instagram', icon: '📷', accent: '#C13584' },
];

const DEMO_QUEUE = [
  {
    id: 1,
    platform: 'instagram',
    when: 'Tomorrow, 8:00am',
    caption: 'Heart words for today: "Kindness to yourself is the first posture of yoga." 🙏',
    imageLabel: 'lotus-meditation.jpg',
  },
  {
    id: 2,
    platform: 'facebook',
    when: 'Fri, 6:30pm',
    caption: 'Join us for the Evening Heart Meditation — held daily, all welcome. Link in the app.',
    imageLabel: 'community-assisi.jpg',
  },
];

function ConnectCard({ platform, connected, onToggle }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: holColors.cream300 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{platform.icon}</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: holColors.plum800 }}>{platform.label}</p>
            <p className="text-xs" style={{ color: holColors.plum500 }}>
              {connected ? 'Connected (demo)' : 'Not connected'}
            </p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium transition"
          style={
            connected
              ? { borderColor: holColors.cream300, color: holColors.plum500 }
              : { backgroundColor: platform.accent, color: '#fff', borderColor: platform.accent }
          }
        >
          {connected ? 'Disconnect' : 'Connect account'}
        </button>
      </div>
    </div>
  );
}

function QueueItem({ post }) {
  const platform = PLATFORMS.find((p) => p.id === post.platform);
  return (
    <div className="flex items-start gap-4 rounded-xl border p-4" style={{ borderColor: holColors.cream300 }}>
      <span className="text-xl">{platform.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold" style={{ color: holColors.gold500 }}>{post.when}</p>
        <p className="mt-1 text-sm" style={{ color: holColors.plum800 }}>{post.caption}</p>
        <p className="mt-1 text-xs" style={{ color: holColors.plum500 }}>Image: {post.imageLabel}</p>
      </div>
      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{ backgroundColor: '#f6ecd6', color: holColors.gold500 }}
      >
        Scheduled (demo)
      </span>
    </div>
  );
}

export default function SocialPrototypeClient() {
  const { ready, hasAccess, handleSignOut } = useHolYogaAccess();
  const [connections, setConnections] = useState({ facebook: true, instagram: false });
  const [caption, setCaption] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [queue, setQueue] = useState(DEMO_QUEUE);
  const [message, setMessage] = useState('');

  if (!ready) return null;
  if (!hasAccess) return null;

  const toggleConnection = (id) => {
    setConnections((prev) => ({ ...prev, [id]: !prev[id] }));
    setMessage(`Prototype only — no real ${PLATFORMS.find((p) => p.id === id)?.label} account was connected.`);
  };

  const handleSchedule = (e) => {
    e.preventDefault();
    if (!caption.trim()) return;
    setQueue((prev) => [
      { id: Date.now(), platform, when: 'Draft — not scheduled', caption, imageLabel: 'No image attached' },
      ...prev,
    ]);
    setCaption('');
    setMessage('Prototype only — this was added to the demo queue below, not posted anywhere.');
  };

  return (
    <HolYogaShell>
      <HolYogaHeader
        title="Social media"
        subtitle="Plan posts for Facebook and Instagram"
        breadcrumb="Heart of Living Yoga"
        onSignOut={handleSignOut}
      />

      <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border p-5" style={{ borderColor: holColors.cream300, backgroundColor: holColors.gold100 }}>
        <p className="text-sm" style={{ color: holColors.plum800 }}>
          This is a prototype to show what planning social posts from one place could look like.
          No Facebook or Instagram account is actually connected, and nothing here is ever posted.
        </p>
        <PrototypeBadge />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLATFORMS.map((p) => (
          <ConnectCard key={p.id} platform={p} connected={connections[p.id]} onToggle={() => toggleConnection(p.id)} />
        ))}
      </div>

      <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: holColors.cream300 }}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: holColors.gold500 }}>
          Plan a post
        </h2>
        <form onSubmit={handleSchedule} className="grid gap-4">
          <div className="flex gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium transition"
                style={
                  platform === p.id
                    ? { backgroundColor: holColors.pink500, color: '#fff', borderColor: holColors.pink500 }
                    : { borderColor: holColors.cream300, color: holColors.plum500 }
                }
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption — e.g. today's Heart Words, or a reminder about the evening meditation…"
            rows={3}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: holColors.cream300, color: holColors.plum800 }}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: holColors.plum500 }}>
              An image picker and scheduling calendar would go here in the real version.
            </p>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              style={{ backgroundColor: holColors.pink500 }}
            >
              Add to queue (prototype)
            </button>
          </div>
        </form>
        {message && <p className="mt-3 text-sm" style={{ color: holColors.gold500 }}>{message}</p>}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: holColors.gold500 }}>
          Queue
        </h2>
        <div className="space-y-3">
          {queue.map((post) => (
            <QueueItem key={post.id} post={post} />
          ))}
        </div>
      </div>
    </HolYogaShell>
  );
}
