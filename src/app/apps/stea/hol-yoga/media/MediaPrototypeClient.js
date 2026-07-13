'use client';

import { useCallback, useRef, useState } from 'react';
import { useHolYogaAccess } from '../HolYogaAccessGate';
import { HolYogaHeader, HolYogaShell, PrototypeBadge, holColors } from '../HolYogaChrome';

// Field shape matches the app's real `practices` Firestore schema
// (holyoga repo, .sorr/DATA_MODEL.md) so this prototype demonstrates the
// actual form the real tool would need — not an invented one.
const CATEGORIES = [
  { value: 'meditation', label: 'Guided Meditation' },
  { value: 'chanting', label: 'Chanting' },
  { value: 'teaching', label: 'Teaching' },
  { value: 'music', label: 'Music' },
  { value: 'beginner', label: 'Beginner Practice' },
];

const ACCESS_LEVELS = [
  { value: 'free', label: 'Free — everyone' },
  { value: 'supporter', label: 'Supporter members' },
  { value: 'lifetime', label: 'Supporter + Lifetime members' },
];

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadedRow({ item, onRemove }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border p-4" style={{ borderColor: holColors.cream300 }}>
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg"
        style={{ backgroundColor: holColors.gold100 }}
      >
        {item.file.type.startsWith('video') ? '🎬' : '🎧'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: holColors.plum800 }}>
          {item.title || item.file.name}
        </p>
        <p className="text-xs" style={{ color: holColors.plum500 }}>
          {CATEGORIES.find((c) => c.value === item.category)?.label ?? 'Uncategorised'}
          {item.teacher ? ` · ${item.teacher}` : ''} · {formatBytes(item.file.size)}
        </p>
      </div>
      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{ backgroundColor: '#f6ecd6', color: holColors.gold500 }}
      >
        Ready to publish
      </span>
      <button
        onClick={() => onRemove(item.id)}
        className="shrink-0 text-xs underline"
        style={{ color: holColors.plum500 }}
      >
        Remove
      </button>
    </div>
  );
}

export default function MediaPrototypeClient() {
  const { ready, hasAccess, handleSignOut } = useHolYogaAccess();
  const [items, setItems] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('meditation');
  const [teacher, setTeacher] = useState('Padma');
  const [accessLevel, setAccessLevel] = useState('free');
  const inputRef = useRef(null);

  const handleFiles = useCallback((fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    setPendingFile(file);
    setTitle(file.name.replace(/\.[^.]+$/, ''));
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleAdd = () => {
    if (!pendingFile) return;
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), file: pendingFile, title, category, teacher, accessLevel },
    ]);
    setPendingFile(null);
    setTitle('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  if (!ready) return null;
  if (!hasAccess) return null;

  return (
    <HolYogaShell>
      <HolYogaHeader
        title="Practice library upload"
        subtitle="Add a guided meditation, chant, teaching, or music track"
        breadcrumb="Heart of Living Yoga"
        onSignOut={handleSignOut}
      />

      <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border p-5" style={{ borderColor: holColors.cream300, backgroundColor: holColors.gold100 }}>
        <p className="text-sm" style={{ color: holColors.plum800 }}>
          This is a prototype to show what uploading a new practice could feel like. Files stay on
          this page only — nothing here is saved, uploaded, or sent to the app yet. The real
          version would save straight into the practice library the app reads from.
        </p>
        <PrototypeBadge />
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="mb-6 cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition"
        style={{
          borderColor: dragOver ? holColors.pink500 : holColors.cream300,
          backgroundColor: dragOver ? holColors.gold100 : '#fdfbf6',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-3xl">🎵</p>
        <p className="mt-2 text-sm font-medium" style={{ color: holColors.plum800 }}>
          Drop an audio or video file here, or click to choose one
        </p>
        <p className="mt-1 text-xs" style={{ color: holColors.plum500 }}>
          MP3, M4A, WAV, MP4, or MOV
        </p>
      </div>

      {pendingFile && (
        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: holColors.cream300 }}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: holColors.gold500 }}>
            Details for {pendingFile.name}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-medium" style={{ color: holColors.plum500 }}>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: holColors.cream300, color: holColors.plum800 }}
              />
            </label>
            <label className="grid gap-1 text-xs font-medium" style={{ color: holColors.plum500 }}>
              Teacher
              <input
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: holColors.cream300, color: holColors.plum800 }}
              />
            </label>
            <label className="grid gap-1 text-xs font-medium" style={{ color: holColors.plum500 }}>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: holColors.cream300, color: holColors.plum800 }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium" style={{ color: holColors.plum500 }}>
              Who can access it
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: holColors.cream300, color: holColors.plum800 }}
              >
                {ACCESS_LEVELS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            onClick={handleAdd}
            className="mt-5 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: holColors.pink500 }}
          >
            Add to library (prototype only)
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: holColors.gold500 }}>
            Added this session ({items.length})
          </h2>
          <div className="space-y-3">
            {items.map((item) => (
              <UploadedRow key={item.id} item={item} onRemove={handleRemove} />
            ))}
          </div>
        </div>
      )}
    </HolYogaShell>
  );
}
