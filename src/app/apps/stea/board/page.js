'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query,
  serverTimestamp, updateDoc
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

/* -------------------- CONFIG -------------------- */
const COLUMNS = ['Idea', 'Planning', 'Design', 'Build', 'Done', "Won't Do"];

const TYPES = [
  { value: 'idea', label: 'Idea', emoji: '💡' },
  { value: 'feature', label: 'Feature', emoji: '✨' },
  { value: 'bug', label: 'Bug', emoji: '🐞' },
  { value: 'observation', label: 'Observation', emoji: '👀' },
];

const APPS = ['Adhd Acclaim', 'Mandrake', 'SyncFit', 'Tou.Me', 'New App'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', '?'];

const priorityTheme = {
  low:     'bg-emerald-50 text-emerald-800 border-emerald-200',
  medium:  'bg-amber-50 text-amber-800 border-amber-200',
  high:    'bg-orange-50 text-orange-800 border-orange-200',
  critical:'bg-red-50 text-red-800 border-red-200',
};

const appTheme = {
  'Adhd Acclaim': 'bg-violet-50 text-violet-800 border-violet-200',
  'Mandrake':     'bg-sky-50 text-sky-800 border-sky-200',
  'SyncFit':      'bg-green-50 text-green-800 border-green-200',
  'Tou.Me':       'bg-pink-50 text-pink-800 border-pink-200',
  'New App':      'bg-gray-50 text-gray-700 border-gray-200',
};

const sizeTheme = {
  XS: 'bg-slate-50 text-slate-700 border-slate-200',
  S:  'bg-slate-50 text-slate-700 border-slate-200',
  M:  'bg-blue-50 text-blue-800 border-blue-200',
  L:  'bg-indigo-50 text-indigo-800 border-indigo-200',
  XL: 'bg-purple-50 text-purple-800 border-purple-200',
  '?': 'bg-zinc-50 text-zinc-700 border-zinc-200',
};

/* -------------------- COMMENTS SECTION -------------------- */
function CommentsSection({ cardId, user }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!cardId) return;
    const q = query(
      collection(db, 'stea_cards', cardId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setComments(list);
    });
    return () => unsub();
  }, [cardId]);

  const addComment = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAdding(true);
    await addDoc(collection(db, 'stea_cards', cardId, 'comments'), {
      text: trimmed,
      commenter: user?.email || 'anonymous',
      createdAt: serverTimestamp(),
    });
    setText('');
    setAdding(false);
  };

  const removeComment = async (cid) => {
    await deleteDoc(doc(db, 'stea_cards', cardId, 'comments', cid));
  };

  const formatTime = (ts) => {
    try {
      const ms = ts?.toMillis?.() ?? (ts?._seconds ? ts._seconds * 1000 : null);
      if (!ms) return '';
      return new Date(ms).toLocaleString();
    } catch {
      return '';
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Comments</div>
        <div className="text-xs text-gray-500">{comments.length}</div>
      </div>

      <div className="space-y-2 max-h-60 overflow-auto pr-1">
        {comments.length === 0 ? (
          <div className="text-sm text-gray-500">No comments yet.</div>
        ) : comments.map((c) => (
          <div key={c.id} className="border rounded p-2 bg-gray-50">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm whitespace-pre-wrap break-words">{c.text}</div>
              <button
                onClick={() => removeComment(c.id)}
                className="text-xs px-2 py-1 rounded border hover:bg-red-50 text-red-600"
                title="Delete comment"
              >
                Delete
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              From {c.commenter || '—'} • {formatTime(c.createdAt)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
          placeholder="Write a comment…"
        />
        <button
          onClick={addComment}
          disabled={adding}
          className="px-3 py-2 rounded bg-gray-900 text-white hover:bg-black disabled:opacity-60"
        >
          {adding ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  );
}

/* -------------------- PAGE -------------------- */
export default function SteaBoard() {
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  // true hide/show per column (default hide Won't Do)
  const [hiddenCols, setHiddenCols] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stea-hidden-cols');
      if (saved) return JSON.parse(saved);
    }
    return { "Won't Do": true };
  });

  // sorting
  // 'none' | 'priority_desc' (critical → low) | 'priority_asc' (low → critical)
  const [sortMode, setSortMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stea-sort-mode') || 'none';
    }
    return 'none';
  });

  // editing
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  // drag & drop
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  /* ---------- auth ---------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  /* ---------- data ---------- */
  useEffect(() => {
    const q = query(collection(db, 'stea_cards'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setCards(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem('stea-hidden-cols', JSON.stringify(hiddenCols));
  }, [hiddenCols]);

  useEffect(() => {
    localStorage.setItem('stea-sort-mode', sortMode);
  }, [sortMode]);

  /* ---------- derived ---------- */
  const grouped = useMemo(() => {
    const g = Object.fromEntries(COLUMNS.map((c) => [c, []]));
    for (const c of cards) {
      if (!showArchived && c.archived) continue;
      const col = c.statusColumn || 'Idea';
      if (!g[col]) g[col] = [];
      g[col].push(c);
    }
    return g;
  }, [cards, showArchived]);

  const visibleColumns = COLUMNS.filter((c) => !hiddenCols[c]);

  // priority comparator
  const getPriorityRank = (p) => {
    switch ((p || 'medium').toLowerCase()) {
      case 'critical': return 3;
      case 'high': return 2;
      case 'medium': return 1;
      case 'low': return 0;
      default: return 1; // treat unknown like medium
    }
  };

  const compareByPriority = (a, b) => {
    const ar = getPriorityRank(a.priority);
    const br = getPriorityRank(b.priority);
    if (ar !== br) {
      return sortMode === 'priority_desc' ? br - ar : ar - br;
    }
    // tie-breaker: createdAt asc (older first)
    const at = a.createdAt?.toMillis?.() ?? (a.createdAt?._seconds ? a.createdAt._seconds * 1000 : 0);
    const bt = b.createdAt?.toMillis?.() ?? (b.createdAt?._seconds ? b.createdAt._seconds * 1000 : 0);
    return at - bt;
  };

  /* ---------- helpers ---------- */
  const startNew = () => {
    setEditing({
      id: null,
      title: '',
      description: '',
      type: 'idea',
      app: 'New App',
      priority: 'medium',
      reporter: user?.email || '',
      assignee: '',
      sizeEstimate: 'M',
      appVersion: '',
      statusColumn: 'Idea',
      archived: false,
    });
    setCreating(true);
  };

  const saveCard = async (card) => {
    const payload = {
      title: (card.title || '').trim() || 'Untitled',
      description: card.description || '',
      type: card.type || 'idea',
      app: card.app || 'New App',
      priority: card.priority || 'medium',
      reporter: card.reporter || user?.email || '',
      assignee: card.assignee || '',
      sizeEstimate: card.sizeEstimate || 'M',
      appVersion: card.appVersion || '',
      statusColumn: card.statusColumn || 'Idea',
      archived: !!card.archived,
      updatedAt: serverTimestamp(),
      ...(card.createdAt ? {} : { createdAt: serverTimestamp() }),
    };

    if (card.id) {
      await updateDoc(doc(db, 'stea_cards', card.id), payload);
    } else {
      const ref = await addDoc(collection(db, 'stea_cards'), payload);
      // attach the new id so the modal keeps working consistently
      setEditing({ ...card, id: ref.id });
    }
    setEditing(null);
    setCreating(false);
  };

  const deleteCard = async (id) => {
    if (!id) return;
    await deleteDoc(doc(db, 'stea_cards', id));
    setEditing(null);
  };

  const moveTo = async (card, nextCol) => {
    await updateDoc(doc(db, 'stea_cards', card.id), {
      statusColumn: nextCol,
      updatedAt: serverTimestamp(),
    });
  };

  /* ---------- UI bits ---------- */
  const ColumnHeader = ({ name, count }) => (
    <div className="mb-3 flex items-center justify-between">
      <div className="font-semibold">{name}</div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{count}</span>
        <button
          onClick={() => setHiddenCols((s) => ({ ...s, [name]: true }))}
          className="px-2 py-1 text-xs rounded border hover:bg-gray-50"
        >
          Hide
        </button>
      </div>
    </div>
  );

  // double-tap logic
  const tapTimes = useRef({});
  const onCardPointerDown = (cardId, card) => () => {
    const now = Date.now();
    const last = tapTimes.current[cardId] || 0;
    tapTimes.current[cardId] = now;
    if (now - last < 300) setEditing(card);
  };

  const Card = ({ card }) => {
    const idx = COLUMNS.indexOf(card.statusColumn || 'Idea');
    const prev = COLUMNS[Math.max(idx - 1, 0)];
    const next = COLUMNS[Math.min(idx + 1, COLUMNS.length - 1)];
    const isDragging = draggingId === card.id;

    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow transition break-words whitespace-normal cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-60' : ''}`}
        draggable
        onDragStart={(e) => {
          setDraggingId(card.id);
          e.dataTransfer.setData('text/stea-card-id', card.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
        onDoubleClick={() => setEditing(card)}
        onPointerDown={onCardPointerDown(card.id, card)}
      >
        {/* Top row: badges + edit */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <span className="px-2 py-0.5 text-[11px] rounded border bg-gray-50">
              {TYPES.find(t => t.value === card.type)?.emoji}{' '}
              {TYPES.find(t => t.value === card.type)?.label || 'Item'}
            </span>
            <span className={`px-2 py-0.5 text-[11px] rounded border ${appTheme[card.app || 'New App']}`}>
              {card.app || 'New App'}
            </span>
            <span className={`px-2 py-0.5 text-[11px] rounded border ${priorityTheme[card.priority || 'medium']}`}>
              {String(card.priority || 'medium').toUpperCase()}
            </span>
            <span className={`px-2 py-0.5 text-[11px] rounded border ${sizeTheme[card.sizeEstimate || 'M']}`}>
              Size {card.sizeEstimate || 'M'}
            </span>
            {card.statusColumn === 'Done' && card.appVersion ? (
              <span className="px-2 py-0.5 text-[11px] rounded border bg-green-50 text-green-800 border-green-200">
                v{card.appVersion}
              </span>
            ) : null}
          </div>
          <button
            onClick={() => setEditing(card)}
            className="px-2 py-1 text-xs rounded bg-gray-800 text-white hover:bg-black"
          >
            Edit
          </button>
        </div>

        <div className="font-semibold">{card.title}</div>
        {card.description ? (
          <p className="text-sm text-gray-600 mt-1">{card.description}</p>
        ) : null}

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Reporter: {card.reporter || '—'}
            {card.assignee ? ` • Assigned: ${card.assignee}` : ''}
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => moveTo(card, prev)}
              className="px-2 py-1 text-xs rounded border hover:bg-gray-50"
              title={`Move to ${prev}`}
            >
              ←
            </button>
            <button
              onClick={() => moveTo(card, next)}
              className="px-2 py-1 text-xs rounded border hover:bg-gray-50"
              title={`Move to ${next}`}
            >
              →
            </button>
            <button
              onClick={() => moveTo(card, 'Done')}
              className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
              title="Mark Done"
            >
              ✓ Done
            </button>
            <button
              onClick={() => moveTo(card, "Won't Do")}
              className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
              title="Move to Won't Do"
            >
              ↯ Won’t Do
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="pb-10 max-w-[1400px] mx-auto px-4">
      {/* Header */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10"
          src="/img/logo-mark.png"
          width={64}
          height={64}
          alt="Arcturus mark"
          priority
        />
        <div className="flex-1 min-w-0">
          <div className="font-extrabold">STEa — Board</div>
          <div className="text-muted text-sm">
            Manage ideas → build phases. Auto-saved to Firestore.
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={startNew}
              className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              + New card
            </button>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Show archived
            </label>

            {/* Sort control */}
            <label className="inline-flex items-center gap-2 text-sm">
              <span className="text-gray-600">Sort</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="px-2 py-1.5 border rounded"
              >
                <option value="none">None</option>
                <option value="priority_desc">Priority (High→Low)</option>
                <option value="priority_asc">Priority (Low→High)</option>
              </select>
            </label>

            <div className="ml-auto flex items-center gap-3">
              {user && <span className="text-sm text-gray-600">{user.email}</span>}
              {user && (
                <button
                  onClick={() => signOut(auth)}
                  className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Column visibility toolbar */}
      <div className="mt-4 card p-3">
        <div className="text-xs text-gray-500 mb-2">Columns</div>
        <div className="flex flex-wrap gap-2">
          {COLUMNS.map((c) => {
            const hidden = !!hiddenCols[c];
            return (
              <button
                key={c}
                onClick={() => setHiddenCols((s) => ({ ...s, [c]: !hidden }))}
                className={`px-3 py-1.5 rounded border text-sm ${
                  hidden
                    ? 'bg-white hover:bg-gray-50'
                    : 'bg-gray-900 text-white hover:bg-black'
                }`}
                aria-pressed={!hidden}
              >
                {hidden ? `Show ${c}` : `Hide ${c}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Board: horizontal scroll with DnD; only visible columns rendered */}
      <div className="mt-4 overflow-x-auto pb-2" style={{ scrollSnapType: 'x proximity' }}>
        <div className="flex gap-4 min-h-[420px]">
          {visibleColumns.map((col) => {
            const baseItems = grouped[col] || [];
            const items =
              sortMode === 'none'
                ? baseItems
                : [...baseItems].sort(compareByPriority);

            const isOver = dragOverCol === col;

            return (
              <section
                key={col}
                className={`card p-3 w-[340px] shrink-0 transition ${
                  isOver ? 'ring-2 ring-blue-400' : ''
                }`}
                style={{ scrollSnapAlign: 'start' }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCol(col);
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={async (e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('text/stea-card-id');
                  setDragOverCol(null);
                  setDraggingId(null);
                  if (!id) return;
                  const card = cards.find((c) => c.id === id);
                  if (!card || card.statusColumn === col) return;
                  await moveTo(card, col);
                }}
              >
                <ColumnHeader name={col} count={items.length} />
                {items.length === 0 ? (
                  <div className="text-xs text-gray-500 p-3 border rounded bg-gray-50">
                    Drop cards here
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {items.map((c) => (
                      <Card key={c.id} card={c} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* Edit/Create modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="font-bold">{creating ? 'New Card' : 'Edit Card'}</div>
              <button
                onClick={() => { setEditing(null); setCreating(false); }}
                className="px-3 py-1 rounded border hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Short summary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={editing.type}
                  onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  {TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">App</label>
                <select
                  value={editing.app}
                  onChange={(e) => setEditing({ ...editing, app: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  {APPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={editing.priority}
                  onChange={(e) => setEditing({ ...editing, priority: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  {['low','medium','high','critical'].map(p =>
                    <option key={p} value={p}>{p}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Column</label>
                <select
                  value={editing.statusColumn}
                  onChange={(e) => setEditing({ ...editing, statusColumn: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Size estimate</label>
                <select
                  value={editing.sizeEstimate}
                  onChange={(e) => setEditing({ ...editing, sizeEstimate: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">App version (for Done)</label>
                <input
                  value={editing.appVersion}
                  onChange={(e) => setEditing({ ...editing, appVersion: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g. 1.3.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reporter</label>
                <input
                  value={editing.reporter}
                  onChange={(e) => setEditing({ ...editing, reporter: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assigned to</label>
                <input
                  value={editing.assignee}
                  onChange={(e) => setEditing({ ...editing, assignee: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="name or email"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded min-h-[96px]"
                  placeholder="Details, acceptance criteria, links…"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!editing.archived}
                    onChange={(e) => setEditing({ ...editing, archived: e.target.checked })}
                  />
                  Archived
                </label>

                <div className="flex gap-2">
                  {!creating && editing.id ? (
                    <button
                      onClick={() => deleteCard(editing.id)}
                      className="px-3 py-2 rounded border text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  ) : null}
                  <button
                    onClick={() => saveCard(editing)}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* ---- Comments (live) ---- */}
              {editing?.id ? (
                <div className="md:col-span-2">
                  <CommentsSection cardId={editing.id} user={user} />
                </div>
              ) : null}

            </div>
          </div>
        </div>
      )}
    </main>
  );
}
