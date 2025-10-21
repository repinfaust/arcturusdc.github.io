'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

const COLLECTION_MAP = {
  card: 'stea_cards',
  feature: 'stea_features',
  epic: 'stea_epics',
};

const ENTITY_LABEL = {
  card: 'Card',
  feature: 'Feature',
  epic: 'Epic',
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
    } catch {}
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

const getDocLabel = (doc) => (
  doc?.label ||
  doc?.name ||
  doc?.title ||
  doc?.shortName ||
  doc?.code ||
  doc?.reference ||
  doc?.id ||
  ''
);

const normalizeId = (value) => {
  if (value == null) return '';
  const asString = String(value).trim();
  return asString.toLowerCase() === 'null' ? '' : asString;
};

const getEntityCollection = (entityType = 'card') => COLLECTION_MAP[entityType] || COLLECTION_MAP.card;

const sortLayers = (entries) => {
  return [...entries].sort((a, b) => {
    const aOrder = Number.isFinite(a?.order) ? a.order : Number.isFinite(a?.sortOrder) ? a.sortOrder : Number.MAX_SAFE_INTEGER;
    const bOrder = Number.isFinite(b?.order) ? b.order : Number.isFinite(b?.sortOrder) ? b.sortOrder : Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return getDocLabel(a).localeCompare(getDocLabel(b));
  });
};

/* -------------------- COMMENTS -------------------- */
function CommentsSection({ entityCollection, entityId, user }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!entityCollection || !entityId) return;
    const q = query(collection(db, entityCollection, entityId, 'comments'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setComments(list);
    });
    return () => unsub();
  }, [entityCollection, entityId]);

  const addComment = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAdding(true);
    await addDoc(collection(db, entityCollection, entityId, 'comments'), {
      text: trimmed,
      commenter: user?.email || 'anonymous',
      createdAt: serverTimestamp(),
    });
    setText('');
    setAdding(false);
  };

  const removeComment = async (cid) => {
    await deleteDoc(doc(db, entityCollection, entityId, 'comments', cid));
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
  const entityLabel = ENTITY_LABEL[card?.entityType || 'card'] || 'Card';

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
        <div className="text-sm text-gray-500">Save the {entityLabel.toLowerCase()} first to attach files.</div>
      )}
    </div>
  );
}

