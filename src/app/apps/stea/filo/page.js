'use client';

import { useEffect, useRef, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  addDoc, arrayUnion, collection, doc, getDoc, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp, setDoc, updateDoc
} from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

setLogLevel('debug');

/* =========================
   CONFIG & CONSTANTS
   ========================= */
const LANE_OPTIONS = [null, 'now', 'next', 'later']; // null = backlog
const DEFAULT_PROJECT_NAME = 'Felix Product Lab';
const DEFAULT_BOARD_NAME = 'Main Whiteboard';
const STICKY_COLORS = ['#FEF3C7', '#E0F2FE', '#E9D5FF', '#DCFCE7', '#FFE4E6']; // amber, sky, violet, green, rose
const NEW_PLACEHOLDER = 'New idea…';

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
   LEFT SIDEBAR: JTBD / QUESTIONS
   ========================= */
function JobsSidebar({ projectId, boardId }) {
  const [tab, setTab] = useState('jtbd'); // 'jtbd' | 'q'
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');

  const collPath = `projects/${projectId}/whiteboards/${boardId}/jobs`;

  useEffect(() => {
    const qy = query(collection(db, collPath), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(qy, (s) => {
      const arr = [];
      s.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setItems(arr);
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
    <aside className="w-full sm:w-64 shrink-0 rounded-2xl border bg-white/70 p-3">
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

      <form onSubmit={(e)=>{e.preventDefault(); addItem();}} className="mb-2 flex gap-2">
        <input
          value={text}
          onChange={(e)=>setText(e.target.value)}
          placeholder={tab==='jtbd' ? 'Add a job…' : 'Add a question…'}
          className="flex-1 rounded-md border px-2 py-1 text-sm"
        />
        <button className="rounded-md bg-emerald-200 px-3 py-1 text-xs hover:bg-emerald-300">Add</button>
      </form>

      <ul className="space-y-2">
        {shown.map((i)=>(
          <li key={i.id} className="flex items-start gap-2 rounded-lg border bg-neutral-50 p-2">
            <input
              type="checkbox"
              checked={!!i.done}
              onChange={()=>toggleDone(i.id, !!i.done)}
              className="mt-0.5"
            />
            <span className={`text-sm break-words ${i.done?'line-through text-neutral-400':''}`}>
              {i.text}
            </span>
          </li>
        ))}
        {shown.length===0 && (
          <li className="text-xs text-neutral-500">Nothing here yet.</li>
        )}
      </ul>
    </aside>
  );
}

/* =========================
   WHITEBOARD
   ========================= */
function Whiteboard({ projectId, boardId, user }) {
  const [elements, setElements] = useState([]);
  const boardRef = useRef(null);

  useEffect(() => {
    const qy = query(
      collection(db, `projects/${projectId}/whiteboards/${boardId}/elements`),
      orderBy('updatedAt', 'asc')
    );
    const unsub = onSnapshot(qy, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setElements(arr);
    });
    return () => unsub();
  }, [projectId, boardId]);

  const createSticky = async () => {
    if (!user) return;
    const rect = boardRef.current?.getBoundingClientRect();
    const x = (rect?.width || 800) / 2 - 110;
    const y = (rect?.height || 500) / 2 - 70;

    await addDoc(collection(db, `projects/${projectId}/whiteboards/${boardId}/elements`), {
      type: 'sticky',
      text: NEW_PLACEHOLDER, // cleared on first focus
      meta: { color: STICKY_COLORS[0], emoji: '📝', tag: 'Idea' },
      position: { x, y, z: 1 },
      size: { w: 220, h: 120 },
      links: {},
      authorUid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await incMetric(user.uid, 'notesCreated', 1);
  };

  const onDrag = async (e, el) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = e.clientX - rect.left - (el.size?.w || 220) / 2;
    const ny = e.clientY - rect.top - 20;
    await updateDoc(doc(db, `projects/${projectId}/whiteboards/${boardId}/elements`, el.id), {
      position: { ...(el.position || {}), x: Math.max(0, nx), y: Math.max(0, ny) },
      updatedAt: serverTimestamp(),
    });
  };

  const updateText = async (id, text) => {
    await updateDoc(doc(db, `projects/${projectId}/whiteboards/${boardId}/elements`, id), {
      text, updatedAt: serverTimestamp(),
    });
  };

  const setColor = async (id, color) => {
    await updateDoc(doc(db, `projects/${projectId}/whiteboards/${boardId}/elements`, id), {
      'meta.color': color, updatedAt: serverTimestamp(),
    });
  };

  const upgradeToStory = async (el) => {
    if (!user) return;
    const storiesCol = collection(db, `projects/${projectId}/stories`);
    const storyRef = doc(storiesCol);
    const elRef = doc(db, `projects/${projectId}/whiteboards/${boardId}/elements`, el.id);

    await runTransaction(db, async (tx) => {
      const title = ((el.text || 'Untitled').replace(NEW_PLACEHOLDER, '').trim() || 'Untitled')
        .split('\n')[0].slice(0, 100);

      tx.set(storyRef, {
        title,
        description: (el.text || '').replace(NEW_PLACEHOLDER, '').trim(),
        acceptanceCriteria: [],
        source: { boardId, elementId: el.id },
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
      tx.update(elRef, { 'links.toStoryId': storyRef.id, updatedAt: serverTimestamp() });
    });

    await earnBadge(user.uid, 'powerup');
    await incMetric(user.uid, 'storiesCreated', 1);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <JobsSidebar projectId={projectId} boardId={boardId} />

      <div className="flex-1 rounded-2xl border bg-white/70 p-4 shadow-sm min-w-0">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-lg font-semibold">Whiteboard</h2>
          <button onClick={createSticky} className="rounded-xl bg-amber-200 px-3 py-1 text-sm hover:bg-amber-300">
            + Sticky
          </button>
        </div>

        <div
          ref={boardRef}
          className="relative h[420px] sm:h-[420px] h-[420px] w-full rounded-xl border bg-neutral-50 overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
        >
          {elements.map((el) => (
            <div
              key={el.id}
              draggable
              onDragEnd={(e) => onDrag(e, el)}
              className="absolute rounded-xl shadow-md"
              style={{
                left: el.position?.x ?? 20,
                top: el.position?.y ?? 20,
                width: el.size?.w ?? 220,
                height: el.size?.h ?? 120,
                background: el.meta?.color || '#FFF',
              }}
            >
              <div className="flex items-center justify-between p-2">
                <span className="text-lg">{el.meta?.emoji || '📝'}</span>

                <div className="flex items-center gap-1">
                  {STICKY_COLORS.map((c) => (
                    <button
                      key={c}
                      className="h-4 w-4 rounded-full border shadow-sm"
                      style={{ background: c }}
                      title="Change colour"
                      onClick={() => setColor(el.id, c)}
                    />
                  ))}
                  {el.links?.toStoryId ? (
                    <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Linked</span>
                  ) : (
                    <button
                      onClick={() => upgradeToStory(el)}
                      className="ml-2 rounded bg-indigo-100 px-2 py-0.5 text-xs hover:bg-indigo-200"
                    >
                      Upgrade → Story
                    </button>
                  )}
                </div>
              </div>

              <textarea
                defaultValue={el.text || ''}
                placeholder={NEW_PLACEHOLDER}
                onFocus={(e) => {
                  if (e.currentTarget.value === NEW_PLACEHOLDER) {
                    e.currentTarget.value = '';
                    updateText(el.id, '');
                  }
                }}
                onBlur={(e) => updateText(el.id, e.target.value)}
                className="h-[78px] w-full resize-none bg-transparent p-2 text-sm outline-none break-words"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================
   STORIES KANBAN
   ========================= */
function StoriesKanban({ projectId, user }) {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    const qAll = query(collection(db, `projects/${projectId}/stories`), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(qAll, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setStories(arr);
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

  const Column = ({ title, lane }) => {
    const items = stories.filter((s) => (lane === null ? s.lane == null : s.lane === lane));
    const onDrop = async (e) => {
      const id = e.dataTransfer.getData('text/story-id');
      const story = stories.find((s) => s.id === id);
      if (story) await moveToLane(story, lane);
    };

    return (
      <div
        className="min-h-[360px] flex-1 rounded-xl border bg-white/70 p-3 min-w-0"
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
              className="rounded-xl border bg-neutral-50 p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium break-words">{s.title || 'Untitled'}</div>
                  <div className="mt-1 text-xs text-neutral-600 whitespace-pre-wrap break-words">
                    {s.description}
                  </div>
                </div>
                <select
                  className="rounded-md border bg-white px-2 py-1 text-xs shrink-0"
                  value={s.priority || 'medium'}
                  onChange={(e) => setPriority(s, e.target.value)}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
              </div>

              <div className="mt-2">
                <div className="text-[11px] font-semibold uppercase text-neutral-500">Acceptance Criteria</div>
                <ul className="ml-4 list-disc text-sm break-words">
                  {(s.acceptanceCriteria || []).map((a, i) => (
                    <li key={i} className="break-words">{a}</li>
                  ))}
                </ul>
                <ACInput onSubmit={(text) => addAC(s, text)} />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase text-neutral-500">Move:</span>
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
      className="mt-2 flex gap-2"
      onSubmit={(e) => { e.preventDefault(); onSubmit?.(val); setVal(''); }}
    >
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Add acceptance criterion…"
        className="flex-1 rounded-md border px-2 py-1 text-sm"
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
          <Whiteboard projectId={project.projectId} boardId={project.boardId} user={user} />
          <StoriesKanban projectId={project.projectId} user={user} />
          <BadgeStrip user={user} />
          <FooterTips />
        </>
      )}
    </main>
  );
}

function FooterTips() {
  return (
    <div className="mt-6 rounded-2xl border bg-white/70 p-4 text-sm text-neutral-700">
      <div className="font-semibold">Teaching tips</div>
      <ul className="ml-5 list-disc space-y-1">
        <li>Turn a sticky into a story with “Upgrade → Story”.</li>
        <li>Drag stories between Backlog / Now / Next / Later to plan your MVP.</li>
        <li>Add 3+ acceptance criteria to earn <span className="font-medium">🎯 Precision Master</span>.</li>
        <li>Move 3 stories into “Now” to earn <span className="font-medium">🧩 MVP Architect</span>.</li>
        <li>Create 5 stickies to earn <span className="font-medium">🧠 Brainstormer</span>.</li>
      </ul>
    </div>
  );
}
