'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import {
  addDoc, arrayUnion, collection, doc, getDoc, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp, setDoc, updateDoc
} from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

/** ✅ tldraw */
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

setLogLevel('debug');

/* =========================
   CONFIG & CONSTANTS
   ========================= */
const LANE_OPTIONS = [null, 'now', 'next', 'later']; // null = backlog
const DEFAULT_PROJECT_NAME = 'Felix Product Lab';
const DEFAULT_BOARD_NAME = 'Main Whiteboard';

const BADGES = {
  brainstormer: { id: 'brainstormer', name: 'Brainstormer', emoji: '🧠', xp: 10, lesson: 'Ideas are seeds — quantity helps quality.' },
  powerup:      { id: 'powerup',      name: 'Power-Up!',    emoji: '⚡️', xp: 20, lesson: 'You turned an idea into something buildable.' },
  storyteller:  { id: 'storyteller',  name: 'Storyteller',  emoji: '✍️', xp: 10, lesson: 'Every story starts with a user need.' },
  precision:    { id: 'precision',    name: 'Precision Master', emoji: '🎯', xp: 15, lesson: 'Defining done helps teams move fast.' },
  mvp_arch:     { id: 'mvp_arch',     name: 'MVP Architect', emoji: '🧩', xp: 20, lesson: 'Start small. Learn fast.' },
};

/* =========================
   AUTH HOOK
   ========================= */
