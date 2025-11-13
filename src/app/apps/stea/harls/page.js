'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase';
import {
  addDoc, arrayUnion, collection, doc, getDoc, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp, setDoc, updateDoc
} from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore';
import { ref as storageRef, uploadString, getDownloadURL, getBlob } from 'firebase/storage';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { useTenant } from '@/contexts/TenantContext';
import SteaAppsDropdown from '@/components/SteaAppsDropdown';

/** ✅ tldraw */
import { Tldraw, getSnapshot as getTlSnapshot, loadSnapshot as loadTlSnapshot } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

setLogLevel('error');

/* =========================
   CONFIG & CONSTANTS
   ========================= */
const LANE_OPTIONS = [null, 'now', 'next', 'later']; // null = backlog
const DEFAULT_PROJECT_NAME = 'Harls Product Lab';
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
async function ensureProjectAndBoard(uid, tenantId) {
  // Multi-tenant project: one shared project per tenant for Harls collaboration
  const projectId = `${tenantId}_harls_lab`;
  const projectRef = doc(db, 'projects', projectId);
  const snap = await getDoc(projectRef);

  if (!snap.exists()) {
    // Create new tenant-scoped project
    await setDoc(projectRef, {
      ownerUid: uid,
      name: `${DEFAULT_PROJECT_NAME}`,
      members: [uid],
      tenantId: tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('[Harls] Created new tenant project:', projectId);
  } else {
    // Add user to existing tenant project if not already a member
    const data = snap.data();
    if (!data?.members?.includes(uid)) {
      await updateDoc(projectRef, {
        members: arrayUnion(uid),
        updatedAt: serverTimestamp(),
      });
      console.log('[Harls] Added user to tenant project:', uid);
    }
  }

  const boardId = 'main';
  const boardRef = doc(db, `projects/${projectId}/whiteboards`, boardId);
  if (!(await getDoc(boardRef)).exists()) {
    await setDoc(boardRef, {
      name: DEFAULT_BOARD_NAME,
      tenantId: tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const userRef = doc(db, 'users', uid);
  if (!(await getDoc(userRef)).exists()) {
    await setDoc(userRef, {
      displayName: auth.currentUser?.displayName || 'User',
      totalXP: 0,
      level: 1,
      badgesEarned: 0,
      createdAt: serverTimestamp(),
    });
  }

  const metricsRef = doc(db, `users/${uid}/metrics`, 'main');
  if (!(await getDoc(metricsRef)).exists()) {
    await setDoc(metricsRef, {
      notesCreated: 0,
      storiesCreated: 0,
      movedToNowCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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
   DISCOVERY FIELDS & EXPORT
   ========================= */
function DiscoverySidebar({ projectId, tenantId, user }) {
  if (!projectId) return null;

  const [discovery, setDiscovery] = useState({
    projectName: '',
    owner: '',
    problem: '',
    audience: [],
    jtbd: [],
    goals: [],
    constraints: [],
    inScope: [],
    outOfScope: [],
    assumptions: [],
    risks: [],
    dependencies: [],
    seedStory: '',
    ac: [],
    flows: [],
  });

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportContent, setExportContent] = useState('');
  const [saving, setSaving] = useState(false);

  const discoveryRef = useMemo(
    () => doc(db, `projects/${projectId}/discovery`, 'main'),
    [projectId]
  );

  // Load discovery data
  useEffect(() => {
    const unsub = onSnapshot(discoveryRef, (snap) => {
      if (snap.exists()) {
        setDiscovery(snap.data());
      }
    });
    return () => unsub();
  }, [discoveryRef]);

  // Auto-save discovery data (debounced)
  const saveDiscovery = useCallback(async (data) => {
    setSaving(true);
    try {
      await setDoc(discoveryRef, {
        ...data,
        tenantId,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || null,
      }, { merge: true });
    } catch (err) {
      console.error('[Discovery save error]', err);
    } finally {
      setSaving(false);
    }
  }, [discoveryRef, tenantId, user]);

  const updateField = (field, value) => {
    const updated = { ...discovery, [field]: value };
    setDiscovery(updated);
    saveDiscovery(updated);
  };

  const addListItem = (field) => {
    const value = prompt(`Add to ${field}:`);
    if (value?.trim()) {
      updateField(field, [...(discovery[field] || []), value.trim()]);
    }
  };

  const removeListItem = (field, index) => {
    updateField(field, discovery[field].filter((_, i) => i !== index));
  };

  const buildMarkdown = () => {
    const pad = (arr) => (arr && arr.length ? arr.map(x => `- ${x}`).join('\n') : '-');
    const today = new Date().toISOString().slice(0,10);

    return [
      `# Project`,
      `Name: ${discovery.projectName || '<Project Name>'}`,
      `Owner: ${discovery.owner || '<Owner>'}`,
      `Date: ${today}`,
      ``,
      `## Problem to Solve`,
      discovery.problem || '<One clear paragraph…>',
      ``,
      `## Audience / Users`,
      pad(discovery.audience),
      ``,
      `## Jobs To Be Done`,
      pad(discovery.jtbd),
      ``,
      `## Goals / Success Metrics`,
      pad(discovery.goals),
      ``,
      `## Scope & Constraints`,
      `- In scope: ${discovery.inScope?.join(', ') || '<…>'}`,
      `- Out of scope: ${discovery.outOfScope?.join(', ') || '<…>'}`,
      `- Constraints: ${discovery.constraints?.join(', ') || '<…>'}`,
      ``,
      `## Assumptions, Risks, Dependencies`,
      `- Assumptions:\n${pad(discovery.assumptions)}`,
      `- Risks/Unknowns:\n${pad(discovery.risks)}`,
      `- Dependencies:\n${pad(discovery.dependencies)}`,
      ``,
      `## Seed Stories / Acceptance Criteria / Flows`,
      `### Example User Story`,
      discovery.seedStory || 'As a <user>, I want <capability>, so that <outcome>.',
      ``,
      `### Acceptance Criteria (seed)`,
      (discovery.ac?.length ? discovery.ac.map((a,i)=>`${i+1}. ${a}`).join('\n') : '1. <Given/When/Then…>'),
      ``,
      `### User Flows (seed)`,
      pad(discovery.flows),
      ``,
      `---`,
      ``,
      `## What I want from the LLM (follow exactly)`,
      `1) Produce a **concise build spec (Markdown)** with these sections in order:`,
      `   - Overview, Architecture (ASCII diagram OK), Data model, API contracts (req/resp),`,
      `     Feature breakdown (Epic → Feature → Story), Non-functionals, Test strategy,`,
      `     Release plan (flags/migrations).`,
      ``,
      `2) Produce a **Backlog JSON** using this schema:`,
      `\`\`\`json`,
      `{`,
      `  "epics": [{ "title": "", "intent": "", "successMetrics": [] }],`,
      `  "features": [{ "epicIndex": 0, "title": "", "scope": "", "dependencies": [] }],`,
      `  "cards": [{`,
      `    "featureIndex": 0,`,
      `    "title": "",`,
      `    "userStory": "",`,
      `    "acceptanceCriteria": ["", ""],`,
      `    "userFlows": ["", ""],`,
      `    "size": "XS|S|M|L|XL",`,
      `    "priority": "Now|Next|Later"`,
      `  }]`,
      `}`,
      `\`\`\``,
      ``,
      `3) Return **only** two payloads, clearly delimited:`,
      `\`\`\``,
      `===build-spec.md===`,
      `# <Title>`,
      `...`,
      `===backlog.json===`,
      `{ ...exact JSON... }`,
      `\`\`\``,
      ``,
      `## Guardrails`,
      `- Stay within MVP + one follow-up release.`,
      `- Do not invent integrations not listed under Dependencies.`,
    ].join('\n');
  };

  const handleGeneratePrompt = () => {
    const markdown = buildMarkdown();
    setExportContent(markdown);
    setExportModalOpen(true);
  };

  const downloadMarkdown = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `harls-prompt-${timestamp}.md`;
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ListField = ({ label, field }) => (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-neutral-700">{label}</label>
        <button
          onClick={() => addListItem(field)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          + Add
        </button>
      </div>
      <ul className="space-y-1">
        {(discovery[field] || []).map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm bg-neutral-50 rounded px-2 py-1">
            <span className="flex-1">{item}</span>
            <button
              onClick={() => removeListItem(field, idx)}
              className="text-red-500 hover:text-red-700 text-xs"
            >
              ×
            </button>
          </li>
        ))}
        {(!discovery[field] || discovery[field].length === 0) && (
          <li className="text-xs text-neutral-400 italic">No items yet</li>
        )}
      </ul>
    </div>
  );

  return (
    <>
      <aside className="w-full rounded-2xl border bg-white/70 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Discovery</h3>
          {saving && <span className="text-xs text-neutral-500">Saving...</span>}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700">Project Name</label>
            <input
              type="text"
              value={discovery.projectName}
              onChange={(e) => updateField('projectName', e.target.value)}
              className="w-full rounded-md border px-2 py-1 text-sm"
              placeholder="My Project"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">Owner</label>
            <input
              type="text"
              value={discovery.owner}
              onChange={(e) => updateField('owner', e.target.value)}
              className="w-full rounded-md border px-2 py-1 text-sm"
              placeholder="Team / Your Name"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">Problem to Solve</label>
            <textarea
              value={discovery.problem}
              onChange={(e) => updateField('problem', e.target.value)}
              className="w-full rounded-md border px-2 py-2 text-sm"
              rows={3}
              placeholder="Describe the problem..."
            />
          </div>

          <ListField label="Audience / Users" field="audience" />
          <ListField label="Jobs To Be Done" field="jtbd" />
          <ListField label="Goals / Success Metrics" field="goals" />
          <ListField label="In Scope" field="inScope" />
          <ListField label="Out of Scope" field="outOfScope" />
          <ListField label="Constraints" field="constraints" />
          <ListField label="Assumptions" field="assumptions" />
          <ListField label="Risks/Unknowns" field="risks" />
          <ListField label="Dependencies" field="dependencies" />

          <div>
            <label className="text-xs font-semibold text-neutral-700">Seed User Story</label>
            <textarea
              value={discovery.seedStory}
              onChange={(e) => updateField('seedStory', e.target.value)}
              className="w-full rounded-md border px-2 py-2 text-sm"
              rows={2}
              placeholder="As a <user>, I want <capability>, so that <outcome>."
            />
          </div>

          <ListField label="Acceptance Criteria (seed)" field="ac" />
          <ListField label="User Flows (seed)" field="flows" />
        </div>

        <button
          onClick={handleGeneratePrompt}
          className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Generate Prompt (Export .md)
        </button>
      </aside>

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-neutral-900">Generated Prompt</h2>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <textarea
              value={exportContent}
              onChange={(e) => setExportContent(e.target.value)}
              className="flex-1 w-full rounded-lg border px-3 py-2 text-sm font-mono overflow-auto"
              placeholder="Generated markdown will appear here..."
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={downloadMarkdown}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Download .md
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportContent);
                  alert('Copied to clipboard!');
                }}
                className="flex-1 px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================
   TLDraw Whiteboard with Firestore persistence
   ========================= */
function TLDrawWhiteboard({ projectId, boardId, user, tenantId }) {
  if (!projectId || !boardId) return null; // guard

  const editorRef = useRef(null);
  const initialSnapshotRef = useRef(null);
  const lastWriteTokenRef = useRef(null);
  const suppressSaveRef = useRef(false);
  const saveTimer = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  const clientIdRef = useRef(null);
  if (!clientIdRef.current) {
    clientIdRef.current =
      typeof window !== 'undefined' && window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Detect orientation changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkOrientation = () => {
      // Check if on mobile (width < 768px) and in portrait orientation
      const isMobile = window.innerWidth < 768;
      const isPortraitMode = window.innerHeight > window.innerWidth;
      setIsPortrait(isMobile && isPortraitMode);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // ✅ Reference the BOARD document (store snapshot as a field)
  const boardDocRef = useMemo(
    () => doc(db, 'projects', projectId, 'whiteboards', boardId),
    [projectId, boardId]
  );

  // Debounce helper - increased delay to reduce write frequency and race conditions
  const debounceSave = (fn, ms = 1500) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(fn, ms);
  };

  const applySnapshot = useCallback((snapshot) => {
    if (!editorRef.current || !snapshot) return;
    suppressSaveRef.current = true;
    try {
      loadTlSnapshot(editorRef.current.store, snapshot);
    } catch (err) {
      console.error('[TLDraw apply snapshot]', err);
    } finally {
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
          suppressSaveRef.current = false;
        });
      } else {
        suppressSaveRef.current = false;
      }
    }
  }, []);

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

  // Load initial snapshot from Cloud Storage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        console.log('[TLDraw] Loading initial snapshot from:', boardDocRef.path);
        const snap = await getDoc(boardDocRef);
        if (cancelled) return;
        const data = snap.exists() ? snap.data() : null;

        // Try to load from Cloud Storage first
        if (data?.tldrawStoragePath) {
          console.log('[TLDraw] Loading from Cloud Storage:', data.tldrawStoragePath);
          try {
            const snapshotRef = storageRef(storage, data.tldrawStoragePath);
            const blob = await getBlob(snapshotRef);
            const text = await blob.text();
            const snapshot = JSON.parse(text);
            initialSnapshotRef.current = snapshot;
            lastWriteTokenRef.current = data?.tldrawWriteToken || null;
            console.log('[TLDraw] Loaded snapshot from Cloud Storage');
          } catch (storageError) {
            console.error('[TLDraw] Error loading from Cloud Storage:', storageError);
            // Fall back to Firestore if storage fails
            initialSnapshotRef.current = data?.tldrawSnapshot || null;
            lastWriteTokenRef.current = data?.tldrawWriteToken || null;
          }
        } else {
          // Legacy: load from Firestore document field
          console.log('[TLDraw] Loading from Firestore (legacy)');
          initialSnapshotRef.current = data?.tldrawSnapshot || null;
          lastWriteTokenRef.current = data?.tldrawWriteToken || null;
        }

        setLoaded(true);
        if (editorRef.current && initialSnapshotRef.current) {
          applySnapshot(initialSnapshotRef.current);
        }
      } catch (e) {
        if (!cancelled) {
          console.error('[TLDraw load boardDocRef]', `projects/${projectId}/whiteboards/${boardId}`, e);
          console.error('[TLDraw load error code]', e.code);
          console.error('[TLDraw load error message]', e.message);
          setLoaded(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [applySnapshot, boardDocRef, boardId, projectId]);

  // Live watcher (pull updates from other tabs)
  useEffect(() => {
    const unsub = onSnapshot(
      boardDocRef,
      async (snap) => {
        if (!editorRef.current || !snap.exists()) return;
        const remote = snap.data();

        // IMPORTANT: Only apply remote updates if they're from a different client
        if (remote?.tldrawWriteToken) {
          const remoteClientId = remote.tldrawWriteToken.split(':')[0];
          const myClientId = clientIdRef.current;

          // Skip if this update came from us
          if (remoteClientId === myClientId) {
            console.log('[TLDraw] Skipping own update');
            return;
          }

          // Skip if we've already seen this exact writeToken
          if (remote.tldrawWriteToken === lastWriteTokenRef.current) {
            return;
          }

          console.log('[TLDraw] Applying remote update from:', remoteClientId);
        }

        try {
          let snapshot = null;

          // Try Cloud Storage first
          if (remote?.tldrawStoragePath) {
            try {
              const snapshotRef = storageRef(storage, remote.tldrawStoragePath);
              const blob = await getBlob(snapshotRef);
              const text = await blob.text();
              snapshot = JSON.parse(text);
              console.log('[TLDraw] Loaded remote update from Cloud Storage');
            } catch (storageError) {
              console.error('[TLDraw] Error loading remote from Cloud Storage:', storageError);
              // Fall back to Firestore
              snapshot = remote.tldrawSnapshot;
            }
          } else if (remote?.tldrawSnapshot) {
            // Legacy: load from Firestore field
            snapshot = remote.tldrawSnapshot;
          }

          if (!snapshot) return;

          // Update tracking refs BEFORE applying to prevent save loop
          lastWriteTokenRef.current = remote?.tldrawWriteToken || null;
          initialSnapshotRef.current = snapshot;
          applySnapshot(snapshot);
        } catch (e) {
          console.error('[TLDraw onSnapshot apply]', e);
        }
      },
      (err) => {
        console.error('[TLDraw onSnapshot error]', `projects/${projectId}/whiteboards/${boardId}`, err);
      }
    );
    return () => unsub();
  }, [applySnapshot, boardDocRef, boardId, projectId]);

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
        tenantId: tenantId,
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
    <div className="relative w-full rounded-2xl border bg-white/70 p-4 shadow-sm">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-lg font-semibold">Whiteboard</h2>
        <span className="text-xs text-neutral-500">Powered by tldraw</span>
      </div>

      <div className="relative h-[calc(100vh-280px)] min-h-[600px] w-full overflow-hidden rounded-xl border bg-neutral-50">
        {/* Portrait mode message */}
        {isPortrait ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-8">
            <div className="text-center max-w-sm">
              <div className="text-6xl mb-4 animate-bounce">📱 → 📲</div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Rotate to Landscape</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                The whiteboard works best in landscape mode. Please rotate your device for the optimal experience.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Floating upgrade button */}
            <UpgradeButton />

            {/* tldraw canvas */}
            {loaded && (
              <Tldraw
            onMount={(editor) => {
              editorRef.current = editor;

              if (initialSnapshotRef.current) {
                applySnapshot(initialSnapshotRef.current);
              } else {
                try {
                  initialSnapshotRef.current = getTlSnapshot(editor.store);
                } catch {}
              }

              setLoaded(true);

              whenStoreReady(editor, () => {
                const unlisten = editor.store.listen(
                  () => {
                    if (suppressSaveRef.current) return;
                    let snapshot;
                    try {
                      snapshot = getTlSnapshot(editor.store);
                    } catch (err) {
                      console.error('[TLDraw snapshot capture]', err);
                      return;
                    }
                    if (!snapshot) return;
                    const writeToken = `${clientIdRef.current}:${Date.now()}`;
                    lastWriteTokenRef.current = writeToken;
                    initialSnapshotRef.current = snapshot;
                    debounceSave(async () => {
                      try {
                        console.log('[TLDraw] Attempting save to Cloud Storage');

                        // Save to Cloud Storage
                        const storagePath = `tldraw/${projectId}/${boardId}/snapshot.json`;
                        const snapshotRef = storageRef(storage, storagePath);
                        const snapshotJson = JSON.stringify(snapshot);

                        await uploadString(snapshotRef, snapshotJson, 'raw', {
                          contentType: 'application/json',
                        });

                        console.log('[TLDraw] Uploaded to Cloud Storage:', storagePath);

                        // Update Firestore with storage reference (not the snapshot itself)
                        await setDoc(
                          boardDocRef,
                          {
                            tldrawStoragePath: storagePath,
                            tldrawUpdatedAt: serverTimestamp(),
                            tldrawUpdatedBy: user?.uid || null,
                            tldrawWriteToken: writeToken,
                          },
                          { merge: true }
                        );
                        console.log('[TLDraw] Save successful');
                      } catch (err) {
                        console.error('[TLDraw persist error]', err);
                        console.error('[TLDraw persist error code]', err.code);
                        console.error('[TLDraw persist error message]', err.message);
                      }
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
          </>
        )}
      </div>
    </div>
  );
}

/* =========================
   STORIES KANBAN
   ========================= */
function StoriesKanban({ projectId, user, tenantId }) {
  const [stories, setStories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    const qAll = query(
      collection(db, `projects/${projectId}/stories`),
      orderBy('updatedAt', 'desc')
    );
    const unsub = onSnapshot(qAll, (snap) => {
      const arr = [];
      snap.forEach((d) => {
        const data = d.data();
        // Filter by tenantId (support legacy docs without tenantId)
        if (!data.tenantId || data.tenantId === tenantId) {
          arr.push({ id: d.id, ...data });
        }
      });
      setStories(arr);
    }, (e) => {
      console.error('[StoriesKanban onSnapshot]', `projects/${projectId}/stories`, e);
    });
    return () => unsub();
  }, [projectId, tenantId]);

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
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const { currentTenant, availableTenants, loading: tenantLoading } = useTenant();
  const [project, setProject] = useState(null);
  const [diagOpen, setDiagOpen] = useState(false); // flip to true to debug quickly

  // Authorization check: require tenant membership
  useEffect(() => {
    if (!tenantLoading && user && availableTenants.length === 0) {
      router.replace('/apps/stea?error=no_workspace');
    }
  }, [user, availableTenants, tenantLoading, router]);

  useEffect(() => {
    (async () => {
      if (!user || !currentTenant?.id) return setProject(null);
      try {
        console.log('[Harls] Creating/loading project for user:', user.uid, 'tenant:', currentTenant.id);
        const ids = await ensureProjectAndBoard(user.uid, currentTenant.id);
        console.log('[Harls] Project setup complete:', ids);
        setProject(ids);
      } catch (err) {
        console.error('[Harls] Project setup failed:', err);
      }
    })();
  }, [user, currentTenant]);

  // Show loading while checking tenant access
  if (tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  // Don't render if no tenant access
  if (user && availableTenants.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <main className="mx-auto p-4">
      <header className="mb-4 flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold">Harls Product Lab</h1>
          <p className="text-sm text-neutral-600">
            Discovery → Whiteboard → Export Prompt → Stories → Now/Next/Later
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-neutral-600">Hi, {user.displayName || 'there'} 👋</span>
              <SteaAppsDropdown />
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
          <div className="flex flex-col gap-4">
            <TLDrawWhiteboard projectId={project.projectId} boardId={project.boardId} user={user} tenantId={currentTenant.id} />
            <DiscoverySidebar projectId={project.projectId} tenantId={currentTenant.id} user={user} />
          </div>

          <StoriesKanban projectId={project.projectId} user={user} tenantId={currentTenant.id} />
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
      <div className="font-semibold">How to use Harls</div>
      <ul className="ml-5 list-disc space-y-1">
        <li>Fill out <span className="font-medium">Discovery fields</span> (problem, JTBD, goals, constraints, etc.).</li>
        <li>Click <span className="font-medium">Generate Prompt</span> to export a structured .md file for any LLM.</li>
        <li>Use the whiteboard to sketch ideas, then <span className="font-medium">Upgrade → Story</span>.</li>
        <li>Drag stories between Backlog / Now / Next / Later to plan your MVP.</li>
        <li>Add 3+ acceptance criteria to earn <span className="font-medium">🎯 Precision Master</span>.</li>
        <li>Move 3 stories into "Now" to earn <span className="font-medium">🧩 MVP Architect</span>.</li>
      </ul>
    </div>
  );
}
