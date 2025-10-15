'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query,
  serverTimestamp, updateDoc
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
    const ms = ts?.toMillis?.() ?? (ts?._seconds ? ts._seconds * 1000 : null);
    return ms ? new Date(ms).toLocaleString() : '';
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

      <div className="mt-3 flex items-start gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') addComment(); }}
          className="flex-1 px-3 py-2 border rounded min-h-[44px] leading-5 overflow-y-auto resize-y break-words"
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
function Attachments({ cardId, user }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const storage = getStorage();

  useEffect(() => {
    if (!cardId) return;
    const q = query(collection(db, 'stea_cards', cardId, 'attachments'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setItems(list);
    });
    return () => unsub();
  }, [cardId]);

  const humanSize = (n) => {
    if (!n && n !== 0) return '';
    const u = ['B','KB','MB','GB']; let i=0; let s=n;
    while (s >= 1024 && i < u.length-1) { s/=1024; i++; }
    return `${s.toFixed(1)} ${u[i]}`;
    };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^\w.\-]+/g, '_');
        const path = `stea_uploads/${cardId}/${Date.now()}_${safeName}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file, { contentType: file.type || 'application/octet-stream' });
        const url = await getDownloadURL(storageRef);
        await addDoc(collection(db, 'stea_cards', cardId, 'attachments'), {
          name: file.name,
          path,
          url,
          size: file.size || null,
          type: file.type || null,
          uploader: user?.email || 'anonymous',
          createdAt: serverTimestamp(),
        });
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer?.files;
    await handleFiles(files);
  };

  const onDelete = async (att) => {
    if (!confirm(`Delete ${att.name}?`)) return;
    await deleteDoc(doc(db, 'stea_cards', cardId, 'attachments', att.id));
    if (att.path) {
      try { await deleteObject(ref(storage, att.path)); } catch { /* ignore if already gone */ }
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Attachments</div>
        <div className="text-xs text-gray-500">{items.length}</div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
        onDrop={onDrop}
        className="rounded border-2 border-dashed p-4 text-sm bg-gray-50 hover:bg-gray-100 transition"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>Drag & drop files here, or</div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50"
              disabled={busy}
            >
              Choose files
            </button>
            {busy && <span className="text-xs text-gray-500">Uploading…</span>}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mt-3 space-y-2 max-h-48 overflow-auto pr-1">
        {items.length === 0 ? (
          <div className="text-sm text-gray-500">No attachments yet.</div>
        ) : items.map((a) => (
          <div key={a.id} className="border rounded p-2 bg-white flex items-start justify-between gap-3">
            <div className="min-w-0">
              <a href={a.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-700 break-all">
                {a.name || 'Download'}
              </a>
              <div className="text-xs text-gray-500">
                {a.type || 'file'}{a.size ? ` • ${humanSize(a.size)}` : ''}{a.uploader ? ` • by ${a.uploader}` : ''}
              </div>
            </div>
            <button
              onClick={() => onDelete(a)}
              className="text-xs px-2 py-1 rounded border hover:bg-red-50 text-red-600 shrink-0"
              title="Delete attachment"
            >
              Delete
            </button>
          </div>
        ))}
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

  // 'none' | 'priority_desc' | 'priority_asc'
  const [sortMode, setSortMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stea-sort-mode') || 'none';
    }
    return 'none';
  });

  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  // drag & drop
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  /* auth */
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  /* data */
  useEffect(() => {
    const q = query(collection(db, 'stea_cards'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setCards(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => { localStorage.setItem('stea-hidden-cols', JSON.stringify(hiddenCols)); }, [hiddenCols]);
  useEffect(() => { localStorage.setItem('stea-sort-mode', sortMode); }, [sortMode]);

  /* lock page scroll when modal open */
  useEffect(() => {
    if (editing) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [editing]);

  /* derived */
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

  /* helpers */
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
      sizeEstimate