function useAuth() {
  const [user, setUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  const login = async () => { await signInWithPopup(auth, new GoogleAuthProvider()); };
  const logout = async () => { await signOut(auth); };
  return { user, login, logout };
}

/* =========================
   PROJECT INIT
   ========================= */
async function ensureProjectAndBoard(uid) {
  const projectId = uid.slice(0, 6) + '_felix_lab';
  const projectRef = doc(db, 'projects', projectId);
  const snap = await getDoc(projectRef);
  if (!snap.exists()) {
    await setDoc(projectRef, {
      ownerUid: uid, name: DEFAULT_PROJECT_NAME, members: [uid], createdAt: serverTimestamp(),
    });
  } else {
    const data = snap.data();
    if (!data?.members?.includes(uid)) await updateDoc(projectRef, { members: arrayUnion(uid) });
  }

  const boardId = 'main';
  const boardRef = doc(db, `projects/${projectId}/whiteboards`, boardId);
  if (!(await getDoc(boardRef)).exists()) {
    await setDoc(boardRef, { name: DEFAULT_BOARD_NAME, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }

  const userRef = doc(db, 'users', uid);
  if (!(await getDoc(userRef)).exists()) {
    await setDoc(userRef, {
      displayName: auth.currentUser?.displayName || 'User',
      totalXP: 0, level: 1, badgesEarned: 0, createdAt: serverTimestamp(),
    });
  }

  const metricsRef = doc(db, `users/${uid}/metrics`, 'main');
  if (!(await getDoc(metricsRef)).exists()) {
    await setDoc(metricsRef, {
      notesCreated: 0, storiesCreated: 0, movedToNowCount: 0,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  }

  return { projectId, boardId };
}

/* =========================
   BADGE ENGINE
   ========================= */
async function earnBadge(uid, badgeKey) {
  const badge = BADGES[badgeKey];
  if (!badge) return;

  const badgeRef = doc(db, `users/${uid}/badges`, badge.id);
  const userRef = doc(db, 'users', uid);

  await runTransaction(db, async (tx) => {
    const badgeSnap = await tx.get(badgeRef);
    if (badgeSnap.exists()) return;

    tx.set(badgeRef, { ...badge, earnedAt: serverTimestamp() });
    const userSnap = await tx.get(userRef);
    const d = userSnap.exists() ? userSnap.data() : { totalXP: 0, level: 1, badgesEarned: 0 };
    const totalXP = (d.totalXP || 0) + badge.xp;
    const level = Math.floor(totalXP / 100) + 1;
    const badgesEarned = (d.badgesEarned || 0) + 1;
    tx.set(userRef, { totalXP, level, badgesEarned }, { merge: true });
  });
}

async function incMetric(uid, field, incBy = 1) {
  const metricsRef = doc(db, `users/${uid}/metrics`, 'main');
  await runTransaction(db, async (tx) => {
    const m = await tx.get(metricsRef);
    const curr = m.exists() ? m.data() : {};
    const nextVal = (curr[field] || 0) + incBy;
    tx.set(metricsRef, { [field]: nextVal, updatedAt: serverTimestamp() }, { merge: true });

    if (field === 'notesCreated' && nextVal >= 5) await earnBadge(uid, 'brainstormer');
    if (field === 'storiesCreated' && nextVal >= 1) await earnBadge(uid, 'storyteller');
    if (field === 'movedToNowCount' && nextVal >= 3) await earnBadge(uid, 'mvp_arch');
  });
}

/* =========================
   JTBD / QUESTIONS
   ========================= */
function JobsSidebar({ projectId, boardId }) {
  if (!projectId || !boardId) return null; // guard
  const [tab, setTab] = useState('jtbd');
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const collPath = `projects/${projectId}/whiteboards/${boardId}/jobs`;

  useEffect(() => {
    const qy = query(collection(db, collPath), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(qy, (s) => {
      const arr = [];
      s.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setItems(arr);
    }, (e) => {
      console.error('[JobsSidebar onSnapshot]', collPath, e);
    });
    return () => unsub();
  }, [projectId, boardId]);

  const addItem = async () => {
    if (!text.trim()) return;
    await addDoc(collection(db, collPath), {
      type: tab === 'jtbd' ? 'jtbd' : 'question',
      text: text.trim(),
      done: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setText('');
  };

  const toggleDone = async (id, done) => {
    await updateDoc(doc(db, collPath, id), { done: !done, updatedAt: serverTimestamp() });
  };

  const shown = items.filter((i) => i.type === (tab === 'jtbd' ? 'jtbd' : 'question'));

  return (
    <aside className="w-full lg:w-72 shrink-0 rounded-2xl border bg-white/70 p-3 min-w-0">
      <div className="mb-2 flex gap-2">
        <button
          onClick={() => setTab('jtbd')}
          className={`flex-1 rounded-lg px-2 py-1 text-sm ${tab==='jtbd'?'bg-neutral-900 text-white':'bg-neutral-200 hover:bg-neutral-300'}`}
        >
          Jobs to be done
        </button>
        <button
          onClick={() => setTab('q')}
          className={`flex-1 rounded-lg px-2 py-1 text-sm ${tab==='q'?'bg-neutral-900 text-white':'bg-neutral-200 hover:bg-neutral-300'}`}
        >
          Questions
        </button>
      </div>

      <form onSubmit={(e)=>{e.preventDefault(); addItem();}} className="mb-2 flex items-center gap-2">
        <input
          value={text}
          onChange={(e)=>setText(e.target.value)}
          placeholder={tab==='jtbd' ? 'Add a job…' : 'Add a question…'}
          className="flex-1 min-w-0 rounded-md border px-2 py-1 text-sm"
        />
        <button className="shrink-0 rounded-md bg-emerald-200 px-3 py-1 text-xs hover:bg-emerald-300">Add</button>
      </form>

      <ul className="space-y-2">
        {shown.map((i)=>(
          <li key={i.id} className="flex items-start gap-2 rounded-lg border bg-neutral-50 p-2">
            <input type="checkbox" checked={!!i.done} onChange={()=>toggleDone(i.id, !!i.done)} className="mt-0.5" />
            <span
              className={`block min-w-0 max-w-full text-[13px] leading-snug whitespace-pre-wrap break-all ${i.done?'line-through text-neutral-400':''}`}
              style={{ overflowWrap: 'anywhere' }}
            >
              {i.text}
            </span>
          </li>
        ))}
        {shown.length===0 && <li className="text-xs text-neutral-500">Nothing here yet.</li>}
      </ul>
    </aside>
  );
}

/* =========================
   TLDraw Whiteboard with Firestore persistence
   ========================= */
function TLDrawWhiteboard({ projectId, boardId, user }) {
  if (!projectId || !boardId) return null; // guard
  const editorRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // ✅ Reference the BOARD document (store snapshot as a field)
  const boardDocRef = useMemo(
    () => doc(db, 'projects', projectId, 'whiteboards', boardId),
    [projectId, boardId]
  );

  // Debounce helper
  const saveTimer = useRef(null);
  const debounceSave = (fn, ms = 750) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(fn, ms);
  };

  // Small helper: wait until editor.store is available, then run setup
  const whenStoreReady = (editor, fn, tries = 40) => {
    if (editor && editor.store && typeof editor.store.listen === 'function') {
      try { fn(); } catch (e) { console.error('[TLDraw setup error]', e); }
      return;
    }
    if (tries <= 0) {
      console.error('[TLDraw] store not ready after retries');
      return;
    }
    setTimeout(() => whenStoreReady(editor, fn, tries - 1), 50);
  };

  // Load initial snapshot (if any) from board doc
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(boardDocRef);
        const data = snap.exists() ? snap.data() : null;
        const initial = data?.tldrawSnapshot || null;
        if (!editorRef.current) {
          // stash until onMount runs
          editorRef.current = { __initialSnapshot: initial };
        } else if (initial && editorRef.current?.store?.loadSnapshot) {
          try { editorRef.current.store.loadSnapshot(initial); } catch {}
        }
        setLoaded(true);
      } catch (e) {
        console.error('[TLDraw load boardDocRef]', `projects/${projectId}/whiteboards/${boardId}`, e);
      }
    })();
  }, [boardDocRef, boardId, projectId]);

  // Live watcher (pull updates from other tabs)
  useEffect(() => {
    const unsub = onSnapshot(
      boardDocRef,
      (snap) => {
        if (!editorRef.current || !snap.exists()) return;
        const remote = snap.data();
        if (!remote?.tldrawSnapshot) return;
        try {
          const current = editorRef.current?.store?.getSnapshot
            ? editorRef.current.store.getSnapshot()
            : null;
          if (!current || JSON.stringify(current) !== JSON.stringify(remote.tldrawSnapshot)) {
            editorRef.current?.store?.loadSnapshot?.(remote.tldrawSnapshot);
          }
        } catch (e) {
          console.error('[TLDraw onSnapshot apply]', e);
        }
      },
      (err) => {
        console.error('[TLDraw onSnapshot error]', `projects/${projectId}/whiteboards/${boardId}`, err);
      }
    );
    return () => unsub();
  }, [boardDocRef, boardId, projectId]);

  // Upgrade → Story button (floating)
  const UpgradeButton = () => {
    const [visible, setVisible] = useState(false);
    const [title, setTitle] = useState('');
    useEffect(() => {
      if (!editorRef.current) return;
      // wait for store then attach listener
      whenStoreReady(editorRef.current, () => {
        const stop = editorRef.current.store.listen(() => {
          const sel = editorRef.current.getSelectedShapes?.() || [];
          const note = sel.find((s) => s.type === 'note' || s.type === 'text');
          if (note) {
            setTitle((note.props && note.props.text) || '');
            setVisible(true);
          } else {
            setVisible(false);
          }
        }, { scope: 'user' });
        // cleanup
        editorRef.current._unmountUser = stop;
      });
      return () => {
        try { editorRef.current?._unmountUser?.(); } catch {}
      };
    }, []);
    if (!visible) return null;

    const doUpgrade = async () => {
      const sel = editorRef.current?.getSelectedShapes?.() || [];
      const note = sel.find((s) => s.type === 'note' || s.type === 'text');
      if (!note || !user) return;

      // create story
      const storiesCol = collection(db, `projects/${projectId}/stories`);
      const storyRef = doc(storiesCol);
      await setDoc(storyRef, {
        title: (title || 'Untitled').split('\n')[0].slice(0, 100),
        description: title || '',
        acceptanceCriteria: [],
        source: { boardId, elementId: note.id, shapeType: note.type },
        status: 'idea',
        priority: 'medium',
        lane: null,
        tags: [],
        assignees: [user.uid],
        xp: 0,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // mark shape with storyId in meta
      try {
        editorRef.current?.updateShapes?.([{
          id: note.id,
          type: note.type,
          meta: { ...(note.meta || {}), storyId: storyRef.id }
        }]);
      } catch {}

      await earnBadge(user.uid, 'powerup');
      await incMetric(user.uid, 'storiesCreated', 1);
    };

    return (
      <div className="pointer-events-none absolute right-3 top-3 z-10 flex gap-2">
        <button
          onClick={doUpgrade}
          className="pointer-events-auto rounded bg-indigo-600 px-3 py-1 text-xs text-white shadow hover:bg-indigo-700"
          title="Create a Story from the selected note/text"
        >
          Upgrade → Story
        </button>
      </div>
    );
  };

  return (
    <div className="relative flex-1 rounded-2xl border bg-white/70 p-4 shadow-sm min-w-0">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-lg font-semibold">Whiteboard</h2>
        <span className="text-xs text-neutral-500">Powered by tldraw</span>
      </div>

      <div className="relative h-[520px] w-full overflow-hidden rounded-xl border bg-neutral-50">
        {/* Floating upgrade button */}
        <UpgradeButton />

        {/* tldraw canvas */}
        {loaded && (
          <Tldraw
            onMount={(editor) => {
              // attach editor
              editorRef.current = editor;

              // Load any earlier snapshot grabbed during pre-mount fetch
              const init = editor.__initialSnapshot || editorRef.current?.__initialSnapshot;
              if (init && editor?.store?.loadSnapshot) {
                try { editor.store.loadSnapshot(init); } catch {}
              }

              // Persist on every change (debounced) → write to BOARD DOC
              whenStoreReady(editor, () => {
                const unlisten = editor.store.listen(
                  () => {
                    const snapshot = editor.store.getSnapshot?.();
                    if (!snapshot) return;
                    debounceSave(async () => {
                      await setDoc(
                        boardDocRef,
                        {
                          tldrawSnapshot: snapshot,
                          tldrawUpdatedAt: serverTimestamp(),
                          tldrawUpdatedBy: user?.uid || null,
                        },
                        { merge: true }
                      );
                    });
                  },
                  { scope: 'document' }
                );
                editor._unmountDoc = unlisten;
              });
            }}
            onUnmount={() => {
              try { editorRef.current?._unmountDoc?.(); } catch {}
              try { editorRef.current?._unmountUser?.(); } catch {}
              editorRef.current = null;
            }}
          />
        )}
      </div>
    </div>
  );
}

/* =========================
   STORIES KANBAN
   ========================= */
function StoriesKanban({ projectId, user }) {
  const [stories, setStories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const qAll = query(collection(db, `projects/${projectId}/stories`), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(qAll, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setStories(arr);
    }, (e) => {
      console.error('[StoriesKanban onSnapshot]', `projects/${projectId}/stories`, e);
    });
    return () => unsub();
  }, [projectId]);

  const moveToLane = async (story, lane) => {
    await updateDoc(doc(db, `projects/${projectId}/stories`, story.id), { lane, updatedAt: serverTimestamp() });
    if (lane === 'now') await incMetric(user.uid, 'movedToNowCount', 1);
  };

  const setPriority = async (story, priority) => {
    await updateDoc(doc(db, `projects/${projectId}/stories`, story.id), { priority, updatedAt: serverTimestamp() });
  };

  const addAC = async (story, text) => {
    if (!text?.trim()) return;
    const ref = doc(db, `projects/${projectId}/stories`, story.id);
    await runTransaction(db, async (tx) => {
      const s = await tx.get(ref);
      const data = s.data();
      const ac = Array.isArray(data.acceptanceCriteria) ? data.acceptanceCriteria.slice() : [];
      ac.push(text.trim());
      tx.update(ref, { acceptanceCriteria: ac, updatedAt: serverTimestamp() });
      if (ac.length >= 3) await earnBadge(story.createdBy || user.uid, 'precision');
    });
  };

  const startEdit = (story) => {
    setEditingId(story.id);
    setEditForm({
      title: story.title || '',
      description: story.description || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', description: '' });
    setSavingEdit(false);
  };

  const saveEdit = async (story) => {
    const title = editForm.title.trim();
    const description = editForm.description.trim();
    setSavingEdit(true);
    try {
      await updateDoc(doc(db, `projects/${projectId}/stories`, story.id), {
        title: title || 'Untitled',
        description,
        updatedAt: serverTimestamp(),
      });
      setEditingId(null);
      setEditForm({ title: '', description: '' });
    } catch (err) {
      console.error('Failed to update story', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const Column = ({ title, lane }) => {
    const items = stories.filter((s) => (lane === null ? s.lane == null : s.lane === lane));
    const onDrop = async (e) => {
      const id = e.dataTransfer.getData('text/story-id');
      const story = stories.find((s) => s.id === id);
      if (story) await moveToLane(story, lane);
    };

    return (
      <div
        className="min-h+[360px] flex-1 rounded-xl border bg-white/70 p-3 min-w-0"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="text-xs text-neutral-500">{items.length}</span>
        </div>
        <div className="space-y-3">
          {items.map((s) => (
            <div
              key={s.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/story-id', s.id)}
              className="rounded-xl border bg-neutral-50 p-3 shadow-sm max-w-full"
            >
              <div className="flex items-start justify-between gap-3 min-w-0">
                {editingId === s.id ? (
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      value={editForm.title}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-md border px-2 py-1 text-sm"
                      placeholder="Story title"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-md border px-2 py-2 text-sm"
                      rows={3}
                      placeholder="Describe the story…"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(s)}
                        disabled={savingEdit}
                        className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {savingEdit ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border px-3 py-1 text-xs hover:bg-neutral-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium break-words">{s.title || 'Untitled'}</div>
                    <div className="mt-1 text-[12px] text-neutral-700 whitespace-pre-wrap break-words">
                      {s.description}
                    </div>
                  </div>
                )}
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <select
                    className="rounded-md border bg-white px-2 py-1 text-xs"
                    value={s.priority || 'medium'}
                    onChange={(e) => setPriority(s, e.target.value)}
                    disabled={editingId === s.id}
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="critical">critical</option>
                  </select>
                  {editingId === s.id ? null : (
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="rounded-lg border px-3 py-0.5 text-xs hover:bg-neutral-100"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <div className="text-[10px] font-semibold uppercase text-neutral-500">Acceptance Criteria</div>
                <ul className="ml-4 list-disc text-[13px] leading-snug whitespace-pre-wrap break-words">
                  {(s.acceptanceCriteria || []).map((a, i) => (
                    <li key={i} className="break-words">{a}</li>
                  ))}
                </ul>
                <ACInput onSubmit={(text) => addAC(s, text)} />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase text-neutral-500">Move:</span>
                {LANE_OPTIONS.map((ln) => (
                  <button
                    key={String(ln)}
                    onClick={() => moveToLane(s, ln)}
                    className={`rounded-lg px-2 py-0.5 text-xs ${
                      (s.lane ?? null) === ln ? 'bg-indigo-200' : 'bg-neutral-200 hover:bg-neutral-300'
                    }`}
                  >
                    {ln ?? 'backlog'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
      <Column title="Backlog" lane={null} />
      <Column title="Now" lane="now" />
      <Column title="Next" lane="next" />
      <Column title="Later" lane="later" />
    </div>
  );
}

function ACInput({ onSubmit }) {
  const [val, setVal] = useState('');
  return (
    <form
      className="mt-2 flex gap-2 flex-wrap"
      onSubmit={(e) => { e.preventDefault(); onSubmit?.(val); setVal(''); }}
    >
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Add acceptance criterion…"
        className="flex-1 rounded-md border px-2 py-1 text-sm min-w-[180px]"
      />
      <button className="rounded-md bg-emerald-200 px-3 py-1 text-xs hover:bg-emerald-300">Add</button>
    </form>
  );
}

/* =========================
   BADGE STRIP
   ========================= */
function BadgeStrip({ user }) {
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (!user) return;
    const uref = doc(db, 'users', user.uid);
    const unsub1 = onSnapshot(uref, (snap) => setProfile(snap.data() || null));
    const qB = query(collection(db, `users/${user.uid}/badges`), orderBy('earnedAt', 'desc'));
    const unsub2 = onSnapshot(qB, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setBadges(arr);
    });
    return () => { unsub1?.(); unsub2?.(); };
  }, [user]);

  if (!user) return null;

  return (
    <div className="mt-4 rounded-2xl border bg-white/70 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Profile</div>
          <div className="text-sm text-neutral-700">
            {profile?.displayName || 'User'} — Level {profile?.level || 1} · XP {profile?.totalXP || 0}
          </div>
        </div>
        <div className="text-sm text-neutral-600">{badges.length} badges</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {badges.map((b) => (
          <span key={b.id} className="inline-flex items-center gap-1 rounded-xl border bg-neutral-50 px-3 py-1 text-sm">
            <span>{b.emoji}</span>
            <span className="font-medium break-words">{b.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* =========================
   PAGE SHELL
   ========================= */
export default function ProductLabPage() {
  const { user, login, logout } = useAuth();
  const [project, setProject] = useState(null);
  const [diagOpen, setDiagOpen] = useState(false); // flip to true to debug quickly

  useEffect(() => {
    (async () => {
      if (!user) return setProject(null);
      const ids = await ensureProjectAndBoard(user.uid);
      setProject(ids);
    })();
  }, [user]);

  return (
    <main className="mx-auto max-w-6xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold">Felix Product Lab</h1>
          <p className="text-sm text-neutral-600">
            Whiteboard → Upgrade to Story → Plan in Now/Next/Later — with badges & XP.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-neutral-600">Hi, {user.displayName || 'there'} 👋</span>
              <Link href="/apps/stea" className="rounded-xl border px-3 py-1 text-sm hover:bg-neutral-100">
                STEa Home
              </Link>
              <button onClick={logout} className="rounded-xl border px-3 py-1 text-sm hover:bg-neutral-100">Sign out</button>
            </>
          ) : (
            <button onClick={login} className="rounded-xl bg-black px-3 py-1 text-sm text-white hover:bg-neutral-800">
              Sign in with Google
            </button>
          )}
        </div>
      </header>

      {!user && (
        <div className="rounded-2xl border bg-white/70 p-6">
          <p className="text-sm">
            Sign in to create notes, upgrade to stories, and earn badges. This is a teaching sandbox for product design and development.
          </p>
        </div>
      )}

      {user && project && (
        <>
          {diagOpen && (
            <QuickDiag
              user={user}
              projectId={project.projectId}
              boardId={project.boardId}
              onClose={() => setDiagOpen(false)}
            />
          )}
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            <JobsSidebar projectId={project.projectId} boardId={project.boardId} />
            <TLDrawWhiteboard projectId={project.projectId} boardId={project.boardId} user={user} />
          </div>

          <StoriesKanban projectId={project.projectId} user={user} />
          <BadgeStrip user={user} />
          <FooterTips />
        </>
      )}
    </main>
  );
}

/** ---------------- Quick permissions & runtime diagnostics (optional) ---------------- */
function QuickDiag({ user, projectId, boardId, onClose }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    (async () => {
      const out = [];
      const push = (name, ok, msg) => out.push({ name, ok, msg });
      try {
        const p = await getDoc(doc(db, 'projects', projectId));
        push(`GET /projects/${projectId}`, true, p.exists() ? 'ok (exists)' : 'ok (missing)');
      } catch (e) {
        push(`GET /projects/${projectId}`, false, String(e));
      }
      try {
        const b = await getDoc(doc(db, 'projects', projectId, 'whiteboards', boardId));
        push(`GET /projects/${projectId}/whiteboards/${boardId}`, true, b.exists() ? 'ok (exists)' : 'ok (missing)');
      } catch (e) {
        push(`GET /projects/${projectId}/whiteboards/${boardId}`, false, String(e));
      }
      try {
        const u = await getDoc(doc(db, 'users', user.uid));
        push(`GET /users/${user.uid}`, true, u.exists() ? 'ok (exists)' : 'ok (missing)');
      } catch (e) {
        push(`GET /users/${user.uid}`, false, String(e));
      }
      try {
        const probe = doc(collection(db, `projects/${projectId}/whiteboards/${boardId}/jobs`));
        await getDoc(probe);
        push(`DOC READ /projects/${projectId}/whiteboards/${boardId}/jobs/{probe}`, true, 'ok');
      } catch (e) {
        push(`DOC READ /projects/${projectId}/whiteboards/${boardId}/jobs/{probe}`, false, String(e));
      }
      setRows(out);
    })();
  }, [user?.uid, projectId, boardId]);

  return (
    <div className="mb-4 rounded-xl border bg-amber-50 p-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Diagnostics</div>
        <button onClick={onClose} className="text-xs underline">hide</button>
      </div>
      <div className="mt-2 space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className={`mt-0.5 inline-block h-2 w-2 rounded-full ${r.ok ? 'bg-green-600' : 'bg-red-600'}`} />
            <div className="min-w-0">
              <div className="font-mono break-all">{r.name}</div>
              {!r.ok && <div className="text-[12px] text-red-700 break-all">{r.msg}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterTips() {
  return (
    <div className="mt-6 rounded-2xl border bg-white/70 p-4 text-sm text-neutral-700">
      <div className="font-semibold">Teaching tips</div>
      <ul className="ml-5 list-disc space-y-1">
        <li>Select a note/text on the whiteboard and press <span className="font-medium">Upgrade → Story</span>.</li>
        <li>Drag stories between Backlog / Now / Next / Later to plan your MVP.</li>
        <li>Add 3+ acceptance criteria to earn <span className="font-medium">🎯 Precision Master</span>.</li>
        <li>Move 3 stories into “Now” to earn <span className="font-medium">🧩 MVP Architect</span>.</li>
        <li>Create 5 notes to earn <span className="font-medium">🧠 Brainstormer</span>.</li>
      </ul>
    </div>
  );
}
