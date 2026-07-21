'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
  repinfaustAuth,
  repinfaustDb,
  repinfaustFirebaseInitError,
  repinfaustFunctions,
  repinfaustGoogleProvider,
  repinfaustMissingEnv,
} from '@/lib/repinfaustFirebase';
import styles from './repinfaust.module.css';

const OWNER_EMAIL = 'repinfaust@gmail.com';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const LOCAL_ACTIVE_SESSION = 'repinfaust.activeSession.cache.web';

const MODE_META = {
  cold: {
    label: 'COLD MAPPING',
    sub: 'calm - build the chain',
    className: styles.modeCold,
  },
  prepost: {
    label: 'PRE / POST',
    sub: 'bracket the session',
    className: styles.modePrepost,
  },
  aftermath: {
    label: 'AFTERMATH',
    sub: 'non-punitive - look forward',
    className: styles.modeAftermath,
  },
  danger: {
    label: 'DANGER ZONE',
    sub: 'minimal reflection - get a human',
    className: styles.modeDanger,
  },
};

const MODEL_OPTIONS = [
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8' },
  { id: 'claude-fable-5', label: 'Fable 5', embargoed: true },
];

const MODEL_NAMES = {
  'claude-sonnet-4-6': 'Sonnet 4.6',
  'claude-opus-4-8': 'Claude Opus 4.8',
  'claude-fable-5': 'Fable 5',
};

const CHAIN_TYPES = [
  ['state', 'State'],
  ['thought', 'Thought'],
  ['enabling_action', 'Enabling action'],
  ['point_of_no_return', 'Point of no return'],
];

const FRICTION_KINDS = [
  ['number', 'Number'],
  ['thread', 'Thread'],
  ['cash', 'Cash'],
  ['privacy', 'Privacy'],
  ['other', 'Other'],
];

const LITMUS = [
  ['honesty', 'Honesty'],
  ['accountability', 'Accountability'],
  ['connection', 'Connection'],
  ['change', 'Behavioural change'],
];

const LOG_KINDS = [
  ['na', 'NA meeting'],
  ['gp', 'GP service'],
  ['other', 'Other'],
];

const SCREENS = [
  ['chat', 'Page'],
  ['chain', 'Chain'],
  ['friction', 'Routes'],
  ['disclosure', 'Disclosure'],
  ['nalog', 'Litmus'],
  ['compare', 'A / B'],
  ['settings', 'Settings'],
];

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function requireClient() {
  if (!repinfaustDb || !repinfaustFunctions) {
    throw new Error('Repinfaust Firebase is not configured for this environment.');
  }
  return { db: repinfaustDb, functions: repinfaustFunctions };
}

function newSessionId() {
  return `s_${Date.now().toString(36)}`;
}

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
}

function formatDate(value, withTime = false) {
  const millis = timestampMillis(value);
  if (!millis) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(millis));
}

function romanNumeral(value) {
  const map = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let out = '';
  let remaining = value;
  for (const [number, glyph] of map) {
    while (remaining >= number) {
      out += glyph;
      remaining -= number;
    }
  }
  return out || 'I';
}

function noop() {
  return undefined;
}

async function loadOrInitState() {
  const { db } = requireClient();
  const ref = doc(db, 'profile/state');
  try {
    const snap = await getDoc(ref);
    const data = snap.data() || {};
    let activeSessionId = data.activeSessionId || null;
    const model = data.model || DEFAULT_MODEL;

    if (!activeSessionId) {
      activeSessionId =
        window.localStorage.getItem(LOCAL_ACTIVE_SESSION) || newSessionId();
      await setDoc(
        ref,
        { activeSessionId, model, updatedAt: serverTimestamp() },
        { merge: true },
      );
    }

    window.localStorage.setItem(LOCAL_ACTIVE_SESSION, activeSessionId);
    return { activeSessionId, model };
  } catch {
    const cached = window.localStorage.getItem(LOCAL_ACTIVE_SESSION);
    const activeSessionId = cached || newSessionId();
    if (!cached) window.localStorage.setItem(LOCAL_ACTIVE_SESSION, activeSessionId);
    return { activeSessionId, model: DEFAULT_MODEL };
  }
}

