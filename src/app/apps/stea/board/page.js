'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query,
  serverTimestamp, updateDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/* -------------------- CONFIG -------------------- */
const COLUMNS = ['Idea', 'Planning', 'Design', 'Build', 'Done', "Won't Do"];

const TYPES = [
  { value: 'idea', label: 'Idea', emoji: '💡' },
  { value: 'feature', label: 'Feature', emoji: '✨' },
  { value: 'bug', label: 'Bug', emoji: '🐞' },
  { value: 'observation', label: 'Observation', emoji: '👀' },
];

const DEFAULT_APPS = ['Adhd Acclaim', 'Mandrake', 'SyncFit', 'Tou.Me', 'New App'];
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

/* -------------------- UTILITIES -------------------- */
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tokenize = (s) => String(s || '')
  .toLowerCase()
  .split(/[^a-z0-9]+/i)
  .filter(Boolean);

// robust localStorage state (handles old non-JSON values)
function usePersistentState(key, initial) {
  const [val, setVal] = useState(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const saved = localStorage.getItem(key);
      if (saved == null) return initial;
      try {
        return JSON.parse(saved);
      } catch {
        return typeof initial === 'string' ? saved : initial;
      }
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch { /* ignore */ }
  }, [key, val]);

  return [val, setVal];
}

function useSlashFocus(ref) {
  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const typingInField = tag === 'input' || tag === 'textarea';
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!typingInField) {
          e.preventDefault();
          ref.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ref]);
}

function highlightText(text, query) {
  if (!query) return text;
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return text;
  const re = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  const parts = String(text || '').split(re);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark>
      : <span key={i}>{part}</span>
  );
}

