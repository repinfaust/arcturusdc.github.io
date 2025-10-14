'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import {
  addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query,
  serverTimestamp, updateDoc
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const COLUMNS = ['Idea', 'Planning', 'Design', 'Build', 'Done', "Won't Do"];

const TYPES = [
  { value: 'idea', label: 'Idea', emoji: '💡' },
  { value: 'feature', label: 'Feature', emoji: '✨' },
  { value: 'bug', label: 'Bug', emoji: '🐞' },
  { value: 'observation', label: 'Observation', emoji: '👀' },
];

const APPS = [
  'Adhd Acclaim', 'Mandrake', 'SyncFit', 'Tou.Me', 'New App'
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '?'];

export default function SteaBoard() {
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [collapsedCols, setCollapsedCols] = useState(() => {
    // default: collapse Won’t Do first time
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stea-collapsed-cols');
      if (saved) return JSON.parse(saved);
    }
    return { "Won't Do": true };
  });
  const [editing, setEditing] = useState(null); // card object or null
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

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
    localStorage.setItem('stea-collapsed-cols', JSON.stringify(collapsedCols));
  }, [collapsedCols]);

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

  const toggleCol = (col) => {
    setCollapsedCols((prev) => ({ ...prev, [col]: !prev[col] }));
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
    });
    setCreating(true);
  };

  const saveCard = async (card) => {
    const payload = {
      title: card.title?.trim() || 'Untitled',
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
      await addDoc(collection(db, 'stea_cards'), payload);
    }
    setEditing(null);
    setCreating(false);
  };

  const deleteCard = async (id) => {
    if (!id) return;
    await deleteDoc(doc(db, 'stea_cards', id));
    setEditing(null);
  };

  // Double-click & double-tap support
  const tapTimes = useRef({});
  const handleOpenEdit = (card) => setEditing(card);

  const onCardPointerDown = (cardId, card) => (e) => {
    const now = Date.now();
    const last = tapTimes.current[cardId] || 0;
    tapTimes.current[cardId] = now;
    if (now - last < 300) {
      handleOpenEdit(card);
    }
  };

  const moveTo = async (card, nextCol) => {
    await updateDoc(doc(db, 'stea_cards', card.id), {
      statusColumn: nextCol,
      updatedAt: serverTimestamp(),
    });
  };

  const ColumnHeader = ({ name, count }) => (
    <div className="flex items-center justify-between mb-2">
      <div className="font-bold">{name}</div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{count}</span>
        <button
          onClick={() => toggleCol(name)}
          className="px-2 py-1 text-xs rounded border hover:bg-gray-50"
          aria-pressed={!!collapsedCols[name]}
        >
          {collapsedCols[name] ? 'Show' : 'Hide'}
        </button>
      </div>
    </div>
  );

  const Card = ({ card }) => {
    const nextIdx =
      Math.min(COLUMNS.indexOf(card.statusColumn || 'Idea') + 1, COLUMNS.length - 1);
    const prevIdx =
      Math.max(COLUMNS.indexOf(card.statusColumn || 'Idea') - 1, 0);

    return (
      <div
        className="relative rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow transition"
        onDoubleClick={() => handleOpenEdit(card)}
        onPointerDown={onCardPointerDown(card.id, card)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleOpenEdit(card);
        }}
      >
        <div className="absolute right-2 top-2">
          <button
            onClick={() => handleOpenEdit(card)}
            className="px-2 py-1 text-xs rounded bg-gray-800 text-white"
          >
            Edit
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs mb-1">
          <span className="px-2 py-0.5 rounded bg-gray-100 border">
            {TYPES.find(t => t.value === card.type)?.emoji}{' '}
            {TYPES.find(t => t.value === card.type)?.label || 'Item'}
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
            {card.app || 'New App'}
          </span>
          <span className="px-2 py-0.5 rounded bg-gray-50 border">
            Size: {card.sizeEstimate || 'M'}
          </span>
          {card.statusColumn === 'Done' && card.appVersion ? (
            <span className="px-2 py-0.5 rounded bg-green-50 border border-green-200">
              v{card.appVersion}
            </span>
          ) : null}
        </div>

        <div className="font-semibold">{card.title}</div>
        {card.description ? (
          <p className="text-sm text-gray-600 mt-1 line-clamp-3">{card.description}</p>
        ) : null}

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Reporter: {card.reporter || '—'}
            {card.assignee ? ` • Assigned: ${card.assignee}` : ''}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => moveTo(card, COLUMNS[prevIdx])}
              className="px-2 py-1 text-xs rounded border hover:bg-gray-50"
            >
              ← Move
            </button>
            <button
              onClick={() => moveTo(card, COLUMNS[nextIdx])}
              className="px-2 py-1 text-xs rounded border hover:bg-gray-50"
            >
              Move →
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="pb-10 max-w-7xl mx-auto px-4">
      {/* Top bar */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10"
          src="/img/logo-mark.png"
          width={64}
          height={64}
          alt="Arcturus mark"
          priority
        />
        <div className="flex-1">
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
            {user ? (
              <div className="ml-auto flex items-center gap-3">
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={() => signOut(auth)}
                  className="px-3 py-1.5 rounded border hover:bg-gray-50"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {COLUMNS.map((col) => {
          const colCards = grouped[col] || [];
          return (
            <section key={col} className="card p-3">
              <ColumnHeader name={col} count={colCards.length} />
              {collapsedCols[col] ? (
                <div className="text-xs text-gray-500 p-3 border rounded bg-gray-50">
                  Column hidden
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {colCards.map((c) => (
                    <Card key={c.id} card={c} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Edit/Create modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="font-bold">
                {creating ? 'New Card' : 'Edit Card'}
              </div>
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
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