/* -------------------- PAGE -------------------- */
export default function SteaBoard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [cards, setCards] = useState([]);
  const [epics, setEpics] = useState([]);
  const [features, setFeatures] = useState([]);
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

  // new menu
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const newMenuRef = useRef(null);

  // drag & drop
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dragOverEpic, setDragOverEpic] = useState('');
  const [dragOverFeature, setDragOverFeature] = useState('');

  // uploading
  const [uploading, setUploading] = useState(false);

  // per-card board expand state (non-persistent)
  const [expandedCards, setExpandedCards] = useState({});
  const [peekLevels, setPeekLevels] = useState({}); // Track peek state per card
  const [collapsedFeatures, setCollapsedFeatures] = useState({}); // Track collapsed state per feature
  const [hoveredLayer, setHoveredLayer] = useState(null); // Track which epic/feature is being hovered
  const [peeking, setPeeking] = useState(null); // Track which epic/feature is being peeked (click+hold on title)

  useEffect(() => {
    if (!newMenuOpen) return;
    const handle = (event) => {
      if (!newMenuRef.current?.contains(event.target)) {
        setNewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('focusin', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('focusin', handle);
    };
  }, [newMenuOpen]);

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
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        const next = encodeURIComponent('/apps/stea/board');
        router.replace(`/apps/stea?next=${next}`);
      }
    });
    return () => unsubscribe();
  }, [router]);

  /* ---------- data ---------- */
  useEffect(() => {
    if (!user) {
      setCards([]);
      return undefined;
    }
    const qy = query(collection(db, 'stea_cards'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(qy, (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          ...data,
          type: data.type || 'idea',
          entityType: 'card',
          epicId: normalizeId(data.epicId),
          featureId: normalizeId(data.featureId),
          epicLabel: data.epicLabel || '',
          featureLabel: data.featureLabel || '',
        });
      });
      setCards(list);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setEpics([]);
      setFeatures([]);
      return undefined;
    }
    const epicsRef = collection(db, 'stea_epics');
    const featuresRef = collection(db, 'stea_features');

    const unsubscribeEpics = onSnapshot(epicsRef, (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          ...data,
          type: data.type || 'epic',
          entityType: 'epic',
          epicId: normalizeId(d.id),
        });
      });
      setEpics(sortLayers(list));
    });

    const unsubscribeFeatures = onSnapshot(featuresRef, (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          ...data,
          type: data.type || 'feature',
          entityType: 'feature',
          epicId: normalizeId(data.epicId),
        });
      });
      setFeatures(sortLayers(list));
    });

    return () => {
      unsubscribeEpics();
      unsubscribeFeatures();
    };
  }, [user]);

  const epicMap = useMemo(() => {
    const map = {};
    for (const epic of epics) {
      map[epic.id] = epic;
    }
    return map;
  }, [epics]);

  const featureMap = useMemo(() => {
    const map = {};
    for (const feature of features) {
      map[feature.id] = feature;
    }
    return map;
  }, [features]);

  const featuresByEpic = useMemo(() => {
    const grouped = {};
    for (const feature of features) {
      const key = normalizeId(feature.epicId);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(feature);
    }
    Object.keys(grouped).forEach((key) => {
      grouped[key] = sortLayers(grouped[key]);
    });
    return grouped;
  }, [features]);

  const cardsByFeature = useMemo(() => {
    const grouped = {};
    for (const card of cards) {
      const key = normalizeId(card.featureId);
      grouped[key] = (grouped[key] || 0) + 1;
    }
    return grouped;
  }, [cards]);

  const cardsByEpic = useMemo(() => {
    const grouped = {};
    for (const card of cards) {
      const key = normalizeId(card.epicId);
      grouped[key] = (grouped[key] || 0) + 1;
    }
    return grouped;
  }, [cards]);

  const unassignedFeatures = featuresByEpic[''] || [];

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

    const featureDoc = c.featureId ? featureMap[c.featureId] : null;
    const epicDoc = c.epicId ? epicMap[c.epicId] : (featureDoc?.epicId ? epicMap[featureDoc.epicId] : null);
    const featureLabel = getDocLabel(featureDoc) || (c.featureLabel || '');
    const epicLabel = getDocLabel(epicDoc) || (c.epicLabel || '');

    const hay = [
      c.title, c.description, c.reporter, c.assignee,
      c.type, c.app, c.priority, c.sizeEstimate, c.appVersion, c.statusColumn,
      featureLabel, epicLabel,
    ].map(x => (x || '').toString().toLowerCase()).join(' • ');

    if (matchMode === 'all') return terms.every(t => hay.includes(t));
    return terms.some(t => hay.includes(t));
  };

  /* ---------- derived ---------- */
  const grouped = useMemo(() => {
    const g = Object.fromEntries(COLUMNS.map((c) => [c, []]));

    // Add epics to columns
    for (const epic of epics) {
      const col = epic.statusColumn || 'Idea';
      if (!g[col]) g[col] = [];
      g[col].push({ ...epic, entityType: 'epic' });
    }

    // Add features to columns
    for (const feature of features) {
      const col = feature.statusColumn || 'Idea';
      if (!g[col]) g[col] = [];
      g[col].push({ ...feature, entityType: 'feature' });
    }

    // Add cards to columns
    for (const c of cards) {
      if (!matchesFilters(c)) continue;
      if (!matchesSearch(c)) continue;
      const col = c.statusColumn || 'Idea';
      if (!g[col]) g[col] = [];
      g[col].push({ ...c, entityType: 'card' });
    }

    return g;
  }, [cards, epics, features, showArchived, filters, search, matchMode]);

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

  const buildSearchTokens = (card, featureName = '', epicName = '') => {
    const base = [
      card.title, card.description, card.reporter, card.assignee,
      card.type, card.app, card.priority, card.sizeEstimate, card.appVersion, card.statusColumn,
      featureName, epicName,
    ].join(' ');
    return Array.from(new Set(tokenize(base))).slice(0, 200);
  };

  const assignCardToFeature = async (cardId, targetFeatureId) => {
    const normalizedFeatureId = normalizeId(targetFeatureId);
    const featureDoc = normalizedFeatureId ? featureMap[normalizedFeatureId] : null;
    const featureLabel = getDocLabel(featureDoc) || null;
    const normalizedEpicId = normalizeId(featureDoc?.epicId);
    const epicDoc = normalizedEpicId ? epicMap[normalizedEpicId] : null;
    const epicLabel = getDocLabel(epicDoc) || null;
    const cardData = cards.find((c) => c.id === cardId);
    const searchTokens = cardData
      ? buildSearchTokens(
          {
            ...cardData,
            featureId: normalizedFeatureId || null,
            featureLabel,
            epicId: normalizedEpicId || null,
            epicLabel,
          },
          featureLabel || '',
          epicLabel || '',
        )
      : null;
    try {
      await updateDoc(doc(db, 'stea_cards', cardId), {
        featureId: normalizedFeatureId || null,
        featureLabel,
        epicId: normalizedEpicId || null,
        epicLabel,
        ...(searchTokens ? { searchTokens } : {}),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('[STEa Board] Failed to reassign card feature', err);
    }
  };

  const assignFeatureToEpic = async (featureId, targetEpicId) => {
    const normalizedFeatureId = normalizeId(featureId);
    if (!normalizedFeatureId) return;
    const normalizedEpicId = normalizeId(targetEpicId);
    const epicDoc = normalizedEpicId ? epicMap[normalizedEpicId] : null;
    const epicLabel = getDocLabel(epicDoc) || null;
    const featureDoc = featureMap[normalizedFeatureId];
    const featureLabel = getDocLabel(featureDoc) || '';
    const featureSearchTokens = buildSearchTokens(
      {
        ...(featureDoc || {}),
        epicId: normalizedEpicId || null,
        epicLabel,
        featureLabel,
      },
      featureLabel,
      epicLabel || '',
    );
    try {
      await updateDoc(doc(db, 'stea_features', normalizedFeatureId), {
        epicId: normalizedEpicId || null,
        epicLabel,
        featureLabel: featureLabel || null,
        searchTokens: featureSearchTokens,
        updatedAt: serverTimestamp(),
      });
      const impactedCards = cards.filter((c) => normalizeId(c.featureId) === normalizedFeatureId);
      if (impactedCards.length) {
        await Promise.all(impactedCards.map((c) =>
          updateDoc(doc(db, 'stea_cards', c.id), {
            epicId: normalizedEpicId || null,
            epicLabel,
            searchTokens: buildSearchTokens(
              {
                ...c,
                epicId: normalizedEpicId || null,
                epicLabel,
              },
              c.featureLabel || featureLabel,
              epicLabel || '',
            ),
            updatedAt: serverTimestamp(),
          })
        ));
      }
    } catch (err) {
      console.error('[STEa Board] Failed to reassign feature epic', err);
    }
  };

  const startNewEntity = (entityType = 'card', defaults = {}) => {
    const normalizedEpicId = normalizeId(defaults.epicId);
    const normalizedFeatureId = normalizeId(defaults.featureId);

    const base = {
      id: null,
      entityType,
      title: defaults.title || '',
      description: defaults.description || '',
      type: entityType === 'card' ? (defaults.type || 'idea') : entityType,
      app: defaults.app || 'New App',
      priority: defaults.priority || 'medium',
      reporter: user?.email || '',
      assignee: '',
      sizeEstimate: defaults.sizeEstimate || 'M',
      appVersion: '',
      statusColumn: defaults.statusColumn || 'Idea',
      archived: !!defaults.archived,
      attachments: Array.isArray(defaults.attachments) ? defaults.attachments : [],
      epicId: entityType === 'epic' ? '' : normalizedEpicId,
      featureId: entityType === 'card' ? normalizedFeatureId : '',
      epicLabel: defaults.epicLabel || '',
      featureLabel: defaults.featureLabel || '',
    };
    setEditing(base);
    setCreating(true);
    setNewMenuOpen(false);
  };

  const openEntityEditor = (entityType, entity) => {
    if (!entity) return;
    setEditing({
      ...entity,
      entityType,
      epicId: normalizeId(entity.epicId),
      featureId: normalizeId(entity.featureId),
      attachments: Array.isArray(entity.attachments) ? entity.attachments : [],
    });
    setCreating(false);
    setNewMenuOpen(false);
  };

  const handleNewPick = (type) => {
    if (!type) return;
    startNewEntity(type);
  };

  const saveEntity = async (entity) => {
    const entityType = entity.entityType || 'card';
    const collectionName = getEntityCollection(entityType);
    const normalizedFeatureId = entityType === 'card' ? normalizeId(entity.featureId) : '';
    const featureDoc = normalizedFeatureId ? featureMap[normalizedFeatureId] : null;
    const featureLabel = entityType === 'card'
      ? (getDocLabel(featureDoc) || entity.featureLabel || '')
      : (entity.featureLabel || entity.title || entity.label || '');
    const derivedEpicFromFeature = featureDoc ? normalizeId(featureDoc.epicId) : '';
    const normalizedEpicId = entityType === 'epic'
      ? ''
      : normalizeId(entity.epicId || derivedEpicFromFeature);
    const epicDoc = normalizedEpicId ? epicMap[normalizedEpicId] : null;
    const epicLabel = entityType === 'epic'
      ? (entity.title || entity.epicLabel || '')
      : (getDocLabel(epicDoc) || entity.epicLabel || '');

    const title = (entity.title || '').trim() || `Untitled ${ENTITY_LABEL[entityType] || 'Item'}`;
    const description = entity.description || '';
    const dataType = entityType === 'card' ? (entity.type || 'idea') : (entity.type || entityType);
    const appValue = entity.app || 'New App';
    const priority = entity.priority || 'medium';
    const reporter = entity.reporter || user?.email || '';
    const assignee = entity.assignee || '';
    const sizeEstimate = entity.sizeEstimate || 'M';
    const appVersion = entity.appVersion || '';
    const statusColumn = entity.statusColumn || 'Idea';
    const archived = !!entity.archived;
    const attachments = entity.attachments || [];

    const featureNameForTokens = entityType === 'card'
      ? featureLabel
      : entityType === 'feature'
        ? title
        : '';
    const epicNameForTokens = entityType === 'epic'
      ? title
      : epicLabel;

    const searchTokens = buildSearchTokens(
      {
        ...entity,
        title,
        description,
        type: dataType,
        app: appValue,
        priority,
        reporter,
        assignee,
        sizeEstimate,
        appVersion,
        statusColumn,
        archived,
      },
      featureNameForTokens,
      epicNameForTokens,
    );

    const payload = {
      title,
      description,
      type: dataType,
      app: appValue,
      priority,
      reporter,
      assignee,
      sizeEstimate,
      appVersion,
      statusColumn,
      archived,
      attachments,
      searchTokens,
      entityType,
      updatedAt: serverTimestamp(),
      ...(entity.createdAt ? {} : { createdAt: serverTimestamp() }),
    };

    if (entityType !== 'card') {
      payload.label = title;
    }

    if (entityType === 'card' || entityType === 'feature') {
      payload.epicId = normalizedEpicId || null;
      payload.epicLabel = epicLabel || null;
    }
    if (entityType === 'card') {
      payload.featureId = normalizedFeatureId || null;
      payload.featureLabel = featureLabel || null;
    }
    if (entityType === 'feature') {
      payload.featureLabel = title;
    }
    if (entityType === 'epic') {
      payload.epicLabel = title;
    }

    if (entity.id) {
      await updateDoc(doc(db, collectionName, entity.id), payload);
    } else {
      await addDoc(collection(db, collectionName), payload);
    }

    setEditing(null);
    setCreating(false);
  };

  const deleteEntity = async (entity) => {
    if (!entity?.id) return;
    const entityType = entity.entityType || 'card';
    const collectionName = getEntityCollection(entityType);
    await deleteDoc(doc(db, collectionName, entity.id));
    setEditing(null);
  };

  const moveTo = async (entity, nextCol) => {
    const entityType = entity.entityType || 'card';
    const collectionName = getEntityCollection(entityType);

    // Update the entity itself
    await updateDoc(doc(db, collectionName, entity.id), {
      statusColumn: nextCol,
      updatedAt: serverTimestamp()
    });

    // If epic, also move all nested features and cards
    if (entityType === 'epic') {
      const normalizedEpicId = normalizeId(entity.id);
      const nestedFeatures = features.filter(f => normalizeId(f.epicId) === normalizedEpicId);
      const nestedCards = cards.filter(c => normalizeId(c.epicId) === normalizedEpicId);

      await Promise.all([
        ...nestedFeatures.map(f =>
          updateDoc(doc(db, 'stea_features', f.id), {
            statusColumn: nextCol,
            updatedAt: serverTimestamp()
          })
        ),
        ...nestedCards.map(c =>
          updateDoc(doc(db, 'stea_cards', c.id), {
            statusColumn: nextCol,
            updatedAt: serverTimestamp()
          })
        )
      ]);
    }

    // If feature, also move all nested cards
    if (entityType === 'feature') {
      const normalizedFeatureId = normalizeId(entity.id);
      const nestedCards = cards.filter(c => normalizeId(c.featureId) === normalizedFeatureId);

      await Promise.all(
        nestedCards.map(c =>
          updateDoc(doc(db, 'stea_cards', c.id), {
            statusColumn: nextCol,
            updatedAt: serverTimestamp()
          })
        )
      );
    }
  };

  /* ---------- attachments handlers ---------- */
  const addFiles = async (files) => {
    if (!editing?.id || !files?.length) return;
    setUploading(true);
    const storage = getStorage();
    const atts = [];
    const entityType = editing.entityType || 'card';
    const collectionName = getEntityCollection(entityType);

    for (const file of files) {
      const path = `stea_uploads/${entityType}/${editing.id}/${Date.now()}_${file.name}`;
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

    await updateDoc(doc(db, collectionName, editing.id), { attachments: arrayUnion(...atts), updatedAt: serverTimestamp() });
    setEditing((c) => ({ ...c, attachments: [...(c.attachments || []), ...atts] }));
    setUploading(false);
  };

  const deleteFile = async (att) => {
    if (!editing?.id || !att?.path) return;
    const storage = getStorage();
    await deleteObject(ref(storage, att.path)).catch(() => {});
    const entityType = editing.entityType || 'card';
    const collectionName = getEntityCollection(entityType);
    await updateDoc(doc(db, collectionName, editing.id), { attachments: arrayRemove(att), updatedAt: serverTimestamp() });
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
  const onEntityPointerDown = (entityId, entity, entityType) => () => {
    const now = Date.now();
    const last = tapTimes.current[entityId] || 0;
    tapTimes.current[entityId] = now;
    if (now - last < 300) openEntityEditor(entityType, entity);
  };

  /* Epic Component */
  const Epic = ({ epic, children }) => {
    const idx = COLUMNS.indexOf(epic.statusColumn || 'Idea');
    const prev = COLUMNS[Math.max(idx - 1, 0)];
    const next = COLUMNS[Math.min(idx + 1, COLUMNS.length - 1)];
    const isDragging = draggingId === epic.id;
    const normalizedEpicId = normalizeId(epic.id);
    const isEpicDropTarget = dragOverEpic === normalizedEpicId;

    const handleEpicDragOver = (event) => {
      const types = Array.from(event.dataTransfer.types || []);
      if (types.includes('text/stea-feature-id')) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDragOverEpic(normalizedEpicId);
        event.stopPropagation();
      }
    };

    const handleEpicDrop = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const featureId = event.dataTransfer.getData('text/stea-feature-id');
      console.log('[Epic Drop] Feature ID:', featureId);
      console.log('[Epic Drop] Epic ID:', normalizedEpicId);
      console.log('[Epic Drop] Epic:', epic);

      if (featureId) {
        const normalizedFeatureId = normalizeId(featureId);
        const feature = features.find((f) => f.id === normalizedFeatureId);
        const epicLabel = getDocLabel(epic) || epic.title || '';
        const featureLabel = getDocLabel(feature) || feature?.title || '';

        console.log('[Epic Drop] Normalized Feature ID:', normalizedFeatureId);
        console.log('[Epic Drop] Feature found:', feature);
        console.log('[Epic Drop] Epic label:', epicLabel);

        if (!normalizedFeatureId) {
          console.error('[Epic Drop] Invalid feature ID');
          setDragOverEpic('');
          return;
        }

        if (!feature) {
          console.error('[Epic Drop] Feature not found');
          setDragOverEpic('');
          return;
        }

        // Build search tokens
        const featureSearchTokens = buildSearchTokens(
          {
            ...(feature || {}),
            epicId: normalizedEpicId || null,
            epicLabel,
            featureLabel,
            statusColumn: epic.statusColumn,
          },
          featureLabel,
          epicLabel || '',
        );

        const updateData = {
          epicId: normalizedEpicId || null,
          epicLabel,
          statusColumn: epic.statusColumn,
          searchTokens: featureSearchTokens,
          updatedAt: serverTimestamp(),
        };

        console.log('[Epic Drop] Update data:', updateData);

        // Update feature with both epicId AND statusColumn in one call
        try {
          await updateDoc(doc(db, 'stea_features', normalizedFeatureId), updateData);
          console.log('[Epic Drop] Feature updated successfully');

          // Update any cards linked to this feature
          const impactedCards = cards.filter((c) => normalizeId(c.featureId) === normalizedFeatureId);
          console.log('[Epic Drop] Impacted cards:', impactedCards.length);

          if (impactedCards.length) {
            await Promise.all(impactedCards.map((c) =>
              updateDoc(doc(db, 'stea_cards', c.id), {
                epicId: normalizedEpicId || null,
                epicLabel,
                searchTokens: buildSearchTokens(
                  {
                    ...c,
                    epicId: normalizedEpicId || null,
                    epicLabel,
                  },
                  c.featureLabel || featureLabel,
                  epicLabel || '',
                ),
                updatedAt: serverTimestamp(),
              })
            ));
            console.log('[Epic Drop] Cards updated successfully');
          }
        } catch (err) {
          console.error('[STEa Board] Failed to nest feature under epic', err);
        }
      }
      setDragOverEpic('');
    };

    const hasChildren = children && (Array.isArray(children) ? children.filter(Boolean).length > 0 : true);
    const isHovered = hoveredLayer === `epic-${epic.id}`;
    const isPeeking = peeking === `epic-${epic.id}`;

    const handleTitleMouseDown = (e) => {
      e.stopPropagation();
      e.preventDefault();
      setPeeking(`epic-${epic.id}`);
    };

    const handleTitleMouseUp = (e) => {
      e.stopPropagation();
      setPeeking(null);
    };

    const handleTitleMouseLeave = () => {
      setPeeking(null);
    };

    return (
      <div
        className={`rounded-[28px] border-4 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 shadow-md hover:shadow-lg transition-all cursor-grab active:cursor-grabbing relative overflow-hidden ${isDragging ? 'opacity-60' : ''} ${isEpicDropTarget ? 'ring-4 ring-red-400' : ''} ${isHovered ? 'ring-2 ring-red-300 shadow-red-200/50' : ''} ${hasChildren ? 'pl-8 pr-4 pt-2 pb-4 min-h-[140px]' : 'p-4 min-h-[180px]'}`}
        draggable
        onDragStart={(e) => { setDraggingId(epic.id); e.dataTransfer.setData('text/stea-epic-id', epic.id); e.dataTransfer.effectAllowed = 'move'; }}
        onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
        onDragOver={handleEpicDragOver}
        onDragLeave={() => setDragOverEpic('')}
        onDrop={handleEpicDrop}
        onDoubleClick={() => openEntityEditor('epic', epic)}
        onPointerDown={onEntityPointerDown(epic.id, epic, 'epic')}
        onMouseEnter={() => setHoveredLayer(`epic-${epic.id}`)}
        onMouseLeave={() => setHoveredLayer(null)}
      >
        {hasChildren ? (
          <>
            {isPeeking ? (
              <>
                {/* Peek mode - show full epic details */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="font-bold text-red-700 text-sm uppercase tracking-wide">Epic</div>
                  <button onClick={(e) => { e.stopPropagation(); openEntityEditor('epic', epic); }} className="px-2 py-1 text-xs rounded bg-red-700 text-white hover:bg-red-800">Edit</button>
                </div>
                <div className="font-semibold text-base break-words">{highlightText(epic.title, search)}</div>
                {epic.description ? (<p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{highlightText(epic.description, search)}</p>) : null}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Reporter: {epic.reporter || '—'}</span>
                  {epic.assignee ? <span>Assigned: {epic.assignee}</span> : null}
                </div>
              </>
            ) : (
              <>
                {/* Minimal border mode - title on left edge */}
                <div
                  className="absolute left-1 top-0 bottom-0 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-red-100/30 transition-colors"
                  onMouseDown={handleTitleMouseDown}
                  onMouseUp={handleTitleMouseUp}
                  onMouseLeave={handleTitleMouseLeave}
                  title="Click and hold to peek"
                >
                  <div className="text-red-700 text-xs font-bold uppercase tracking-wider whitespace-nowrap origin-center max-h-full overflow-hidden text-ellipsis" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    {epic.title || 'Epic'}
                  </div>
                </div>
                {/* Label at top */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-red-700 text-[10px] font-bold uppercase tracking-wide">Epic</div>
                  <button onClick={(e) => { e.stopPropagation(); openEntityEditor('epic', epic); }} className="px-1.5 py-0.5 text-[10px] rounded bg-red-700 text-white hover:bg-red-800">Edit</button>
                </div>
                {/* Nested children */}
                <div className="space-y-3">
                  {children}
                </div>
              </>
            )}
            <div className="mt-3 flex items-center justify-end gap-2">
              <button onClick={(e) => { e.stopPropagation(); startNewEntity('feature', { epicId: epic.id, epicLabel: epic.title || 'Epic' }); }} className="px-2 py-1 text-xs rounded border border-red-200 bg-white text-red-700 hover:bg-red-50">+ Feature</button>
            </div>
          </>
        ) : (
          <>
            {/* Full display mode - standalone epic */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="font-bold text-red-700 text-sm uppercase tracking-wide">Epic</div>
              <button onClick={(e) => { e.stopPropagation(); openEntityEditor('epic', epic); }} className="px-2 py-1 text-xs rounded bg-red-700 text-white hover:bg-red-800">Edit</button>
            </div>
            <div className="font-semibold text-base break-words">{highlightText(epic.title, search)}</div>
            {epic.description ? (<p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{highlightText(epic.description, search)}</p>) : null}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>Reporter: {epic.reporter || '—'}</span>
              {epic.assignee ? <span>Assigned: {epic.assignee}</span> : null}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button onClick={(e) => { e.stopPropagation(); startNewEntity('feature', { epicId: epic.id, epicLabel: epic.title || 'Epic' }); }} className="px-2 py-1 text-xs rounded border border-red-200 bg-white text-red-700 hover:bg-red-50">+ Feature</button>
              <button onClick={(e) => { e.stopPropagation(); moveTo({ id: epic.id, statusColumn: epic.statusColumn }, prev); }} className="px-2 py-1 text-xs rounded border hover:bg-gray-50" title={`Move to ${prev}`}>←</button>
              <button onClick={(e) => { e.stopPropagation(); moveTo({ id: epic.id, statusColumn: epic.statusColumn }, next); }} className="px-2 py-1 text-xs rounded border hover:bg-gray-50" title={`Move to ${next}`}>→</button>
            </div>
          </>
        )}
      </div>
    );
  };

  /* Feature Component */
  const Feature = ({ feature, children }) => {
    const idx = COLUMNS.indexOf(feature.statusColumn || 'Idea');
    const prev = COLUMNS[Math.max(idx - 1, 0)];
    const next = COLUMNS[Math.min(idx + 1, COLUMNS.length - 1)];
    const isDragging = draggingId === feature.id;
    const epicDoc = feature.epicId ? epicMap[normalizeId(feature.epicId)] : null;
    const epicLabel = getDocLabel(epicDoc) || '';
    const normalizedFeatureId = normalizeId(feature.id);
    const isFeatureDropTarget = dragOverFeature === normalizedFeatureId;

    const handleFeatureDragOver = (event) => {
      const types = Array.from(event.dataTransfer.types || []);
      if (types.includes('text/stea-card-id')) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDragOverFeature(normalizedFeatureId);
        event.stopPropagation();
      }
    };

    const handleFeatureDrop = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const cardId = event.dataTransfer.getData('text/stea-card-id');
      if (cardId) {
        const card = cards.find((c) => c.id === cardId);
        const featureLabel = getDocLabel(feature) || feature?.title || '';
        const normalizedEpicId = normalizeId(feature.epicId);
        const epicDoc = normalizedEpicId ? epicMap[normalizedEpicId] : null;
        const epicLabel = getDocLabel(epicDoc) || '';

        // Build search tokens
        const searchTokens = buildSearchTokens(
          {
            ...(card || {}),
            featureId: normalizedFeatureId || null,
            featureLabel,
            epicId: normalizedEpicId || null,
            epicLabel,
            statusColumn: feature.statusColumn,
          },
          featureLabel || '',
          epicLabel || '',
        );

        // Update card with featureId, epicId, AND statusColumn in one call
        try {
          await updateDoc(doc(db, 'stea_cards', cardId), {
            featureId: normalizedFeatureId || null,
            featureLabel,
            epicId: normalizedEpicId || null,
            epicLabel,
            statusColumn: feature.statusColumn,
            searchTokens,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('[STEa Board] Failed to nest card under feature', err);
        }
      }
      setDragOverFeature('');
    };

    const hasChildren = children && (Array.isArray(children) ? children.filter(Boolean).length > 0 : true);
    const isCollapsed = collapsedFeatures[feature.id];
    const isHovered = hoveredLayer === `feature-${feature.id}`;
    const isPeeking = peeking === `feature-${feature.id}`;

    const toggleCollapse = (e) => {
      e.stopPropagation();
      setCollapsedFeatures(prev => ({
        ...prev,
        [feature.id]: !prev[feature.id]
      }));
    };

    const handleTitleMouseDown = (e) => {
      e.stopPropagation();
      e.preventDefault();
      setPeeking(`feature-${feature.id}`);
    };

    const handleTitleMouseUp = (e) => {
      e.stopPropagation();
      setPeeking(null);
    };

    const handleTitleMouseLeave = () => {
      setPeeking(null);
    };

    return (
      <div
        className={`rounded-[22px] border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100/70 shadow-lg hover:shadow-xl transition-all cursor-grab active:cursor-grabbing relative overflow-hidden ${isDragging ? 'opacity-60' : ''} ${isFeatureDropTarget ? 'ring-4 ring-orange-400' : ''} ${isHovered ? 'ring-2 ring-orange-300 shadow-orange-200/50' : ''} ${hasChildren ? 'pl-7 pr-3 pt-2 pb-3 min-h-[115px]' : 'p-3 min-h-[150px]'}`}
        style={{
          boxShadow: hasChildren
            ? '0 4px 6px -1px rgba(251, 146, 60, 0.15), 0 2px 4px -1px rgba(251, 146, 60, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            : undefined
        }}
        draggable
        onDragStart={(e) => { setDraggingId(feature.id); e.dataTransfer.setData('text/stea-feature-id', feature.id); e.dataTransfer.effectAllowed = 'move'; }}
        onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
        onDragOver={handleFeatureDragOver}
        onDragLeave={() => setDragOverFeature('')}
        onDrop={handleFeatureDrop}
        onDoubleClick={() => openEntityEditor('feature', feature)}
        onPointerDown={onEntityPointerDown(feature.id, feature, 'feature')}
        onMouseEnter={() => setHoveredLayer(`feature-${feature.id}`)}
        onMouseLeave={() => setHoveredLayer(null)}
      >
        {hasChildren ? (
          <>
            {isPeeking ? (
              <>
                {/* Peek mode - show full feature details */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="font-bold text-orange-700 text-sm uppercase tracking-wide">Feature</div>
                  <button onClick={(e) => { e.stopPropagation(); openEntityEditor('feature', feature); }} className="px-2 py-1 text-xs rounded bg-orange-700 text-white hover:bg-orange-800">Edit</button>
                </div>
                {epicLabel && (
                  <div className="mb-2 inline-block px-2 py-0.5 text-[10px] rounded border border-red-200 bg-red-50 text-red-700 uppercase tracking-wide">
                    Epic: {epicLabel}
                  </div>
                )}
                <div className="font-semibold text-base break-words">{highlightText(feature.title, search)}</div>
                {feature.description ? (<p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{highlightText(feature.description, search)}</p>) : null}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Reporter: {feature.reporter || '—'}</span>
                  {feature.assignee ? <span>Assigned: {feature.assignee}</span> : null}
                </div>
              </>
            ) : (
              <>
                {/* Minimal border mode - title on left edge */}
                <div
                  className="absolute left-1 top-0 bottom-0 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-orange-100/30 transition-colors"
                  onMouseDown={handleTitleMouseDown}
                  onMouseUp={handleTitleMouseUp}
                  onMouseLeave={handleTitleMouseLeave}
                  title="Click and hold to peek"
                >
                  <div className="text-orange-700 text-xs font-bold uppercase tracking-wider whitespace-nowrap origin-center max-h-full overflow-hidden text-ellipsis" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    {feature.title || 'Feature'}
                  </div>
                </div>
                {/* Label at top */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-orange-700 text-[10px] font-bold uppercase tracking-wide">Feature</div>
                    {hasChildren && (
                      <button
                        onClick={toggleCollapse}
                        className="text-orange-700 hover:text-orange-900 text-xs px-1 py-0.5 rounded hover:bg-orange-100"
                        title={isCollapsed ? 'Expand' : 'Collapse'}
                      >
                        {isCollapsed ? '▶' : '▼'}
                      </button>
                    )}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openEntityEditor('feature', feature); }} className="px-1.5 py-0.5 text-[10px] rounded bg-orange-700 text-white hover:bg-orange-800">Edit</button>
                </div>
                {/* Nested children - only show if not collapsed */}
                {!isCollapsed && (
                  <div className="space-y-3">
                    {children}
                  </div>
                )}
                {isCollapsed && (
                  <div className="text-xs text-orange-600 italic">
                    {Array.isArray(children) ? children.filter(Boolean).length : 1} card{Array.isArray(children) && children.filter(Boolean).length !== 1 ? 's' : ''} hidden
                  </div>
                )}
              </>
            )}
            <div className="mt-3 flex items-center justify-end gap-2">
              <button onClick={(e) => { e.stopPropagation(); startNewEntity('card', { featureId: feature.id, epicId: feature.epicId, featureLabel: feature.title || 'Feature', epicLabel }); }} className="px-2 py-1 text-xs rounded border border-orange-200 bg-white text-orange-700 hover:bg-orange-50">+ Card</button>
            </div>
          </>
        ) : (
          <>
            {/* Full display mode - standalone feature */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="font-bold text-orange-700 text-sm uppercase tracking-wide">Feature</div>
              <button onClick={(e) => { e.stopPropagation(); openEntityEditor('feature', feature); }} className="px-2 py-1 text-xs rounded bg-orange-700 text-white hover:bg-orange-800">Edit</button>
            </div>
            {epicLabel && (
              <div className="mb-2 inline-block px-2 py-0.5 text-[10px] rounded border border-red-200 bg-red-50 text-red-700 uppercase tracking-wide">
                Epic: {epicLabel}
              </div>
            )}
            <div className="font-semibold text-base break-words">{highlightText(feature.title, search)}</div>
            {feature.description ? (<p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{highlightText(feature.description, search)}</p>) : null}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>Reporter: {feature.reporter || '—'}</span>
              {feature.assignee ? <span>Assigned: {feature.assignee}</span> : null}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button onClick={(e) => { e.stopPropagation(); startNewEntity('card', { featureId: feature.id, epicId: feature.epicId, featureLabel: feature.title || 'Feature', epicLabel }); }} className="px-2 py-1 text-xs rounded border border-orange-200 bg-white text-orange-700 hover:bg-orange-50">+ Card</button>
              <button onClick={(e) => { e.stopPropagation(); moveTo({ id: feature.id, statusColumn: feature.statusColumn }, prev); }} className="px-2 py-1 text-xs rounded border hover:bg-gray-50" title={`Move to ${prev}`}>←</button>
              <button onClick={(e) => { e.stopPropagation(); moveTo({ id: feature.id, statusColumn: feature.statusColumn }, next); }} className="px-2 py-1 text-xs rounded border hover:bg-gray-50" title={`Move to ${next}`}>→</button>
            </div>
          </>
        )}
      </div>
    );
  };

  const Card = ({ card }) => {
    const idx = COLUMNS.indexOf(card.statusColumn || 'Idea');
    const prev = COLUMNS[Math.max(idx - 1, 0)];
    const next = COLUMNS[Math.min(idx + 1, COLUMNS.length - 1)];
    const isDragging = draggingId === card.id;
    const expanded = !!expandedCards[card.id];

    return (
      <div
        className={`rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-sm hover:shadow transition break-words whitespace-normal cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-60' : ''}`}
        draggable
        onDragStart={(e) => { setDraggingId(card.id); e.dataTransfer.setData('text/stea-card-id', card.id); e.dataTransfer.effectAllowed = 'move'; }}
        onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
        onDoubleClick={() => openEntityEditor('card', card)}
        onPointerDown={onEntityPointerDown(card.id, card, 'card')}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
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
          <button onClick={() => openEntityEditor('card', card)} className="px-2 py-1 text-xs rounded bg-gray-800 text-white hover:bg-black">Edit</button>
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

        <div className="mt-3 flex items-center justify-between">
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

  if (!authReady) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="rounded-2xl border bg-white/70 p-6 text-center text-sm text-gray-600">
          Checking your STEa access…
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="rounded-2xl border bg-white/70 p-6 text-center text-sm text-gray-600">
          Redirecting you to the STEa home to sign in…
        </div>
      </main>
    );
  }

  return (
    <main className="pb-10 max-w-[1400px] mx-auto px-4">
      {/* Header */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image className="rounded-2xl border border-black/10" src="/img/logo-mark.png" width={64} height={64} alt="Arcturus mark" priority />
        <div className="flex-1 min-w-0">
          <div className="font-extrabold">STEa — Board</div>
          <div className="text-muted text-sm">Manage ideas → build phases. Auto-saved to Firestore.</div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="relative" ref={newMenuRef}>
              <button
                onClick={() => setNewMenuOpen((open) => !open)}
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                aria-haspopup="menu"
                aria-expanded={newMenuOpen}
              >
                +New
                <span className="text-xs">▾</span>
              </button>
              {newMenuOpen ? (
                <div className="absolute z-20 mt-1 w-40 rounded-md border border-gray-200 bg-white shadow-lg">
                  <button onClick={() => handleNewPick('card')} className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">Card</button>
                  <button onClick={() => handleNewPick('feature')} className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">Feature</button>
                  <button onClick={() => handleNewPick('epic')} className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50">Epic</button>
                </div>
              ) : null}
            </div>
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
                <Link
                  href="/apps/stea"
                  className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 text-sm"
                >
                  STEa Home
                </Link>
              )}
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
                  setDragOverCol(null);
                  setDraggingId(null);

                  // Try card first
                  const cardId = e.dataTransfer.getData('text/stea-card-id');
                  if (cardId) {
                    const card = cards.find((c) => c.id === cardId);
                    if (card && card.statusColumn !== col) {
                      await moveTo({ ...card, entityType: 'card' }, col);
                    }
                    return;
                  }

                  // Try feature
                  const featureId = e.dataTransfer.getData('text/stea-feature-id');
                  if (featureId) {
                    const feature = features.find((f) => f.id === featureId);
                    if (feature && feature.statusColumn !== col) {
                      await moveTo({ ...feature, entityType: 'feature' }, col);
                    }
                    return;
                  }

                  // Try epic
                  const epicId = e.dataTransfer.getData('text/stea-epic-id');
                  if (epicId) {
                    const epic = epics.find((e) => e.id === epicId);
                    if (epic && epic.statusColumn !== col) {
                      await moveTo({ ...epic, entityType: 'epic' }, col);
                    }
                    return;
                  }
                }}
              >
                <ColumnHeader name={col} count={items.length} />
                {items.length === 0 ? (
                  <div className="text-xs text-gray-500 p-3 border rounded bg-gray-50">Drop items here</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {(() => {
                      // Group items hierarchically
                      const epicItems = items.filter(i => i.entityType === 'epic');
                      const featureItems = items.filter(i => i.entityType === 'feature');
                      const cardItems = items.filter(i => i.entityType === 'card');

                      // Orphan features (no epic)
                      const orphanFeatures = featureItems.filter(f => !f.epicId);
                      // Orphan cards (no feature, no epic)
                      const orphanCards = cardItems.filter(c => !c.featureId && !c.epicId);

                      return (
                        <>
                          {/* Render epics with their nested features and cards */}
                          {epicItems.map(epic => (
                            <Epic key={epic.id} epic={epic}>
                              {/* Features belonging to this epic */}
                              {featureItems
                                .filter(f => normalizeId(f.epicId) === normalizeId(epic.id))
                                .map(feature => (
                                  <Feature key={feature.id} feature={feature}>
                                    {/* Cards belonging to this feature */}
                                    {cardItems
                                      .filter(c => normalizeId(c.featureId) === normalizeId(feature.id))
                                      .map(card => <Card key={card.id} card={card} />)
                                    }
                                  </Feature>
                                ))}
                              {/* Cards belonging directly to epic (no feature) */}
                              {cardItems
                                .filter(c => !c.featureId && normalizeId(c.epicId) === normalizeId(epic.id))
                                .map(card => <Card key={card.id} card={card} />)
                              }
                            </Epic>
                          ))}

                          {/* Orphan features (no epic) */}
                          {orphanFeatures.map(feature => (
                            <Feature key={feature.id} feature={feature}>
                              {/* Cards belonging to this orphan feature */}
                              {cardItems
                                .filter(c => normalizeId(c.featureId) === normalizeId(feature.id))
                                .map(card => <Card key={card.id} card={card} />)
                              }
                            </Feature>
                          ))}

                          {/* Orphan cards (no feature, no epic) */}
                          {orphanCards.map(card => <Card key={card.id} card={card} />)}
                        </>
                      );
                    })()}
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
                <div className="font-bold">
                  {creating ? `New ${ENTITY_LABEL[editing.entityType || 'card'] || 'Item'}` : `Edit ${ENTITY_LABEL[editing.entityType || 'card'] || 'Item'}`}
                </div>
                <button onClick={() => { setEditing(null); setCreating(false); }} className="px-3 py-1 rounded border hover:bg-gray-50">Close</button>
              </div>

              <ModalBody
                editing={editing}
                setEditing={setEditing}
                creating={creating}
                saveEntity={saveEntity}
                deleteEntity={deleteEntity}
                addFiles={addFiles}
                deleteFile={deleteFile}
                uploading={uploading}
                user={user}
                appsList={appsList}
                onAddApp={(name) => setCustomApps((prev) => Array.from(new Set([...(prev || []), name])))}
                epics={epics}
                features={features}
                epicMap={epicMap}
                featureMap={featureMap}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------- Modal Body ---------- */
function ModalBody({
  editing, setEditing, creating, saveEntity, deleteEntity,
  addFiles, deleteFile, uploading, user, appsList, onAddApp,
  epics, features, epicMap, featureMap,
}) {
  const [descExpanded, setDescExpanded] = useState(false);
  const selectedEpicId = normalizeId(editing?.epicId);
  const selectedFeatureId = normalizeId(editing?.featureId);

  const entityType = editing?.entityType || 'card';
  const entityLabel = ENTITY_LABEL[entityType] || 'Item';
  const isCard = entityType === 'card';
  const isEpic = entityType === 'epic';

  const featureOptions = useMemo(() => {
    if (!features?.length || !isCard) return [];
    const filtered = selectedEpicId
      ? features.filter((f) => normalizeId(f.epicId) === selectedEpicId)
      : features;
    if (selectedFeatureId && !filtered.some((f) => f.id === selectedFeatureId)) {
      const current = features.find((f) => f.id === selectedFeatureId);
      if (current) return [...filtered, current];
    }
    return filtered;
  }, [features, selectedEpicId, selectedFeatureId, isCard]);

  const handleEpicSelect = (value) => {
    if (isEpic) return;
    setEditing((prev) => {
      if (!prev) return prev;
      const normalized = normalizeId(value);
      const currentFeatureId = normalizeId(prev.featureId);
      const featureMatches = currentFeatureId && normalizeId(featureMap[currentFeatureId]?.epicId) === normalized;
      return {
        ...prev,
        epicId: normalized,
        featureId: featureMatches ? currentFeatureId : '',
      };
    });
  };

  const handleFeatureSelect = (value) => {
    if (!isCard) return;
    setEditing((prev) => {
      if (!prev) return prev;
      const normalized = normalizeId(value);
      const nextFeature = normalized ? featureMap[normalized] : null;
      const derivedEpic = nextFeature ? normalizeId(nextFeature.epicId) : '';
      const prevEpic = normalizeId(prev.epicId);
      return {
        ...prev,
        featureId: normalized,
        epicId: nextFeature ? (derivedEpic || prevEpic) : prevEpic,
      };
    });
  };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Title</label>
        <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="Short summary" />
      </div>

      {isCard ? (
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className="w-full px-3 py-2 border rounded">
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <div className="px-3 py-2 border rounded bg-gray-50 text-sm text-gray-600">
            {entityLabel}
          </div>
        </div>
      )}

      {!isEpic ? (
        <div>
          <label className="block text-sm font-medium mb-1">Epic</label>
          <select
            value={selectedEpicId}
            onChange={(e) => handleEpicSelect(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">— None —</option>
            {epics.map((epic) => (
              <option key={epic.id} value={epic.id}>{getDocLabel(epic)}</option>
            ))}
          </select>
        </div>
      ) : null}

      {isCard ? (
        <div>
          <label className="block text-sm font-medium mb-1">Feature</label>
          <select
            value={selectedFeatureId}
            onChange={(e) => handleFeatureSelect(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">— None —</option>
            {featureOptions.map((feature) => (
              <option key={feature.id} value={feature.id}>
                {getDocLabel(feature)}
                {feature.epicId && normalizeId(feature.epicId) !== selectedEpicId
                  ? ` — ${getDocLabel(epicMap[normalizeId(feature.epicId)])}`
                  : ''}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium mb-1 flex items-center justify-between">
          <span>App</span>
          <button
            type="button"
            onClick={() => {
              const name = prompt('Add a new App name');
              if (!name) return;
              const trimmed = name.trim();
              if (!trimmed) return;
              onAddApp(trimmed);
              setEditing({ ...editing, app: trimmed });
            }}
            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
          >
            Add…
          </button>
        </label>
        <select value={editing.app} onChange={(e) => setEditing({ ...editing, app: e.target.value })} className="w-full px-3 py-2 border rounded">
          {appsList.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
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
            <button onClick={() => deleteEntity(editing)} className="px-3 py-2 rounded border text-red-600 hover:bg-red-50">Delete</button>
          ) : null}
          <button onClick={() => saveEntity(editing)} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
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
          <CommentsSection entityCollection={getEntityCollection(entityType)} entityId={editing.id} user={user} />
        </div>
      ) : null}
    </div>
  );
}
