'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  addDoc, collection, doc, onSnapshot, orderBy, query,
  serverTimestamp, updateDoc, deleteDoc, where
} from 'firebase/firestore';

const COLUMNS = ['Idea', 'Planning', 'Design', 'Build'];

const TYPES = [
  { value: 'idea', label: 'Idea', emoji: '💡' },
  { value: 'feature', label: 'Feature', emoji: '✨' },
  { value: 'bug', label: 'Bug', emoji: '🐞' },
  { value: 'observation', label: 'Observation', emoji: '👀' },
  { value: 'newapp', label: 'New App', emoji: '📱' },
];

const URGENCY = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

function cls(...s) { return s.filter(Boolean).join(' '); }

export default function SteaBoard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ type: 'idea', urgency: 'medium', title: '', description: '' });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace('/apps/stea');
        return;
      }
      setUser(u);

      const q = query(
        collection(db, 'stea_cards'),
        where('ownerUid', '==', u.uid),
        orderBy('updatedAt', 'desc')
      );
      const unsubData = onSnapshot(q, (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setCards(arr);
        setLoading(false);
      });
      return () => unsubData();
    });
    return () => unsubAuth();
  }, [router]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ type: 'idea', urgency: 'medium', title: '', description: '' });
    setModalOpen(true);
  };

  const saveForm = async () => {
    if (!form.title.trim()) { alert('Title required'); return; }
    if (editingId) {
      await updateDoc(doc(db, 'stea_cards', editingId), {
        ...form,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, 'stea_cards'), {
        ...form,
        status: 'Idea',
        ownerUid: user.uid,
        ownerEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    setModalOpen(false);
  };

  const moveCard = async (id, status) => {
    await updateDoc(doc(db, 'stea_cards', id), { status, updatedAt: serverTimestamp() });
  };

  const deleteCard = async (id) => {
    if (confirm('Delete this card?')) await deleteDoc(doc(db, 'stea_cards', id));
  };

  const onDragStart = (e, id) => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e) => e.preventDefault();
  const onDrop = async (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    if (id) await moveCard(id, status);
    setDraggingId(null);
  };

  const grouped = useMemo(() => {
    const g = Object.fromEntries(COLUMNS.map((c) => [c, []]));
    cards.forEach((c) => (g[c.status] ? g[c.status].push(c) : g.Idea.push(c)));
    return g;
  }, [cards]);

  if (loading) return <main className="max-w-5xl mx-auto p-10">Loading…</main>;

  return (
    <main className="pb-10 max-w-7xl mx-auto px-4">
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image src="/img/arcturusdc_mark.png" width={56} height={56} alt="Arcturus mark" className="rounded-2xl border border-black/10" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-extrabold text-2xl">STEa — Board</h1>
            <span className="text-xs px-2 py-0.5 bg-gray-100 border border-gray-200 rounded">{user?.email}</span>
            <button onClick={() => signOut(auth)} className="ml-auto px-3 py-1.5 bg-gray-100 border rounded hover:bg-gray-200 text-sm">
              Sign out
            </button>
          </div>
          <p className="text-sm text-neutral-700 mt-1">Manage ideas → build phases. Auto-saved to Firestore.</p>
          <button onClick={openCreate} className="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            + New card
          </button>
        </div>
      </div>

      <section className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col} onDragOver={onDragOver} onDrop={(e) => onDrop(e, col)} className="card p-3 min-h-[320px] flex flex-col">
            <h2 className="font-bold mb-2">{col}</h2>
            <div className="space-y-2 flex-1">
              {(grouped[col] ?? []).map((card) => (
                <article
                  key={card.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, card.id)}
                  className="border rounded-lg p-3 bg-white shadow-sm cursor-grab"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{card.title}</h3>
                    <button onClick={() => deleteCard(card.id)} className="text-xs text-red-600">✕</button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{card.description}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded border bg-gray-50">{card.type}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded border bg-gray-50">{card.urgency}</span>
                    <button
                      onClick={() => moveCard(card.id, COLUMNS[(COLUMNS.indexOf(card.status) + 1) % COLUMNS.length])}
                      className="ml-auto text-xs px-2 py-0.5 bg-blue-100 border border-blue-200 rounded"
                    >
                      Move →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg relative">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'New'} Card</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border rounded px-2 py-1">
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1">Urgency</label>
                <select value={form.urgency} onChange={(e) => setForm(f => ({ ...f, urgency: e.target.value }))} className="w-full border rounded px-2 py-1">
                  {URGENCY.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="text-sm font-medium mb-1">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="mt-3">
              <label className="text-sm font-medium mb-1">Description</label>
              <textarea rows="4" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded bg-gray-100">Cancel</button>
              <button onClick={saveForm} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