/* -------------------- COMMENTS -------------------- */
function CommentsSection({ cardId, user }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!cardId) return;
    const q = query(collection(db, 'stea_cards', cardId, 'comments'), orderBy('createdAt', 'asc'));
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
    } catch { return ''; }
  };

  return (
    <div className="mt-6">
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

      <div className="mt-3 flex items-start gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') addComment(); }}
          className="flex-1 px-3 py-2 border rounded min-h-[44px]"
          placeholder="Write a comment… (Ctrl/⌘+Enter to add)"
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

/* -------------------- ATTACHMENTS -------------------- */
const isPreviewableImage = (name = '', type = '') => {
  const t = type.toLowerCase();
  if (t.startsWith('image/')) return true;
  const ext = name.toLowerCase().split('.').pop();
  return ['png','jpg','jpeg','gif','webp','svg'].includes(ext);
};

function AttachmentsSection({ card, onAdd, onDelete, uploading }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleBrowse = () => inputRef.current?.click();
  const handleFiles = (files) => { if (!files?.length) return; onAdd(Array.from(files)); };

  return (
    <div className="mt-6">
      <div className="font-semibold mb-2">Attachments</div>

      {card?.id ? (
        <>
          <div
            className={`rounded border-2 border-dashed p-4 text-sm bg-gray-50
              ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div>Drag & drop files here</div>
              <div className="shrink-0">or</div>
              <button className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50" onClick={handleBrowse}>Browse…</button>
              <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </div>
            {uploading && <div className="mt-2 text-sm text-gray-600">Uploading…</div>}
          </div>

          <ul className="mt-3 space-y-2">
            {(card.attachments || []).length === 0 ? (
              <li className="text-sm text-gray-500">No files attached.</li>
            ) : (
              card.attachments.map((a, i) => (
                <li key={`${a.path}-${i}`} className="flex items-center justify-between gap-3 border rounded p-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {isPreviewableImage(a.name, a.contentType) ? (
                      <a href={a.url} target="_blank" rel="noreferrer" className="shrink-0">
                        <img src={a.url} alt={a.name} className="h-12 w-12 object-cover rounded border" referrerPolicy="no-referrer" />
                      </a>
                    ) : (
                      <div className="h-12 w-12 rounded border bg-gray-100 grid place-items-center text-xs text-gray-500">FILE</div>
                    )}
                    <a href={a.url} target="_blank" rel="noreferrer" className="truncate underline">{a.name}</a>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                    {typeof a.size === 'number' ? `${(a.size/1024).toFixed(1)} KB` : ''}
                    <button onClick={() => onDelete(a)} className="px-2 py-1 rounded border text-red-600 hover:bg-red-50">Delete</button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </>
      ) : (
        <div className="text-sm text-gray-500">Save the card first to attach files.</div>
      )}
    </div>
  );
}

/* -------------------- PAGE -------------------- */
export default function SteaBoard() {
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  // hide/show per column (default hide Won't Do)
  const [hiddenCols, setHiddenCols] = usePersistentState('stea-hidden-cols', { "Won't Do": true });

  // sorting
  const [sortMode, setSortMode] = usePersistentState('stea-sort-mode', 'none');

  // filters (created by, assigned to, App, Type)
  const [filters, setFilters] = usePersistentState('stea-filters', { reporter: '', assignee: '', app: '', type: '' });

  // dynamic Apps list (defaults + custom + discovered from cards)
  const [customApps, setCustomApps] = usePersistentState('stea-custom-apps', []);

  // progressive search (works like filters)
  const [search, setSearch] = usePersistentState('stea-search', '');
  const [matchMode, setMatchMode] = usePersistentState('stea-search-match', 'all'); // 'all' | 'any'
  const searchRef = useRef(null);
  useSlashFocus(searchRef);

  // modal/edit
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  // drag & drop
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // uploading
  const [uploading, setUploading] = useState(false);

  // per-card board expand state (non-persistent)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  /* ---------- one-time cleanup for legacy bad values ---------- */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const keys = [
      'stea-hidden-cols',
      'stea-sort-mode',
      'stea-filters',
      'stea-custom-apps',
      'stea-search',
      'stea-search-match',
    ];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v && (v === 'undefined' || v === 'null')) localStorage.removeItem(k);
    }
  }, []);

  /* ---------- auth ---------- */
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  /* ---------- data ---------- */
  useEffect(() => {
    const qy = query(collection(db, 'stea_cards'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(qy, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setCards(list);
    });
    return () => unsub();
  }, []);

  /* ---------- helpers ---------- */
  const appsList = useMemo(() => {
    const discovered = cards.map(c => c.app).filter(Boolean);
    return Array.from(new Set([...DEFAULT_APPS, ...customApps, ...discovered]));
  }, [cards, customApps]);

  const reporterOptions = useMemo(() => Array.from(new Set(cards.map(c => c.reporter).filter(Boolean))).sort(), [cards]);
  const assigneeOptions = useMemo(() => Array.from(new Set(cards.map(c => c.assignee).filter(Boolean))).sort(), [cards]);

  const matchesFilters = (c) => {
    if (!showArchived && c.archived) return false;
    if (filters.app && (c.app || '') !== filters.app) return false;
    if (filters.type && (c.type || '') !== filters.type) return false;
    if (filters.reporter && !(c.reporter || '').toLowerCase().includes(filters.reporter.toLowerCase())) return false;
    if (filters.assignee && !(c.assignee || '').toLowerCase().includes(filters.assignee.toLowerCase())) return false;
    return true;
  };

  const matchesSearch = (c) => {
    const q = (search || '').trim().toLowerCase();
    if (!q) return true;
    const terms = q.split(/\s+/).filter(Boolean);
    if (!terms.length) return true;

    const hay = [
      c.title, c.description, c.reporter, c.assignee,
      c.type, c.app, c.priority, c.sizeEstimate, c.appVersion, c.statusColumn
    ].map(x => (x || '').toString().toLowerCase()).join(' • ');

    if (matchMode === 'all') return terms.every(t => hay.includes(t));
    return terms.some(t => hay.includes(t));
  };

  /* ---------- derived ---------- */
  const grouped = useMemo(() => {
    const g = Object.fromEntries(COLUMNS.map((c) => [c, []]));
    for (const c of cards) {
      if (!matchesFilters(c)) continue;
      if (!matchesSearch(c)) continue;
      const col = c.statusColumn || 'Idea';
      if (!g[col]) g[col] = [];
      g[col].push(c);
    }
    return g;
  }, [cards, showArchived, filters, search, matchMode]);

  const visibleColumns = COLUMNS.filter((c) => !hiddenCols[c]);

  // priority comparator
  const getPriorityRank = (p) => {
    switch ((p || 'medium').toLowerCase()) {
      case 'critical': return 3;
      case 'high': return 2;
      case 'medium': return 1;
      case 'low': return 0;
      default: return 1;
    }
  };
  const compareByPriority = (a, b) => {
    const ar = getPriorityRank(a.priority);
    const br = getPriorityRank(b.priority);
    if (ar !== br) return sortMode === 'priority_desc' ? br - ar : ar - br;
    const at = a.createdAt?.toMillis?.() ?? (a.createdAt?._seconds ? a.createdAt._seconds * 1000 : 0);
    const bt = b.createdAt?.toMillis?.() ?? (b.createdAt?._seconds ? b.createdAt._seconds * 1000 : 0);
    return at - bt;
  };

  const buildSearchTokens = (card) => {
    const base = [
      card.title, card.description, card.reporter, card.assignee,
      card.type, card.app, card.priority, card.sizeEstimate, card.appVersion, card.statusColumn
    ].join(' ');
    return Array.from(new Set(tokenize(base))).slice(0, 200);
  };

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
      attachments: [],
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
      attachments: card.attachments || [],
      searchTokens: buildSearchTokens(card),
      updatedAt: serverTimestamp(),
      ...(card.createdAt ? {} : { createdAt: serverTimestamp() }),
    };

    if (card.id) {
      await updateDoc(doc(db, 'stea_cards', card.id), payload);
    } else {
      const refDoc = await addDoc(collection(db, 'stea_cards'), payload);
      setEditing({ ...card, id: refDoc.id });
    }
    setEditing(null);
    setCreating(false);
  };

  const deleteCard = async (id) => { if (!id) return; await deleteDoc(doc(db, 'stea_cards', id)); setEditing(null); };

  const moveTo = async (card, nextCol) => {
    await updateDoc(doc(db, 'stea_cards', card.id), { statusColumn: nextCol, updatedAt: serverTimestamp() });
  };

  /* ---------- attachments handlers ---------- */
  const addFiles = async (files) => {
    if (!editing?.id || !files?.length) return;
    setUploading(true);
    const storage = getStorage();
    const atts = [];

    for (const file of files) {
      const path = `stea_uploads/${editing.id}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type || undefined });
      const url = await getDownloadURL(storageRef);

      atts.push({
        name: file.name,
        path,
        url,
        size: file.size || null,
        contentType: file.type || '',
        createdAt: Date.now(),
        by: user?.email || 'anonymous',
      });
    }

    await updateDoc(doc(db, 'stea_cards', editing.id), { attachments: arrayUnion(...atts), updatedAt: serverTimestamp() });
    setEditing((c) => ({ ...c, attachments: [...(c.attachments || []), ...atts] }));
    setUploading(false);
  };

  const deleteFile = async (att) => {
    if (!editing?.id || !att?.path) return;
    const storage = getStorage();
    await deleteObject(ref(storage, att.path)).catch(() => {});
    await updateDoc(doc(db, 'stea_cards', editing.id), { attachments: arrayRemove(att), updatedAt: serverTimestamp() });
    setEditing((c) => ({ ...c, attachments: (c.attachments || []).filter((x) => x.path !== att.path) }));
  };

  /* ---------- UI bits ---------- */
  const ColumnHeader = ({ name, count }) => (
    <div className="mb-3 flex items-center justify-between">
      <div className="font-semibold">{name}</div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{count}</span>
        <button onClick={() => setHiddenCols((s) => ({ ...s, [name]: true }))} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Hide</button>
      </div>
    </div>
  );

  // double-tap logic (mobile)
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
    const expanded = !!expandedCards[card.id];

    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow transition break-words whitespace-normal cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-60' : ''}`}
        draggable
        onDragStart={(e) => { setDraggingId(card.id); e.dataTransfer.setData('text/stea-card-id', card.id); e.dataTransfer.effectAllowed = 'move'; }}
        onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
        onDoubleClick={() => setEditing(card)}
        onPointerDown={onCardPointerDown(card.id, card)}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <span className="px-2 py-0.5 text-[11px] rounded border bg-gray-50">
              {TYPES.find(t => t.value === card.type)?.emoji}{' '}
              {TYPES.find(t => t.value === card.type)?.label || 'Item'}
            </span>
            <span className={`px-2 py-0.5 text-[11px] rounded border ${appTheme[card.app || 'New App'] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
              {card.app || 'New App'}
            </span>
            <span className={`px-2 py-0.5 text-[11px] rounded border ${priorityTheme[card.priority || 'medium']}`}>
              {String(card.priority || 'medium').toUpperCase()}
            </span>
            <span className={`px-2 py-0.5 text-[11px] rounded border ${sizeTheme[card.sizeEstimate || 'M']}`}>
              Size {card.sizeEstimate || 'M'}
            </span>
            {card.statusColumn === 'Done' && card.appVersion ? (
              <span className="px-2 py-0.5 text-[11px] rounded border bg-green-50 text-green-800 border-green-200">v{card.appVersion}</span>
            ) : null}
          </div>
          <button onClick={() => setEditing(card)} className="px-2 py-1 text-xs rounded bg-gray-800 text-white hover:bg-black">Edit</button>
        </div>

        {/* CAPPED CONTENT AREA */}
        <div className={`relative ${expanded ? '' : 'max-h-64 overflow-hidden pr-1'}`}>
          <div className="font-semibold">{highlightText(card.title, search)}</div>
          {card.description ? (<p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{highlightText(card.description, search)}</p>) : null}

          {!expanded && (
            <>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent" />
              <div className="mt-2" />
            </>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={() => setExpandedCards((s) => ({ ...s, [card.id]: !expanded }))}
            className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50"
            title={expanded ? 'Collapse' : 'Expand to show full content'}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>

          <div className="text-xs text-gray-500">
            Reporter: {card.reporter || '—'}
            {card.assignee ? ` • Assigned: ${card.assignee}` : ''}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <button onClick={() => moveTo(card, prev)} className="px-2 py-1 text-xs rounded border hover:bg-gray-50" title={`Move to ${prev}`}>←</button>
          <button onClick={() => moveTo(card, next)} className="px-2 py-1 text-xs rounded border hover:bg-gray-50" title={`Move to ${next}`}>→</button>
          <button onClick={() => moveTo(card, 'Done')} className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700" title="Mark Done">✓ Done</button>
          <button onClick={() => moveTo(card, "Won't Do")} className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700" title="Move to Won't Do">↯ Won’t Do</button>
        </div>
      </div>
    );
  };

  const AddAppControl = () => {
    const [val, setVal] = useState('');
    const add = () => {
      const name = val.trim();
      if (!name) return;
      setCustomApps((prev) => Array.from(new Set([...(prev || []), name])));
      setVal('');
    };
    return (
      <div className="flex items-center gap-2">
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Add new app…" className="px-2 py-1.5 border rounded text-sm" />
        <button onClick={add} className="px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-black text-sm">Add App</button>
      </div>
    );
  };

  return (
    <main className="pb-10 max-w-[1400px] mx-auto px-4">
      {/* Header */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image className="rounded-2xl border border-black/10" src="/img/logo-mark.png" width={64} height={64} alt="Arcturus mark" priority />
        <div className="flex-1 min-w-0">
          <div className="font-extrabold">STEa — Board</div>
          <div className="text-muted text-sm">Manage ideas → build phases. Auto-saved to Firestore.</div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button onClick={startNew} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">+ New card</button>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              Show archived
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <span className="text-gray-600">Sort</span>
              <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} className="px-2 py-1.5 border rounded">
                <option value="none">None</option>
                <option value="priority_desc">Priority (High→Low)</option>
                <option value="priority_asc">Priority (Low→High)</option>
              </select>
            </label>

            {/* Progressive search */}
            <div className="relative flex-1 min-w-[220px] max-w-[420px]">
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, description, people, tags… (press /)"
                className="w-full px-3 py-2 pl-9 border rounded"
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">🔎</span>
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm px-1 py-0.5 border rounded hover:bg-gray-50"
                  title="Clear"
                >
                  ✕
                </button>
              ) : null}
            </div>

            <label className="inline-flex items-center gap-2 text-sm">
              <span className="text-gray-600">Terms</span>
              <select value={matchMode} onChange={(e) => setMatchMode(e.target.value)} className="px-2 py-1.5 border rounded">
                <option value="all">Match all</option>
                <option value="any">Match any</option>
              </select>
            </label>

            <div className="ml-auto flex items-center gap-3">
              {user && <span className="text-sm text-gray-600">{user.email}</span>}
              {user && (
                <button onClick={() => signOut(auth)} className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700">Sign out</button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mt-3 card p-3">
            <div className="text-xs text-gray-500 mb-2">Filters</div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="md:col-span-2 flex items-center gap-2">
                <label className="text-sm text-gray-600 shrink-0">Created by</label>
                <input list="reporterOptions" value={filters.reporter} onChange={(e) => setFilters({ ...filters, reporter: e.target.value })} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="email contains…" />
                <datalist id="reporterOptions">
                  {reporterOptions.map((r) => (<option value={r} key={r} />))}
                </datalist>
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <label className="text-sm text-gray-600 shrink-0">Assigned to</label>
                <input list="assigneeOptions" value={filters.assignee} onChange={(e) => setFilters({ ...filters, assignee: e.target.value })} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="name/email contains…" />
                <datalist id="assigneeOptions">
                  {assigneeOptions.map((a) => (<option value={a} key={a} />))}
                </datalist>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 shrink-0">App</label>
                <select value={filters.app} onChange={(e) => setFilters({ ...filters, app: e.target.value })} className="w-full px-2 py-1.5 border rounded text-sm">
                  <option value="">All</option>
                  {appsList.map((a) => (<option key={a} value={a}>{a}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 shrink-0">Type</label>
                <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="w-full px-2 py-1.5 border rounded text-sm">
                  <option value="">All</option>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setFilters({ reporter: '', assignee: '', app: '', type: '' })} className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50">Clear filters</button>
                <button onClick={() => setSearch('')} className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50">Clear search</button>
              </div>
              <AddAppControl />
            </div>
          </div>
        </div>
      </div>

      {/* Column visibility */}
      <div className="mt-4 card p-3">
        <div className="text-xs text-gray-500 mb-2">Columns</div>
        <div className="flex flex-wrap gap-2">
          {COLUMNS.map((c) => {
            const hidden = !!hiddenCols[c];
            return (
              <button
                key={c}
                onClick={() => setHiddenCols((s) => ({ ...s, [c]: !hidden }))}
                className={`px-3 py-1.5 rounded border text-sm ${hidden ? 'bg-white hover:bg-gray-50' : 'bg-gray-900 text-white hover:bg-black'}`}
                aria-pressed={!hidden}
              >
                {hidden ? `Show ${c}` : `Hide ${c}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Board */}
      <div className="mt-4 overflow-x-auto pb-2" style={{ scrollSnapType: 'x proximity' }}>
        <div className="flex gap-4 min-h-[420px]">
          {visibleColumns.map((col) => {
            const baseItems = grouped[col] || [];
            const items = sortMode === 'none' ? baseItems : [...baseItems].sort(compareByPriority);
            const isOver = dragOverCol === col;

            return (
              <section
                key={col}
                className={`card p-3 w-[340px] shrink-0 transition ${isOver ? 'ring-2 ring-blue-400' : ''}`}
                style={{ scrollSnapAlign: 'start' }}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col); e.dataTransfer.dropEffect = 'move'; }}
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
                  <div className="text-xs text-gray-500 p-3 border rounded bg-gray-50">Drop cards here</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {items.map((c) => <Card key={c.id} card={c} />)}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* Edit/Create modal */}
      {editing && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setEditing(null); setCreating(false); }} />
          <div className="relative z-10 flex min-h-full items-center justify-center p-4">
            <div role="dialog" aria-modal="true" className="w-full max-w-2xl rounded-xl bg-white shadow-lg max-h-[85vh] flex flex-col overscroll-contain">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <div className="font-bold">{creating ? 'New Card' : 'Edit Card'}</div>
                <button onClick={() => { setEditing(null); setCreating(false); }} className="px-3 py-1 rounded border hover:bg-gray-50">Close</button>
              </div>

              {/* description expand state (modal) */}
              <ModalBody
                editing={editing}
                setEditing={setEditing}
                creating={creating}
                saveCard={saveCard}
                deleteCard={deleteCard}
                addFiles={addFiles}
                deleteFile={deleteFile}
                uploading={uploading}
                user={user}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------- Modal Body split for cleaner local state ---------- */
function ModalBody({
  editing, setEditing, creating, saveCard, deleteCard,
  addFiles, deleteFile, uploading, user
}) {
  const [descExpanded, setDescExpanded] = useState(false);

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Title</label>
        <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="Short summary" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className="w-full px-3 py-2 border rounded">
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 flex items-center justify-between">
          <span>App</span>
          <button type="button" onClick={() => {
            const name = prompt('Add a new App name');
            if (!name) return;
            const trimmed = name.trim();
            if (!trimmed) return;
            // This relies on parent component state setter via closure – safe in this file structure.
            const ev = new CustomEvent('stea-add-app', { detail: trimmed });
            window.dispatchEvent(ev);
          }} className="text-xs px-2 py-1 rounded border hover:bg-gray-50">Add…</button>
        </label>
        <AppSelect editing={editing} setEditing={setEditing} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Priority</label>
        <select value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: e.target.value })} className="w-full px-3 py-2 border rounded">
          {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Column</label>
        <select value={editing.statusColumn} onChange={(e) => setEditing({ ...editing, statusColumn: e.target.value })} className="w-full px-3 py-2 border rounded">
          {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Size estimate</label>
        <select value={editing.sizeEstimate} onChange={(e) => setEditing({ ...editing, sizeEstimate: e.target.value })} className="w-full px-3 py-2 border rounded">
          {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">App version (for Done)</label>
        <input value={editing.appVersion} onChange={(e) => setEditing({ ...editing, appVersion: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="e.g. 1.3.0" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Reporter</label>
        <input value={editing.reporter} onChange={(e) => setEditing({ ...editing, reporter: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="email" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Assigned to</label>
        <input value={editing.assignee} onChange={(e) => setEditing({ ...editing, assignee: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="name or email" />
      </div>

      {/* Description with capped height and expand */}
      <div className="md:col-span-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium mb-1">Description</label>
          <button
            type="button"
            onClick={() => setDescExpanded(v => !v)}
            className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50"
            title={descExpanded ? 'Collapse description' : 'Expand description'}
          >
            {descExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
        <textarea
          value={editing.description}
          onChange={(e) => setEditing({ ...editing, description: e.target.value })}
          className={`w-full px-3 py-2 border rounded ${descExpanded ? 'min-h-[240px] max-h-[70vh] resize-y' : 'min-h-[96px] max-h-40 overflow-auto resize-none'}`}
          placeholder="Details, acceptance criteria, links…"
        />
      </div>

      <div className="md:col-span-2 flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!editing.archived} onChange={(e) => setEditing({ ...editing, archived: e.target.checked })} />
          Archived
        </label>
        <div className="flex gap-2">
          {!creating && editing.id ? (
            <button onClick={() => deleteCard(editing.id)} className="px-3 py-2 rounded border text-red-600 hover:bg-red-50">Delete</button>
          ) : null}
          <button onClick={() => saveCard(editing)} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
        </div>
      </div>

      {/* Attachments */}
      <div className="md:col-span-2">
        <AttachmentsSection
          card={editing}
          onAdd={addFiles}
          onDelete={deleteFile}
          uploading={uploading}
        />
      </div>

      {/* Comments */}
      {editing?.id ? (
        <div className="md:col-span-2">
          <CommentsSection cardId={editing.id} user={user} />
        </div>
      ) : null}
    </div>
  );
}

/* Hook up the App "Add…" button to the parent select without prop drilling */
function AppSelect({ editing, setEditing }) {
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    const handler = (e: any) => setOptions((prev) => Array.from(new Set([...(prev || []), e.detail])));
    window.addEventListener('stea-add-app', handler as any);
    return () => window.removeEventListener('stea-add-app', handler as any);
  }, []);

  // Fallback: user can still type a new value if not present
  return (
    <select
      value={editing.app}
      onChange={(e) => setEditing({ ...editing, app: e.target.value })}
      className="w-full px-3 py-2 border rounded"
    >
      {[...new Set([...DEFAULT_APPS, ...options])].map(a => <option key={a} value={a}>{a}</option>)}
    </select>
  );
}
