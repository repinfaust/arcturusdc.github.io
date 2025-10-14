'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const LS_KEY = 'stea-board-v1';

const COLUMNS = ['Idea', 'Planning', 'Design', 'Build'];

const TYPE_OPTIONS = [
  { value: 'idea', label: 'Idea', emoji: '💡' },
  { value: 'feature', label: 'Feature', emoji: '✨' },
  { value: 'bug', label: 'Bug', emoji: '🐞' },
  { value: 'observation', label: 'Observation', emoji: '👀' },
  { value: 'newapp', label: 'New App', emoji: '📱' },
];

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

function classNames(...s) {
  return s.filter(Boolean).join(' ');
}

function urgencyBadge(urgency) {
  const map = {
    low: 'bg-gray-100 text-gray-700 border-gray-200',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };
  return map[urgency] || map.low;
}

function typeBadge(type) {
  const map = {
    idea: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    feature: 'bg-purple-100 text-purple-800 border-purple-200',
    bug: 'bg-rose-100 text-rose-800 border-rose-200',
    observation: 'bg-amber-100 text-amber-800 border-amber-200',
    newapp: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  };
  return map[type] || map.idea;
}

export default function SteaBoardPage() {
  const [cards, setCards] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [form, setForm] = useState({
    type: 'idea',
    urgency: 'medium',
    title: '',
    description: '',
  });

  // Drag state
  const [draggingId, setDraggingId] = useState(null);

  // Load / Save
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        setCards(JSON.parse(saved));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(cards));
  }, [cards]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ type: 'idea', urgency: 'medium', title: '', description: '' });
    setModalOpen(true);
  };

  const openEditModal = (card) => {
    setEditingId(card.id);
    setForm({
      type: card.type,
      urgency: card.urgency,
      title: card.title,
      description: card.description ?? '',
    });
    setModalOpen(true);
  };

  const saveForm = () => {
    const now = new Date().toISOString();
    if (!form.title.trim()) {
      alert('Please enter a title.');
      return;
    }
    if (editingId) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                ...form,
                updatedAt: now,
              }
            : c
        )
      );
    } else {
      const newCard = {
        id: `stea_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        status: 'Idea', // new cards start in Idea
        createdAt: now,
        updatedAt: now,
        ...form,
      };
      setCards((prev) => [newCard, ...prev]);
    }
    setModalOpen(false);
  };

  const deleteCard = (id) => {
    if (confirm('Delete this card?')) {
      setCards((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const moveCard = (id, status) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const onDragStart = (e, id) => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    if (id) moveCard(id, status);
    setDraggingId(null);
  };

  const grouped = useMemo(() => {
    const g = Object.fromEntries(COLUMNS.map((c) => [c, []]));
    cards.forEach((card) => {
      if (!g[card.status]) g['Idea'].push(card);
      else g[card.status].push(card);
    });
    // simple sort: critical/high first, then updatedAt desc
    const weight = { critical: 3, high: 2, medium: 1, low: 0 };
    COLUMNS.forEach((col) => {
      g[col].sort((a, b) => {
        const uw = (weight[b.urgency] ?? 0) - (weight[a.urgency] ?? 0);
        if (uw !== 0) return uw;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
    });
    return g;
  }, [cards]);

  return (
    <main className="pb-10 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10"
          src="/img/arcturusdc_mark.png"
          width={56}
          height={56}
          alt="Arcturus mark"
          priority
        />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-extrabold text-2xl">STEa — Studio Experiments & Apps</h1>
            <span className="px-2 py-0.5 text-xs rounded bg-gray-100 border border-gray-200 text-gray-600">
              Very light Jira/Kanban
            </span>
          </div>
          <p className="text-sm text-neutral-700 mt-1">
            Capture ideas, polish them, and move them through{' '}
            <span className="font-semibold">Idea → Planning → Design → Build</span>. Data is saved locally
            in your browser.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              + New card
            </button>
            <button
              onClick={() => {
                if (confirm('Reset board to empty? This will clear local data.')) {
                  setCards([]);
                }
              }}
              className="px-3 py-2 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-800 transition-colors"
            >
              Reset board
            </button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(cards, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `stea-export-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
              className="px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 transition-colors"
            >
              Export JSON
            </button>
            <button
              onClick={async () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.onchange = (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const parsed = JSON.parse(reader.result);
                      if (Array.isArray(parsed)) setCards(parsed);
                      else alert('Invalid file format.');
                    } catch {
                      alert('Could not parse JSON.');
                    }
                  };
                  reader.readAsText(file);
                };
                input.click();
              }}
              className="px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 transition-colors"
            >
              Import JSON
            </button>
            <span className="ml-auto text-xs text-gray-500">
              Need testers?{' '}
              <Link className="underline hover:text-gray-700" href="/apps/toume/testersonlypage">
                Tou.me testing portal
              </Link>
            </span>
          </div>
        </div>
      </div>

      {/* Board */}
      <section className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div
            key={col}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, col)}
            className="card p-3 min-h-[320px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-extrabold">{col}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-600">
                {grouped[col]?.length ?? 0}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              {(grouped[col] ?? []).map((card) => (
                <article
                  key={card.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, card.id)}
                  className={classNames(
                    'border rounded-lg bg-white p-3 shadow-sm hover:shadow transition-shadow cursor-grab active:cursor-grabbing',
                    draggingId === card.id ? 'opacity-70' : ''
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-5">{card.title}</h3>
                    <button
                      onClick={() => openEditModal(card)}
                      className="text-xs px-2 py-1 rounded bg-gray-100 border border-gray-200 hover:bg-gray-200"
                      title="Edit"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={classNames(
                        'px-2 py-0.5 text-[10px] font-medium rounded border',
                        typeBadge(card.type)
                      )}
                    >
                      {TYPE_OPTIONS.find((t) => t.value === card.type)?.emoji}{' '}
                      {TYPE_OPTIONS.find((t) => t.value === card.type)?.label}
                    </span>
                    <span
                      className={classNames(
                        'px-2 py-0.5 text-[10px] font-medium rounded border',
                        urgencyBadge(card.urgency)
                      )}
                    >
                      {card.urgency.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-auto">
                      {new Date(card.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  {card.description ? (
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                      {card.description}
                    </p>
                  ) : null}
                  <div className="mt-3 flex items-center gap-2">
                    {COLUMNS.filter((c) => c !== card.status).map((next) => (
                      <button
                        key={next}
                        onClick={() => moveCard(card.id, next)}
                        className="text-xs px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800"
                      >
                        Move → {next}
                      </button>
                    ))}
                    <button
                      onClick={() => deleteCard(card.id)}
                      className="ml-auto text-xs px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {/* Drop hint */}
            <div className="mt-2 text-center text-xs text-gray-400">Drag cards here</div>
          </div>
        ))}
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl card p-5">
            <h3 className="text-xl font-extrabold mb-3">
              {editingId ? 'Edit card' : 'Create a new card'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.emoji} {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Urgency</label>
                <select
                  value={form.urgency}
                  onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {URGENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Add calendar free-time finder to SyncFit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Details, acceptance criteria, notes…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Cards are saved to your browser (localStorage).
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={saveForm}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  {editingId ? 'Save changes' : 'Create card'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <section className="card p-4 mt-4 text-center">
        <p className="text-sm text-gray-600">
          STEa lives at <code className="px-1 py-0.5 bg-gray-100 rounded border border-gray-200">/apps/stea</code>.
          Keep it scrappy, keep it moving. 🚀
        </p>
      </section>
    </main>
  );
}
