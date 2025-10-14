'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  addDoc, collection, doc, onSnapshot, orderBy, query,
  serverTimestamp, updateDoc, deleteDoc, getDoc
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

const APPS = [
  { value: 'adhd-acclaim', label: 'ADHD Acclaim' },
  { value: 'mandrake', label: 'Mandrake' },
  { value: 'syncfit', label: 'SyncFit' },
  { value: 'toume', label: 'Tou.Me' },
  { value: 'new', label: 'New App' },
];

function appLabel(v) {
  return APPS.find(a => a.value === v)?.label ?? 'New App';
}

export default function SteaBoard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    type: 'idea',
    urgency: 'medium',
    app: 'new',
    reporter: '',
    assignee: '',
    title: '',
    description: '',
    attachments: []
  });

  // Comments state (only loaded while modal is open on a specific card)
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const commentsUnsubRef = useRef(null);

  const [uploading, setUploading] = useState(false);

  /* ---------- Auth + board sync ---------- */
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace('/apps/stea');
        return;
      }
      setUser(u);

      const qCards = query(collection(db, 'stea_cards'), orderBy('updatedAt', 'desc'));
      const unsubData = onSnapshot(qCards, (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setCards(arr);
        setLoading(false);
      });
      return () => unsubData();
    });
    return () => unsubAuth();
  }, [router]);

  /* ---------- Modal helpers ---------- */
  const cleanupCommentsListener = () => {
    if (commentsUnsubRef.current) {
      commentsUnsubRef.current();
      commentsUnsubRef.current = null;
    }
    setComments([]);
    setNewComment('');
  };

  const openCreate = () => {
    setEditingId(null);
    cleanupCommentsListener();
    setForm({
      type: 'idea',
      urgency: 'medium',
      app: 'new',
      reporter: user?.email || '',
      assignee: '',
      title: '',
      description: '',
      attachments: []
    });
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    setEditingId(id);
    const snap = await getDoc(doc(db, 'stea_cards', id));
    const d = snap.data();
    setForm({
      type: d?.type || 'idea',
      urgency: d?.urgency || 'medium',
      app: d?.app || 'new',
      reporter: d?.reporter || '',
      assignee: d?.assignee || '',
      title: d?.title || '',
      description: d?.description || '',
      attachments: d?.attachments || []
    });

    // Live comments for this card
    cleanupCommentsListener();
    const qComments = query(
      collection(db, 'stea_cards', id, 'comments'),
      orderBy('createdAt', 'asc')
    );
    commentsUnsubRef.current = onSnapshot(qComments, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setComments(arr);
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    cleanupCommentsListener();
  };

  const saveForm = async () => {
    if (!form.title.trim()) { alert('Title required'); return; }
    if (editingId) {
      await updateDoc(doc(db, 'stea_cards', editingId), {
        ...form,
        updatedAt: serverTimestamp(),
      });
    } else {
      const newDoc = await addDoc(collection(db, 'stea_cards'), {
        ...form,
        status: 'Idea',
        ownerUid: user.uid,
        ownerEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // After creating, attach comment listener to new card if modal stays open
      setEditingId(newDoc.id);
      const qComments = query(
        collection(db, 'stea_cards', newDoc.id, 'comments'),
        orderBy('createdAt', 'asc')
      );
      commentsUnsubRef.current = onSnapshot(qComments, (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setComments(arr);
      });
    }
    // keep modal open so user can add comments/attachments if they want
  };

  /* ---------- Uploads ---------- */
  const handleFileUpload = async (files) => {
    const storage = getStorage();
    setUploading(true);
    try {
      const uploadedURLs = [];
      for (const file of files) {
        const fileRef = ref(storage, `stea_uploads/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        uploadedURLs.push(url);
      }
      setForm(f => ({ ...f, attachments: [...(f.attachments || []), ...uploadedURLs] }));
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) handleFileUpload(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) handleFileUpload(files);
  };

  /* ---------- Card ops ---------- */
  const moveCard = async (id, status) => {
    await updateDoc(doc(db, 'stea_cards', id), { status, updatedAt: serverTimestamp() });
  };

  const updateCardField = async (id, field, value) => {
    await updateDoc(doc(db, 'stea_cards', id), { [field]: value, updatedAt: serverTimestamp() });
  };

  const deleteCard = async (id) => {
    if (confirm('Delete this card?')) {
      // (Optional) you could also delete subcollection comments via a Cloud Function
      await deleteDoc(doc(db, 'stea_cards', id));
      if (editingId === id) closeModal();
    }
  };

  /* ---------- Comments ops ---------- */
  const addComment = async () => {
    const text = newComment.trim();
    if (!editingId) { alert('Save the card first, then comment.'); return; }
    if (!text) return;

    await addDoc(collection(db, 'stea_cards', editingId, 'comments'), {
      text,
      authorEmail: user?.email || 'unknown',
      authorUid: user?.uid || null,
      createdAt: serverTimestamp()
    });
    setNewComment('');
  };

  const deleteComment = async (commentId) => {
    if (!editingId) return;
    if (!confirm('Delete this comment?')) return;
    await deleteDoc(doc(db, 'stea_cards', editingId, 'comments', commentId));
  };

  /* ---------- DnD across columns ---------- */
  const onDragStart = (e, id) => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e) => e.preventDefault();
  const onDropColumn = async (e, status) => {
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

  /* ---------- Render ---------- */
  return (
    <main className="pb-10 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="card p-4 flex flex-wrap items-center gap-3 mt-2">
        <Image
          src="/img/logo-mark.png"
          width={56}
          height={56}
          alt="Arcturus mark"
          className="rounded-2xl border border-black/10 flex-shrink-0"
        />
        <div className="flex-1 min-w-[200px]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="font-extrabold text-2xl whitespace-nowrap">STEa — Board</h1>
            <span className="text-xs px-2 py-0.5 bg-gray-100 border border-gray-200 rounded break-all">
              {user?.email}
            </span>
            <button
              onClick={() => signOut(auth)}
              className="px-3 py-1.5 bg-gray-100 border rounded hover:bg-gray-200 text-sm ml-auto"
            >
              Sign out
            </button>
          </div>
          <p className="text-sm text-neutral-700 mt-1">
            Manage ideas → build phases. Auto-saved to Firestore.
          </p>
          <button
            onClick={openCreate}
            className="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto"
          >
            + New card
          </button>
        </div>
      </div>

      {/* Columns */}
      <section className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div
            key={col}
            onDragOver={onDragOver}
            onDrop={(e) => onDropColumn(e, col)}
            className="card p-3 min-h-[360px] flex flex-col"
          >
            <h2 className="font-bold mb-2">{col}</h2>
            <div className="space-y-2 flex-1">
              {(grouped[col] ?? []).map((card) => (
                <article
                  key={card.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, card.id)}
                  className="border rounded-lg p-3 bg-white shadow-sm cursor-grab overflow-hidden"
                >
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <h3 className="font-semibold break-words">{card.title}</h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(card.id)}
                        className="text-xs px-2 py-0.5 border rounded hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCard(card.id)}
                        className="text-xs text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {card.description && (
                    <p className="text-xs text-gray-600 mt-1 break-words whitespace-pre-wrap">
                      {card.description}
                    </p>
                  )}

                  {/* Attachments */}
                  {card.attachments?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {card.attachments.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-16 h-16 overflow-hidden border rounded"
                        >
                          <img
                            src={url}
                            alt={`attachment-${i}`}
                            className="object-cover w-full h-full"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex gap-2 mt-2 flex-wrap text-[10px]">
                    <span className="px-2 py-0.5 rounded border bg-gray-50">{card.type}</span>
                    <span className="px-2 py-0.5 rounded border bg-gray-50">{card.urgency}</span>
                    <span className="px-2 py-0.5 rounded border bg-gray-50">{appLabel(card.app)}</span>
                    {card.reporter && (
                      <span className="px-2 py-0.5 rounded border bg-gray-50 break-all">
                        Reporter: {card.reporter}
                      </span>
                    )}
                    {card.assignee && (
                      <span className="px-2 py-0.5 rounded border bg-gray-50 break-all">
                        Assigned: {card.assignee}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() =>
                        moveCard(
                          card.id,
                          COLUMNS[(COLUMNS.indexOf(card.status) + 1) % COLUMNS.length]
                        )
                      }
                      className="text-xs px-2 py-0.5 bg-blue-100 border border-blue-200 rounded"
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div
            className="bg-white rounded-lg p-6 w-full max-w-3xl relative"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Edit' : 'New'} Card
            </h2>

            {/* Form grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column: fields + uploads */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full border rounded px-2 py-1"
                    >
                      {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1">Urgency</label>
                    <select
                      value={form.urgency}
                      onChange={(e) => setForm(f => ({ ...f, urgency: e.target.value }))}
                      className="w-full border rounded px-2 py-1"
                    >
                      {URGENCY.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1">App</label>
                    <select
                      value={form.app}
                      onChange={(e) => setForm(f => ({ ...f, app: e.target.value }))}
                      className="w-full border rounded px-2 py-1"
                    >
                      {APPS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1">Reporter</label>
                    <input
                      type="text"
                      value={form.reporter}
                      onChange={(e) => setForm(f => ({ ...f, reporter: e.target.value }))}
                      className="w-full border rounded px-2 py-1"
                      placeholder="name or email"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1">Assigned to</label>
                    <input
                      type="text"
                      value={form.assignee}
                      onChange={(e) => setForm(f => ({ ...f, assignee: e.target.value }))}
                      className="w-full border rounded px-2 py-1"
                      placeholder="name or email"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div className="mt-3">
                  <label className="text-sm font-medium mb-1">Description</label>
                  <textarea
                    rows="5"
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>

                {/* Upload area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="mt-4 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer bg-gray-50 hover:bg-gray-100"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <p className="text-sm text-gray-700">
                    {uploading ? 'Uploading...' : 'Drag & drop screenshots here or click to upload'}
                  </p>
                  <input
                    id="fileInput"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {form.attachments?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.attachments.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`preview-${i}`}
                        className="w-16 h-16 object-cover border rounded"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right column: comments */}
              <div className="lg:border-l lg:pl-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Comments</h3>
                  {!editingId && (
                    <span className="text-xs text-gray-500">
                      Save the card to enable comments
                    </span>
                  )}
                </div>

                <div className="max-h-64 overflow-auto space-y-2 pr-1">
                  {comments.length === 0 && (
                    <div className="text-sm text-gray-500">No comments yet.</div>
                  )}
                  {comments.map((c) => {
                    const ts = c.createdAt?.toDate
                      ? c.createdAt.toDate()
                      : (c.createdAt?._seconds ? new Date(c.createdAt._seconds * 1000) : null);
                    const when = ts ? ts.toLocaleString() : '…';
                    return (
                      <div key={c.id} className="border rounded p-2 bg-gray-50">
                        <div className="text-xs text-gray-600 flex justify-between gap-2">
                          <span className="break-all">{c.authorEmail || 'Unknown'}</span>
                          <span>{when}</span>
                        </div>
                        <div className="text-sm mt-1 whitespace-pre-wrap break-words">
                          {c.text}
                        </div>
                        <div className="flex justify-end mt-1">
                          <button
                            onClick={() => deleteComment(c.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    placeholder={editingId ? "Add a comment…" : "Save card to comment"}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={!editingId}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (editingId) addComment();
                      }
                    }}
                  />
                  <button
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                    onClick={addComment}
                    disabled={!editingId || !newComment.trim()}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 border rounded bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={saveForm}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                disabled={uploading}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