async function setActiveSession(sessionId) {
  const { db } = requireClient();
  window.localStorage.setItem(LOCAL_ACTIVE_SESSION, sessionId);
  await setDoc(
    doc(db, 'profile/state'),
    { activeSessionId: sessionId, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

async function setModelPreference(model) {
  const { db } = requireClient();
  await setDoc(
    doc(db, 'profile/state'),
    { model, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

function watchModelPreference(callback, onError) {
  if (!repinfaustDb) return noop;
  return onSnapshot(
    doc(repinfaustDb, 'profile/state'),
    (snap) => callback(snap.data()?.model || DEFAULT_MODEL),
    onError,
  );
}

function watchMessages(sessionId, callback, onError) {
  if (!repinfaustDb || !sessionId) return noop;
  return onSnapshot(
    collection(repinfaustDb, `sessions/${sessionId}/messages`),
    (snap) => {
      const rows = snap.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          role: data.role,
          text: data.text || '',
          classification: data.classification,
          at: data.at,
          seq: data.seq || 0,
        };
      });
      rows.sort((a, b) => {
        const at = timestampMillis(a.at) - timestampMillis(b.at);
        return at !== 0 ? at : a.seq - b.seq;
      });
      callback(rows.filter((row) => row.role === 'user' || row.role === 'assistant'));
    },
    onError,
  );
}

async function sendChat(sessionId, message, model) {
  const { functions } = requireClient();
  const fn = httpsCallable(functions, 'chat');
  const response = await fn({ sessionId, message, model });
  return response.data;
}

async function endSession(sessionId) {
  const { functions } = requireClient();
  const fn = httpsCallable(functions, 'distillNow');
  await fn({ sessionId });
}

function watchContacts(callback, onError) {
  if (!repinfaustDb) return noop;
  const q = query(collection(repinfaustDb, 'contacts'), orderBy('priority'));
  return onSnapshot(
    q,
    (snap) =>
      callback(
        snap.docs.map((item) => ({
          id: item.id,
          name: item.data().name || '',
          relationship: item.data().relationship || '',
          phone: item.data().phone || '',
          priority: item.data().priority || 0,
        })),
      ),
    onError,
  );
}

async function addContact(contact) {
  const { db } = requireClient();
  await addDoc(collection(db, 'contacts'), {
    ...contact,
    createdAt: serverTimestamp(),
  });
}

function watchGrounding(callback, onError) {
  if (!repinfaustDb) return noop;
  return onSnapshot(
    doc(repinfaustDb, 'profile/grounding'),
    (snap) => callback(snap.data()?.text || ''),
    onError,
  );
}

async function saveGrounding(text) {
  const { db } = requireClient();
  await setDoc(
    doc(db, 'profile/grounding'),
    { text, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

function watchChain(callback, onError) {
  if (!repinfaustDb) return noop;
  return onSnapshot(
    collection(repinfaustDb, 'chainLinks'),
    (snap) => {
      const links = snap.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          label: data.label || '',
          type: data.type || 'state',
          note: data.note || '',
          order: data.order,
        };
      });
      links.sort((a, b) => {
        const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.label.localeCompare(b.label);
      });
      callback(links);
    },
    onError,
  );
}

async function addChainLink(link) {
  const { db } = requireClient();
  await addDoc(collection(db, 'chainLinks'), {
    ...link,
    source: 'manual',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function updateChainLink(id, patch) {
  const { db } = requireClient();
  await updateDoc(doc(db, 'chainLinks', id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

async function deleteChainLink(id) {
  const { db } = requireClient();
  await deleteDoc(doc(db, 'chainLinks', id));
}

function watchFriction(callback, onError) {
  if (!repinfaustDb) return noop;
  const q = query(collection(repinfaustDb, 'friction'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) =>
      callback(
        snap.docs.map((item) => ({
          id: item.id,
          label: item.data().label || '',
          kind: item.data().kind || 'other',
          state: item.data().state || 'open',
        })),
      ),
    onError,
  );
}

async function addFriction(label, kind) {
  const { db } = requireClient();
  await addDoc(collection(db, 'friction'), {
    label,
    kind,
    state: 'open',
    createdAt: serverTimestamp(),
  });
}

async function setFrictionState(id, state) {
  const { db } = requireClient();
  await updateDoc(doc(db, 'friction', id), { state, updatedAt: serverTimestamp() });
}

async function deleteFriction(id) {
  const { db } = requireClient();
  await deleteDoc(doc(db, 'friction', id));
}

async function logEval(params) {
  const { db } = requireClient();
  await addDoc(collection(db, 'evals'), { ...params, at: serverTimestamp() });
}

async function logCorrection(params) {
  const { db } = requireClient();
  await addDoc(collection(db, 'corrections'), {
    ...params,
    processed: false,
    at: serverTimestamp(),
  });
}

function watchNaLog(callback, onError) {
  if (!repinfaustDb) return noop;
  const q = query(collection(repinfaustDb, 'naLog'), orderBy('at', 'desc'));
  return onSnapshot(
    q,
    (snap) =>
      callback(
        snap.docs.map((item) => ({
          id: item.id,
          kind: item.data().kind || 'na',
          honesty: !!item.data().honesty,
          accountability: !!item.data().accountability,
          connection: !!item.data().connection,
          change: !!item.data().change,
          note: item.data().note || '',
          at: item.data().at,
        })),
      ),
    onError,
  );
}

async function addNaLog(entry) {
  const { db } = requireClient();
  await addDoc(collection(db, 'naLog'), { ...entry, at: serverTimestamp() });
}

async function deleteNaLog(id) {
  const { db } = requireClient();
  await deleteDoc(doc(db, 'naLog', id));
}

async function draftDisclosure(recipient, situation, model) {
  const { functions } = requireClient();
  const fn = httpsCallable(functions, 'draftDisclosure');
  const response = await fn({ recipient, situation, model });
  return response.data?.draft || '';
}

async function compareModels(message) {
  const { functions } = requireClient();
  const fn = httpsCallable(functions, 'compareModels');
  const response = await fn({ message });
  return response.data;
}

async function recordComparison(comparisonId, pick) {
  const { functions } = requireClient();
  const fn = httpsCallable(functions, 'recordComparison');
  const response = await fn({ comparisonId, pick });
  return response.data;
}

function watchComparisonTally(callback, onError) {
  if (!repinfaustDb) return noop;
  return onSnapshot(
    collection(repinfaustDb, 'comparisons'),
    (snap) => {
      const tally = { total: 0, byModel: {}, ties: 0 };
      snap.docs.forEach((item) => {
        const winner = item.data().winner;
        if (!winner) return;
        tally.total += 1;
        if (winner === 'tie') tally.ties += 1;
        else tally.byModel[winner] = (tally.byModel[winner] || 0) + 1;
      });
      callback(tally);
    },
    onError,
  );
}

async function exportAll() {
  const { functions } = requireClient();
  const fn = httpsCallable(functions, 'exportAll');
  const response = await fn();
  return response.data;
}

async function deleteAll() {
  const { functions } = requireClient();
  const fn = httpsCallable(functions, 'deleteAll');
  const response = await fn({ confirm: 'DELETE EVERYTHING' });
  return response.data?.deleted || 0;
}

function watchChapters(activeSessionId, callback, onError) {
  if (!repinfaustDb) return noop;
  return onSnapshot(
    collection(repinfaustDb, 'sessions'),
    (snap) => {
      const rows = snap.docs
        .filter((item) => item.id !== activeSessionId)
        .map((item) => ({
          id: item.id,
          startedAt: item.data().startedAt || null,
          lastActiveAt: item.data().lastActiveAt || null,
          mode: item.data().mode || 'cold',
          distilled: !!item.data().distilled,
          flag: item.data().flag || '',
          model: item.data().model || '',
        }));
      rows.sort((a, b) => timestampMillis(b.lastActiveAt) - timestampMillis(a.lastActiveAt));
      callback(rows);
    },
    onError,
  );
}

async function chapterOpeningLine(sessionId) {
  const { db } = requireClient();
  const q = query(collection(db, `sessions/${sessionId}/messages`), orderBy('at', 'asc'));
  const snap = await getDocs(q);
  const firstUser = snap.docs.find((item) => item.data().role === 'user');
  return firstUser?.data()?.text || '(empty chapter)';
}

function StarMark({ className = styles.starMark }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 4 38 26 60 32 38 38 32 60 26 38 4 32 26 26 32 4Z" fill="currentColor" opacity="0.95" />
      <path d="M32 14 35 29 50 32 35 35 32 50 29 35 14 32 29 29 32 14Z" fill="var(--rf-black)" />
      <path d="M12 12 27 27M52 12 37 27M52 52 37 37M12 52 27 37" stroke="currentColor" strokeWidth="3" strokeLinecap="square" opacity="0.75" />
    </svg>
  );
}

function ConfigScreen() {
  return (
    <section className={styles.configPanel}>
      <BookLockup />
      <h1>Repinfaust config required</h1>
      <p>The web mirror needs the Repinfaust Firebase client config before it can sign in.</p>
      <ul>
        {repinfaustMissingEnv.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      {repinfaustFirebaseInitError ? (
        <p className={styles.errorText}>{repinfaustFirebaseInitError.message}</p>
      ) : null}
    </section>
  );
}

function BookLockup() {
  return (
    <div className={styles.lockup}>
      <StarMark />
      <span>ARCTURUS CLASSICS</span>
    </div>
  );
}

function LoadingPage({ label = 'Opening the page' }) {
  return (
    <section className={styles.loadingPanel}>
      <BookLockup />
      <p>{label}...</p>
    </section>
  );
}

function SignInCover({ error, signingIn, onSignIn }) {
  return (
    <section className={styles.cover}>
      <div className={styles.coverTop}>
        <BookLockup />
      </div>
      <div className={styles.coverPanel}>
        <p className={styles.coverAuthor}>AN INTERRUPTION AID</p>
        <div className={styles.coverRule} />
        <h1>REPINFAUST</h1>
        <p className={styles.coverBlurb}>
          One job: interrupt the chain between the thought and the act, and keep you connected to the real people and real help in your life.
        </p>
      </div>
      <div className={styles.coverBottom}>
        <button className={styles.primaryButton} type="button" onClick={onSignIn} disabled={signingIn || !repinfaustGoogleProvider}>
          {signingIn ? 'Opening Google...' : 'Continue with Google'}
        </button>
        {error ? <p className={styles.coverError}>{error}</p> : null}
      </div>
    </section>
  );
}

function BookHeader({ mode, userEmail }) {
  const meta = MODE_META[mode] || MODE_META.cold;
  return (
    <header className={styles.bookHeader}>
      <div className={styles.blackBand}>
        <BookLockup />
        <span className={styles.signedIn}>{userEmail}</span>
      </div>
      <div className={`${styles.modePanel} ${meta.className}`}>
        <div className={styles.modeRule} />
        <h1>{meta.label}</h1>
        <p>{meta.sub}</p>
        <div className={styles.modeRule} />
      </div>
    </header>
  );
}

function AppNav({ view, onView, onArchive, archiveDisabled }) {
  return (
    <nav className={styles.navBar} aria-label="Repinfaust sections">
      <div className={styles.navScroll}>
        {SCREENS.map(([id, label]) => (
          <button
            key={id}
            className={`${styles.navButton} ${view === id ? styles.navButtonActive : ''}`}
            type="button"
            onClick={() => onView(id)}
            aria-current={view === id ? 'page' : undefined}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        className={styles.archiveButton}
        type="button"
        onClick={onArchive}
        disabled={archiveDisabled}
      >
        Archive
      </button>
    </nav>
  );
}

export default function RepinfaustClient() {
  const [mounted, setMounted] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [view, setView] = useState('chat');
  const [mode, setMode] = useState('cold');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [archiveDisabled, setArchiveDisabled] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [notice, setNotice] = useState('');

  const firebaseReady = repinfaustMissingEnv.length === 0 && repinfaustAuth && repinfaustDb && repinfaustFunctions;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!repinfaustAuth) {
      setAuthReady(true);
      return undefined;
    }

    return onAuthStateChanged(repinfaustAuth, async (firebaseUser) => {
      setAuthReady(true);

      if (!firebaseUser) {
        setUser(null);
        setSessionId(null);
        return;
      }

      const email = normalizeEmail(firebaseUser.email);
      if (email !== OWNER_EMAIL || firebaseUser.emailVerified !== true) {
        setGlobalError(`Repinfaust is restricted to ${OWNER_EMAIL}.`);
        setUser(null);
        setSessionId(null);
        await firebaseSignOut(repinfaustAuth).catch(() => undefined);
        return;
      }

      setUser(firebaseUser);
      setGlobalError('');
      try {
        const state = await loadOrInitState();
        setSessionId(state.activeSessionId);
        setModel(state.model || DEFAULT_MODEL);
      } catch (error) {
        setGlobalError(error?.message || 'Could not load the current chapter.');
        setSessionId(newSessionId());
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    return watchModelPreference(setModel, (error) => {
      setGlobalError(error?.message || 'Could not read model preference.');
    });
  }, [user]);

  const handleSignIn = async () => {
    if (!repinfaustAuth || !repinfaustGoogleProvider) return;
    setSigningIn(true);
    setGlobalError('');
    try {
      await signInWithPopup(repinfaustAuth, repinfaustGoogleProvider);
    } catch (error) {
      setGlobalError(error?.message || 'Google sign-in failed.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (!repinfaustAuth) return;
    await firebaseSignOut(repinfaustAuth);
    setView('chat');
    setMode('cold');
  };

  const archiveChapter = useCallback(async () => {
    if (!sessionId) return;
    const ok = window.confirm('Archive this chapter and start a fresh page?');
    if (!ok) return;

    const oldSession = sessionId;
    const fresh = newSessionId();
    setSessionId(fresh);
    setMode('cold');
    setView('chat');
    setNotice('Fresh page opened.');
    await setActiveSession(fresh).catch((error) => {
      setGlobalError(error?.message || 'Could not persist the fresh chapter.');
    });
    endSession(oldSession).catch((error) => {
      setGlobalError(error?.message || 'The chapter was archived but distillation failed.');
    });
  }, [sessionId]);

  const screen = useMemo(() => {
    if (!sessionId) return null;
    if (view === 'chain') return <ChainMapScreen onError={setGlobalError} />;
    if (view === 'friction') return <FrictionScreen onError={setGlobalError} />;
    if (view === 'disclosure') return <DisclosureScreen model={model} onError={setGlobalError} />;
    if (view === 'nalog') return <NaLogScreen onError={setGlobalError} />;
    if (view === 'compare') return <CompareScreen onError={setGlobalError} />;
    if (view === 'settings') {
      return (
        <SettingsScreen
          model={model}
          onModel={setModel}
          onOpenChapters={() => setView('chapters')}
          onSignOut={handleSignOut}
          onError={setGlobalError}
          onNotice={setNotice}
        />
      );
    }
    if (view === 'chapters') {
      return <ChaptersScreen activeSessionId={sessionId} onBack={() => setView('settings')} onError={setGlobalError} />;
    }
    return (
      <ChatScreen
        sessionId={sessionId}
        model={model}
        onMode={setMode}
        onArchiveState={setArchiveDisabled}
        onError={setGlobalError}
      />
    );
  }, [sessionId, view, model, handleSignOut]);

  if (!mounted) return <LoadingPage />;
  if (!firebaseReady) return <ConfigScreen />;
  if (!authReady) return <LoadingPage />;
  if (!user) return <SignInCover error={globalError} signingIn={signingIn} onSignIn={handleSignIn} />;
  if (!sessionId) return <LoadingPage label="Finding the current chapter" />;

  return (
    <div className={styles.appShell}>
      <BookHeader mode={mode} userEmail={user.email || OWNER_EMAIL} />
      <AppNav view={view} onView={setView} onArchive={archiveChapter} archiveDisabled={archiveDisabled} />
      {globalError ? (
        <div className={styles.banner} role="alert">
          {globalError}
        </div>
      ) : null}
      {notice ? (
        <div className={styles.notice} role="status">
          {notice}
          <button type="button" onClick={() => setNotice('')}>Dismiss</button>
        </div>
      ) : null}
      <section className={styles.bookPage}>{screen}</section>
    </div>
  );
}

function ChatScreen({ sessionId, model, onMode, onArchiveState, onError }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [danger, setDanger] = useState(null);
  const sendingRef = useRef(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    return watchMessages(
      sessionId,
      (nextMessages) => {
        setMessages(nextMessages);
        onArchiveState(nextMessages.length < 2);
      },
      (error) => onError(error?.message || 'Could not read messages.'),
    );
  }, [sessionId, onArchiveState, onError]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, sending]);

  // Dev-only screen preview for the D-022 review gate: ?rf_preview=acute|danger
  // renders the takeover without a broker call. Inert in production builds.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const preview = new URLSearchParams(window.location.search).get('rf_preview');
    if (preview === 'acute' || preview === 'danger') {
      setDanger({ reply: "(dev preview - the aid's reply renders here)", acuteRisk: preview === 'acute' });
    }
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || sendingRef.current) return;

    sendingRef.current = true;
    setInput('');
    setSending(true);
    try {
      const result = await sendChat(sessionId, text, model);
      onMode(result.classification?.mode_guess || 'cold');
      if (result.classification?.danger_zone || result.classification?.acute_risk) {
        setDanger({ reply: result.reply || '', acuteRisk: !!result.classification?.acute_risk });
      }
    } catch (error) {
      onError(error?.message || 'Could not reach the broker.');
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  };

  return (
    <div className={styles.chatLayout}>
      <div className={styles.dialogueStack}>
        {messages.length === 0 ? (
          <p className={styles.openingLine}>
            The page is open. Start where you are - what has reached you, and what are you making with it?
          </p>
        ) : (
          messages.map((message, index) => {
            const previous = index > 0 ? messages[index - 1] : null;
            const uncertain =
              message.role === 'assistant' && !!previous?.classification?.ambiguity_uncertain;
            return (
              <Dialogue
                key={message.id}
                message={message}
                uncertain={uncertain}
                previousText={previous?.text || message.text}
                sessionId={sessionId}
                onError={onError}
              />
            );
          })
        )}
        {sending ? <p className={styles.thinking}>The aid is writing...</p> : null}
        <div ref={bottomRef} />
      </div>
      <form className={styles.composer} onSubmit={submit}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Write to the page..."
          rows={3}
        />
        <button type="submit" disabled={sending || !input.trim()}>
          {sending ? 'Sending' : 'Set'}
        </button>
      </form>
      {danger ? <DangerTakeover reply={danger.reply} acuteRisk={danger.acuteRisk} onDismiss={() => setDanger(null)} onError={onError} /> : null}
    </div>
  );
}

function Dialogue({ message, uncertain, previousText, sessionId, onError }) {
  const isAssistant = message.role === 'assistant';
  const paragraphs = String(message.text || '').split(/\n{2,}/).filter(Boolean);

  return (
    <article className={`${styles.dialogue} ${isAssistant ? styles.dialogueAssistant : styles.dialogueUser}`}>
      <div className={styles.dialogueLabel}>{isAssistant ? 'THE AID' : 'DAVID'}</div>
      {uncertain ? <p className={styles.uncertain}>Tone check logged on the previous line.</p> : null}
      {paragraphs.map((paragraph, index) => (
        <p key={`${message.id}-${index}`}>{paragraph}</p>
      ))}
      {isAssistant ? (
        <div className={styles.dialogueActions}>
          <button
            type="button"
            onClick={() =>
              logEval({ sessionId, messageId: message.id, pushedToAction: 2 }).catch((error) =>
                onError(error?.message || 'Could not log rating.'),
              )
            }
          >
            Idea
          </button>
          <button
            type="button"
            onClick={() =>
              logEval({ sessionId, messageId: message.id, pushedToAction: 4 }).catch((error) =>
                onError(error?.message || 'Could not log rating.'),
              )
            }
          >
            Action
          </button>
          <button
            type="button"
            onClick={() =>
              logCorrection({
                sessionId,
                messageId: message.id,
                kind: 'was_sarcasm',
                messageText: previousText,
              }).catch((error) => onError(error?.message || 'Could not log correction.'))
            }
          >
            Dry
          </button>
          <button
            type="button"
            onClick={() =>
              logCorrection({
                sessionId,
                messageId: message.id,
                kind: 'was_serious',
                messageText: previousText,
              }).catch((error) => onError(error?.message || 'Could not log correction.'))
            }
          >
            Serious
          </button>
        </div>
      ) : null}
    </article>
  );
}

// D-022 crisis floor (OQ-6). Static — no model in the path. Phone/text channels
// only: Samaritans' UK email service closes during 2026, so no email addresses.
const CRISIS_LINES = [
  { name: 'Samaritans', meta: '116 123 - free from any phone, 24/7', url: 'tel:116123' },
  { name: 'SHOUT', meta: 'text SHOUT to 85258 - 24/7, for when a call is too much', url: 'sms:85258?body=SHOUT' },
  { name: 'FRANK', meta: '0300 123 6600 - drugs, 24 hours', url: 'tel:03001236600' },
  { name: 'UK Narcotics Anonymous', meta: '0300 999 1212', url: 'tel:03009991212' },
  { name: '999', meta: 'immediate danger', url: 'tel:999' },
  { name: 'NHS 111', meta: 'mental health option', url: 'tel:111' },
];

function DangerTakeover({ reply, acuteRisk, onDismiss, onError }) {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    return watchContacts(setContacts, (error) => onError(error?.message || 'Could not read contacts.'));
  }, [onError]);

  return (
    <div className={styles.dangerOverlay} role="dialog" aria-modal="true" aria-labelledby="danger-title">
      <div className={styles.dangerInner}>
        <p className={styles.dangerKicker}>DANGER ZONE</p>
        <h2 id="danger-title">Get a human on the line.</h2>
        <p>Not me. A person. Tap a name - the call is the point, not this screen.</p>
        {acuteRisk ? (
          <>
            <p className={styles.sectionLabel}>CRISIS LINES · 24/7 · NO NAME NEEDED</p>
            <div className={styles.callList}>
              {CRISIS_LINES.map((line) => (
                <a key={line.name} href={line.url} className={styles.callButton}>
                  <strong>{line.name}</strong>
                  <span>{line.meta}</span>
                </a>
              ))}
            </div>
            <p className={styles.sectionLabel}>YOUR PEOPLE</p>
          </>
        ) : null}
        <div className={styles.callList}>
          {contacts.length === 0 ? (
            <p>No contacts saved. Add your people in Settings before you need them.</p>
          ) : (
            contacts.map((contact) => (
              <a
                key={contact.id}
                href={contact.phone ? `tel:${String(contact.phone).replace(/\s+/g, '')}` : undefined}
                className={styles.callButton}
                aria-disabled={!contact.phone}
              >
                <strong>{contact.name}</strong>
                <span>{contact.relationship || 'contact'}{contact.phone ? ' - call now' : ' - no number saved'}</span>
              </a>
            ))
          )}
        </div>
        <div className={styles.frictionPrompt}>
          <h3>If you cannot reach anyone - move.</h3>
          <ul>
            <li>Leave the house. Now. Do not decide where first.</li>
            <li>Run kit is by the door. Put it on.</li>
            <li>Route-removal: delete the numbers, archive the threads.</li>
            <li>Cash out of the wallet, out of reach.</li>
          </ul>
        </div>
        {reply ? (
          <div className={styles.dangerReply}>
            <p className={styles.dialogueLabel}>THE AID</p>
            <p>{reply}</p>
          </div>
        ) : null}
        <button className={styles.dangerDismiss} type="button" onClick={onDismiss}>
          I am steady - back to the page
        </button>
      </div>
    </div>
  );
}

function ChainMapScreen({ onError }) {
  const [links, setLinks] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({ label: '', note: '', type: 'state' });

  useEffect(() => {
    return watchChain(setLinks, (error) => onError(error?.message || 'Could not read the chain map.'));
  }, [onError]);

  const add = async (event) => {
    event.preventDefault();
    if (!form.label.trim()) return;
    try {
      await addChainLink({
        label: form.label.trim(),
        note: form.note.trim() || undefined,
        type: form.type,
        order: links.length,
      });
      setForm({ label: '', note: '', type: 'state' });
    } catch (error) {
      onError(error?.message || 'Could not add chain link.');
    }
  };

  return (
    <div className={styles.sectionLayout}>
      <SectionTitle title="The relapse chain" copy="The micro-steps from trigger state to use. Tap a link to edit it." />
      <div className={styles.chainList}>
        {links.length === 0 ? (
          <EmptyLine text="The chain is empty." />
        ) : (
          links.map((link, index) => (
            <div key={link.id} className={styles.chainRow}>
              <div className={styles.chainGutter}>
                <span />
                {index < links.length - 1 ? <i /> : null}
              </div>
              {editingId === link.id ? (
                <ChainEditor link={link} onClose={() => setEditingId('')} onError={onError} />
              ) : (
                <button className={styles.chainBody} type="button" onClick={() => setEditingId(link.id)}>
                  <span>{labelFor(CHAIN_TYPES, link.type)}</span>
                  <strong>{link.label}</strong>
                  {link.note ? <em>{link.note}</em> : null}
                </button>
              )}
            </div>
          ))
        )}
      </div>
      <form className={styles.formBlock} onSubmit={add}>
        <h3>Add a link</h3>
        <Segmented options={CHAIN_TYPES} value={form.type} onChange={(type) => setForm((prev) => ({ ...prev, type }))} />
        <input value={form.label} onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))} placeholder="Label" />
        <textarea value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="Note" rows={3} />
        <button className={styles.primaryButton} type="submit">Add link</button>
      </form>
    </div>
  );
}

function ChainEditor({ link, onClose, onError }) {
  const [draft, setDraft] = useState({
    label: link.label,
    note: link.note || '',
    type: link.type,
  });

  const save = async () => {
    try {
      await updateChainLink(link.id, {
        label: draft.label.trim() || link.label,
        note: draft.note.trim(),
        type: draft.type,
      });
      onClose();
    } catch (error) {
      onError(error?.message || 'Could not save chain link.');
    }
  };

  const remove = async () => {
    try {
      await deleteChainLink(link.id);
      onClose();
    } catch (error) {
      onError(error?.message || 'Could not delete chain link.');
    }
  };

  return (
    <div className={styles.inlineEditor}>
      <Segmented options={CHAIN_TYPES} value={draft.type} onChange={(type) => setDraft((prev) => ({ ...prev, type }))} />
      <input value={draft.label} onChange={(event) => setDraft((prev) => ({ ...prev, label: event.target.value }))} />
      <textarea value={draft.note} onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))} rows={3} />
      <div className={styles.editorActions}>
        <button type="button" onClick={remove}>Delete</button>
        <span />
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="button" onClick={save}>Save</button>
      </div>
    </div>
  );
}

function FrictionScreen({ onError }) {
  const [items, setItems] = useState([]);
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState('number');

  useEffect(() => {
    return watchFriction(setItems, (error) => onError(error?.message || 'Could not read routes.'));
  }, [onError]);

  const open = items.filter((item) => item.state === 'open');
  const removed = items.filter((item) => item.state === 'removed');

  const add = async (event) => {
    event.preventDefault();
    if (!label.trim()) return;
    try {
      await addFriction(label.trim(), kind);
      setLabel('');
    } catch (error) {
      onError(error?.message || 'Could not add route.');
    }
  };

  return (
    <div className={styles.sectionLayout}>
      <SectionTitle title="Routes removed" copy="The ways back in. Open means still a route; removed means blocked." />
      <RouteGroup title={`Open - ${open.length}`} items={open} removed={false} onError={onError} />
      {removed.length > 0 ? <RouteGroup title={`Removed - ${removed.length}`} items={removed} removed onError={onError} /> : null}
      <form className={styles.formBlock} onSubmit={add}>
        <h3>Add a route</h3>
        <Segmented options={FRICTION_KINDS} value={kind} onChange={setKind} />
        <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Number, thread, cash route, privacy window" />
        <button className={styles.primaryButton} type="submit">Add route</button>
      </form>
    </div>
  );
}

function RouteGroup({ title, items, removed, onError }) {
  return (
    <section className={styles.routeGroup}>
      <h3>{title}</h3>
      {items.length === 0 ? (
        <EmptyLine text="None listed." />
      ) : (
        items.map((item) => (
          <div key={item.id} className={`${styles.routeRow} ${removed ? styles.routeRowDone : ''}`}>
            <div>
              <span>{item.kind}</span>
              <strong>{item.label}</strong>
            </div>
            {removed ? (
              <>
                <button type="button" onClick={() => setFrictionState(item.id, 'open').catch((error) => onError(error?.message || 'Could not reopen route.'))}>
                  Reopen
                </button>
                <button type="button" onClick={() => deleteFriction(item.id).catch((error) => onError(error?.message || 'Could not delete route.'))}>
                  Delete
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setFrictionState(item.id, 'removed').catch((error) => onError(error?.message || 'Could not mark route.'))}>
                Mark removed
              </button>
            )}
          </div>
        ))
      )}
    </section>
  );
}

function DisclosureScreen({ model, onError }) {
  const [recipient, setRecipient] = useState('');
  const [situation, setSituation] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async (event) => {
    event.preventDefault();
    setBusy(true);
    setCopied(false);
    try {
      const nextDraft = await draftDisclosure(
        recipient.trim() || 'someone he trusts',
        situation.trim(),
        model,
      );
      setDraft(nextDraft);
    } catch (error) {
      onError(error?.message || 'Could not draft disclosure.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
    } catch (error) {
      onError(error?.message || 'Could not copy draft.');
    }
  };

  return (
    <div className={styles.sectionLayout}>
      <SectionTitle title="Disclosure" copy="Draft the plain message, edit it, then send it yourself." />
      <form className={styles.formBlock} onSubmit={generate}>
        <label>
          <span>To</span>
          <input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="Brother, friend, sponsor" />
        </label>
        <label>
          <span>What happened</span>
          <textarea value={situation} onChange={(event) => setSituation(event.target.value)} placeholder="Used on Friday. Unblocked the number on Thursday night." rows={5} />
        </label>
        <button className={styles.primaryButton} type="submit" disabled={busy}>
          {busy ? 'Drafting' : draft ? 'Redraft' : 'Draft the message'}
        </button>
      </form>
      {draft ? (
        <div className={styles.formBlock}>
          <h3>Draft</h3>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={8} />
          <button className={styles.primaryButton} type="button" onClick={copy}>
            {copied ? 'Copied' : 'Copy to send'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function NaLogScreen({ onError }) {
  const [entries, setEntries] = useState([]);
  const [kind, setKind] = useState('na');
  const [note, setNote] = useState('');
  const [flags, setFlags] = useState({
    honesty: false,
    accountability: false,
    connection: false,
    change: false,
  });

  useEffect(() => {
    return watchNaLog(setEntries, (error) => onError(error?.message || 'Could not read litmus log.'));
  }, [onError]);

  const save = async (event) => {
    event.preventDefault();
    try {
      await addNaLog({ kind, ...flags, note: note.trim() || undefined });
      setNote('');
      setFlags({ honesty: false, accountability: false, connection: false, change: false });
    } catch (error) {
      onError(error?.message || 'Could not save litmus entry.');
    }
  };

  return (
    <div className={styles.sectionLayout}>
      <SectionTitle title="The litmus" copy="Honesty, accountability, connection, behavioural change." />
      <form className={styles.formBlock} onSubmit={save}>
        <Segmented options={LOG_KINDS} value={kind} onChange={setKind} />
        <div className={styles.checkGrid}>
          {LITMUS.map(([key, label]) => (
            <label key={key} className={styles.checkRow}>
              <input
                type="checkbox"
                checked={flags[key]}
                onChange={() => setFlags((prev) => ({ ...prev, [key]: !prev[key] }))}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="What it gave you, or what replaces it" rows={4} />
        <button className={styles.primaryButton} type="submit">Save entry</button>
      </form>
      <div className={styles.entryList}>
        {entries.length === 0 ? (
          <EmptyLine text="No entries yet." />
        ) : (
          entries.map((entry) => {
            const passed = LITMUS.filter(([key]) => entry[key]).length;
            return (
              <article key={entry.id} className={styles.entry}>
                <div>
                  <strong>{labelFor(LOG_KINDS, entry.kind)}</strong>
                  <span>{passed}/4 passed</span>
                </div>
                <p>{LITMUS.filter(([key]) => entry[key]).map(([, label]) => label).join(' - ') || 'none passed'}</p>
                {entry.note ? <p>{entry.note}</p> : null}
                <button type="button" onClick={() => deleteNaLog(entry.id).catch((error) => onError(error?.message || 'Could not delete entry.'))}>Delete</button>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function CompareScreen({ onError }) {
  const [phase, setPhase] = useState('compose');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [tally, setTally] = useState({ total: 0, byModel: {}, ties: 0 });

  useEffect(() => {
    return watchComparisonTally(setTally, (error) => onError(error?.message || 'Could not read comparison tally.'));
  }, [onError]);

  const run = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    setPhase('running');
    setReveal(null);
    try {
      const nextResult = await compareModels(message.trim());
      setResult(nextResult);
      setPhase('rate');
    } catch (error) {
      setPhase('compose');
      onError(error?.message || 'Comparison failed.');
    }
  };

  const pick = async (choice) => {
    if (!result) return;
    try {
      const nextReveal = await recordComparison(result.comparisonId, choice);
      setReveal({ ...nextReveal, pick: choice });
      setPhase('revealed');
    } catch (error) {
      onError(error?.message || 'Could not record comparison.');
    }
  };

  return (
    <div className={styles.sectionLayout}>
      <SectionTitle title="Experiment A" copy="Run both models blind, then reveal the mapping after you pick." />
      {tally.total > 0 ? (
        <div className={styles.tally}>
          <strong>{tally.total} rated</strong>
          {Object.entries(tally.byModel).map(([modelId, count]) => (
            <span key={modelId}>{MODEL_NAMES[modelId] || modelId}: {count}</span>
          ))}
          {tally.ties ? <span>Ties: {tally.ties}</span> : null}
        </div>
      ) : null}
      {phase === 'compose' || phase === 'running' ? (
        <form className={styles.formBlock} onSubmit={run}>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} placeholder="A message to test both models on" disabled={phase === 'running'} />
          <button className={styles.primaryButton} type="submit" disabled={phase === 'running' || !message.trim()}>
            {phase === 'running' ? 'Running both' : 'Run both'}
          </button>
        </form>
      ) : null}
      {(phase === 'rate' || phase === 'revealed') && result ? (
        <div className={styles.compareGrid}>
          <CompareReply slot="A" text={result.a} reveal={reveal} phase={phase} onPick={() => pick('a')} />
          <CompareReply slot="B" text={result.b} reveal={reveal} phase={phase} onPick={() => pick('b')} />
          {phase === 'rate' ? (
            <button className={styles.secondaryButton} type="button" onClick={() => pick('tie')}>Too close to call</button>
          ) : (
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => {
                setPhase('compose');
                setMessage('');
                setResult(null);
                setReveal(null);
              }}
            >
              New comparison
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CompareReply({ slot, text, reveal, phase, onPick }) {
  const model = slot === 'A' ? reveal?.aModel : reveal?.bModel;
  const picked = reveal?.pick === slot.toLowerCase();
  const won = reveal?.winner !== 'tie' && reveal?.winner === model;
  return (
    <article className={styles.compareReply}>
      <div>
        <strong>{slot}</strong>
        {phase === 'revealed' ? (
          <span className={won ? styles.winner : ''}>
            {MODEL_NAMES[model] || model}{picked ? ' - your pick' : ''}
          </span>
        ) : null}
      </div>
      <p>{text}</p>
      {phase === 'rate' ? <button type="button" onClick={onPick}>{slot} interrupted better</button> : null}
    </article>
  );
}

function SettingsScreen({ model, onModel, onOpenChapters, onSignOut, onError, onNotice }) {
  const [contacts, setContacts] = useState([]);
  const [grounding, setGrounding] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', relationship: '', phone: '' });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    return watchContacts(setContacts, (error) => onError(error?.message || 'Could not read contacts.'));
  }, [onError]);

  useEffect(() => {
    return watchGrounding(setGrounding, (error) => onError(error?.message || 'Could not read grounding profile.'));
  }, [onError]);

  const pickModel = async (id) => {
    onModel(id);
    try {
      await setModelPreference(id);
    } catch (error) {
      onError(error?.message || 'Could not save model preference.');
    }
  };

  const add = async (event) => {
    event.preventDefault();
    if (!contactForm.name.trim()) return;
    try {
      await addContact({
        name: contactForm.name.trim(),
        relationship: contactForm.relationship.trim() || undefined,
        phone: contactForm.phone.trim() || undefined,
        priority: contacts.length,
      });
      setContactForm({ name: '', relationship: '', phone: '' });
    } catch (error) {
      onError(error?.message || 'Could not add contact.');
    }
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const dump = await exportAll();
      const json = JSON.stringify(dump, null, 2);
      try {
        await navigator.clipboard.writeText(json);
        onNotice('Export copied to clipboard.');
      } catch {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `repinfaust-export-${new Date().toISOString().slice(0, 10)}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
        onNotice('Export downloaded.');
      }
    } catch (error) {
      onError(error?.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const doDelete = async () => {
    const token = window.prompt('Type DELETE EVERYTHING to erase Repinfaust data.');
    if (token !== 'DELETE EVERYTHING') return;
    try {
      const deleted = await deleteAll();
      onNotice(`Deleted ${deleted} records.`);
    } catch (error) {
      onError(error?.message || 'Delete failed.');
    }
  };

  return (
    <div className={styles.sectionLayout}>
      <SectionTitle title="Settings" copy="The book, the voice, the people, the profile, the data." />
      <div className={styles.settingsGrid}>
        <section className={styles.settingsBlock}>
          <h3>The book</h3>
          <button className={styles.primaryButton} type="button" onClick={onOpenChapters}>Index of Chapters</button>
        </section>
        <section className={styles.settingsBlock}>
          <h3>The voice</h3>
          <div className={styles.modelRow}>
            {MODEL_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`${styles.modelButton} ${model === option.id ? styles.modelButtonActive : ''}`}
                type="button"
                disabled={option.embargoed}
                onClick={() => pickModel(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className={styles.smallNote}>Fable 5 remains present in the allowlist, but disabled until available.</p>
        </section>
        <section className={styles.settingsBlock}>
          <h3>The people</h3>
          <div className={styles.contactList}>
            {contacts.length === 0 ? (
              <EmptyLine text="No contacts saved." />
            ) : (
              contacts.map((contact) => (
                <div key={contact.id} className={styles.contactRow}>
                  <strong>{contact.name}</strong>
                  <span>{contact.relationship || 'contact'}{contact.phone ? ` - ${contact.phone}` : ' - no number'}</span>
                </div>
              ))
            )}
          </div>
          <form className={styles.compactForm} onSubmit={add}>
            <input value={contactForm.name} onChange={(event) => setContactForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Name" />
            <input value={contactForm.relationship} onChange={(event) => setContactForm((prev) => ({ ...prev, relationship: event.target.value }))} placeholder="Relationship" />
            <input value={contactForm.phone} onChange={(event) => setContactForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Phone" />
            <button className={styles.primaryButton} type="submit">Add contact</button>
          </form>
        </section>
        <section className={styles.settingsBlock}>
          <h3>Grounding profile</h3>
          <textarea value={grounding} onChange={(event) => setGrounding(event.target.value)} rows={12} />
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => saveGrounding(grounding).then(() => onNotice('Profile saved.')).catch((error) => onError(error?.message || 'Could not save profile.'))}
          >
            Save profile
          </button>
        </section>
        <section className={styles.settingsBlock}>
          <h3>Your data</h3>
          <div className={styles.dataActions}>
            <button className={styles.primaryButton} type="button" onClick={doExport} disabled={exporting}>{exporting ? 'Exporting' : 'Export JSON'}</button>
            <button className={styles.dangerButton} type="button" onClick={doDelete}>Delete everything</button>
            <button className={styles.secondaryButton} type="button" onClick={onSignOut}>Sign out</button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ChaptersScreen({ activeSessionId, onBack, onError }) {
  const [chapters, setChapters] = useState([]);
  const [openings, setOpenings] = useState({});
  const [reading, setReading] = useState(null);

  useEffect(() => {
    return watchChapters(activeSessionId, setChapters, (error) => onError(error?.message || 'Could not read chapters.'));
  }, [activeSessionId, onError]);

  useEffect(() => {
    chapters.forEach((chapter) => {
      if (openings[chapter.id] !== undefined) return;
      chapterOpeningLine(chapter.id)
        .then((line) => setOpenings((prev) => ({ ...prev, [chapter.id]: line })))
        .catch(() => undefined);
    });
  }, [chapters, openings]);

  if (reading) {
    return <ChapterReader chapter={reading} onBack={() => setReading(null)} onError={onError} />;
  }

  return (
    <div className={styles.sectionLayout}>
      <div className={styles.sectionHead}>
        <button type="button" onClick={onBack}>Back to Settings</button>
        <h2>Index of Chapters</h2>
      </div>
      {chapters.length === 0 ? (
        <EmptyLine text="No archived chapters yet." />
      ) : (
        <div className={styles.chapterList}>
          {chapters.map((chapter, index) => (
            <button key={chapter.id} className={styles.chapterRow} type="button" onClick={() => setReading(chapter)}>
              <span>{romanNumeral(chapters.length - index)}</span>
              <strong>{formatDate(chapter.lastActiveAt || chapter.startedAt)}</strong>
              <em>{MODE_META[chapter.mode]?.label?.toLowerCase() || 'chapter'}{chapter.distilled ? ' - distilled' : ''}</em>
              <p>{openings[chapter.id] || '...'}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChapterReader({ chapter, onBack, onError }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    return watchMessages(chapter.id, setMessages, (error) => onError(error?.message || 'Could not read chapter.'));
  }, [chapter.id, onError]);

  return (
    <div className={styles.sectionLayout}>
      <div className={styles.sectionHead}>
        <button type="button" onClick={onBack}>Back to Index</button>
        <h2>{formatDate(chapter.lastActiveAt || chapter.startedAt, true)}</h2>
      </div>
      <div className={styles.dialogueStack}>
        {messages.length === 0 ? (
          <EmptyLine text="This chapter is empty." />
        ) : (
          messages.map((message) => <Dialogue key={message.id} message={message} sessionId={chapter.id} previousText="" onError={onError} />)
        )}
      </div>
    </div>
  );
}

function SectionTitle({ title, copy }) {
  return (
    <div className={styles.sectionTitle}>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

function EmptyLine({ text }) {
  return <p className={styles.emptyLine}>{text}</p>;
}

function Segmented({ options, value, onChange }) {
  return (
    <div className={styles.segmented}>
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={value === id ? styles.segmentedActive : ''}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function labelFor(options, value) {
  return options.find(([id]) => id === value)?.[1] || value || 'Unknown';
}
