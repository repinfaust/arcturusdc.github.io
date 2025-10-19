'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

/* ===== Firestore ===== */
import { auth, db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

/* ===== Constants ===== */
const BOARD_LS_KEY = 'stea-board-v1';
const STEA_COLUMNS = ['Idea', 'Planning', 'Design', 'Build'];
const TYPE_OPTIONS = [
  { value: 'idea', label: 'Idea', emoji: '💡' },
  { value: 'feature', label: 'Feature', emoji: '✨' },
  { value: 'bug', label: 'Bug', emoji: '🐞' },
  { value: 'observation', label: 'Observation', emoji: '👀' },
  { value: 'newapp', label: 'New App', emoji: '📱' },
];
const URGENCY_MAP_FROM_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};
const DEFAULT_URGENCY = 'medium';

export default function TouMeTestersOnly() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [feedback, setFeedback] = useState('');
  const [testerName, setTesterName] = useState('');
  const [currentBuild, setCurrentBuild] = useState('');
  const [platform, setPlatform] = useState('');

  // Modal state for creating a STEa card from a result/feedback
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardSeed, setCardSeed] = useState(null); // { from: 'fail'|'feedback', test? , preset: {type, urgency, title, description} }
  const [cardForm, setCardForm] = useState({
    type: 'bug',
    urgency: 'medium',
    title: '',
    description: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        const next = encodeURIComponent('/apps/stea/toume/testersonlypage');
        router.replace(`/apps/stea?next=${next}`);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Load saved results from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('toume-test-results');
    if (saved) {
      setTestResults(JSON.parse(saved));
    }
    const savedTester = localStorage.getItem('toume-tester-name');
    if (savedTester) {
      setTesterName(savedTester);
    }
    const savedFeedback = localStorage.getItem('toume-feedback');
    if (savedFeedback) {
      setFeedback(savedFeedback);
    }
  }, []);

  // Persist helper (local)
  const saveResultsLocal = (newResults) => {
    setTestResults(newResults);
    localStorage.setItem('toume-test-results', JSON.stringify(newResults));
  };

  const saveTesterInfo = () => {
    localStorage.setItem('toume-tester-name', testerName);
  };

  // Firestore: save a single test case result row immediately
  const saveResultToFirestore = async (testId, payload) => {
    try {
      await addDoc(collection(db, 'toume_test_results'), {
        testId,
        ...payload,
        savedAt: serverTimestamp(),
      });
      // no toast here to keep UX quiet
    } catch (e) {
      console.error('Failed to save test result to Firestore', e);
    }
  };

  // Firestore: optional “session snapshot” save (called manually if you want)
  const saveSessionSnapshot = async () => {
    try {
      await addDoc(collection(db, 'toume_test_sessions'), {
        tester: testerName || null,
        build: currentBuild || null,
        platform: platform || null,
        timestamp: serverTimestamp(),
        testResults,
        summary: {
          total: testCases.length,
          passed: Object.values(testResults).filter((r) => r.status === 'pass').length,
          failed: Object.values(testResults).filter((r) => r.status === 'fail').length,
          skipped: Object.values(testResults).filter((r) => r.status === 'skip').length,
        },
        generalFeedback: feedback || '',
      });
      alert('Session snapshot saved to Firestore ✅');
    } catch (e) {
      console.error('Failed to save session snapshot', e);
      alert('Could not save session snapshot to Firestore.');
    }
  };

  const updateTestResult = (testId, status, notes = '') => {
    const base = {
      status,
      notes,
      timestamp: new Date().toISOString(),
      tester: testerName,
      build: currentBuild,
      platform,
    };
    const newResults = {
      ...testResults,
      [testId]: base,
    };
    saveResultsLocal(newResults);
    // Save this row to Firestore too
    void saveResultToFirestore(testId, base);
    // If user just hit "Fail", open quick create-card prompt?
    // We'll show a contextual action instead (button), less intrusive.
  };

  // Calculations
  const getPassRate = () => {
    const total = testCases.length;
    const passed = Object.values(testResults).filter((r) => r.status === 'pass').length;
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  };

  const getCriticalPassRate = () => {
    const criticalTests = testCases.filter((t) => t.priority === 'CRITICAL');
    const criticalPassed = criticalTests.filter((t) => testResults[t.id]?.status === 'pass').length;
    return criticalTests.length > 0 ? Math.round((criticalPassed / criticalTests.length) * 100) : 0;
  };

  const exportResults = () => {
    const results = {
      tester: testerName,
      build: currentBuild,
      platform,
      timestamp: new Date().toISOString(),
      passRate: getPassRate(),
      criticalPassRate: getCriticalPassRate(),
      feedback,
      testResults,
      summary: {
        total: testCases.length,
        passed: Object.values(testResults).filter((r) => r.status === 'pass').length,
        failed: Object.values(testResults).filter((r) => r.status === 'fail').length,
        skipped: Object.values(testResults).filter((r) => r.status === 'skip').length,
      },
    };
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toume-test-results-${testerName || 'tester'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  /* ======== Card creation (STEa) ======== */

  // Open modal prefilled from a failing test
  const openCardFromFail = (test) => {
    const r = testResults[test.id];
    const urgency = URGENCY_MAP_FROM_PRIORITY[test.priority] || DEFAULT_URGENCY;
    const preset = {
      type: 'bug',
      urgency,
      title: `Tou.me: ${test.id} failed — ${test.name}`,
      description:
        `Test: ${test.id} — ${test.name}\nPriority: ${test.priority}\nBuild: ${currentBuild || 'n/a'}\nPlatform: ${platform || 'n/a'}\nTester: ${testerName || 'n/a'}\n\nSteps/Description:\n${test.description}\n\nNotes:\n${r?.notes || '(none)'}\n`,
    };
    setCardSeed({ from: 'fail', test, preset });
    setCardForm(preset);
    setCardModalOpen(true);
  };

  // Open modal from additional feedback (for any status)
  const openCardFromFeedback = (test) => {
    const r = testResults[test.id];
    const urgency = URGENCY_MAP_FROM_PRIORITY[test.priority] || DEFAULT_URGENCY;
    const preset = {
      type: 'observation',
      urgency,
      title: `Tou.me feedback — ${test.id}: ${test.name}`,
      description:
        `Feedback on: ${test.id} — ${test.name}\nPriority: ${test.priority}\nBuild: ${currentBuild || 'n/a'}\nPlatform: ${platform || 'n/a'}\nTester: ${testerName || 'n/a'}\n\nFeedback:\n${r?.notes || '(add details here)'}\n`,
    };
    setCardSeed({ from: 'feedback', test, preset });
    setCardForm(preset);
    setCardModalOpen(true);
  };

  const saveCardToLocalStorage = (card) => {
    try {
      const raw = localStorage.getItem(BOARD_LS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      localStorage.setItem(BOARD_LS_KEY, JSON.stringify([card, ...arr]));
    } catch {
      // ignore
    }
  };

  const createSteaCard = async () => {
    const nowIso = new Date().toISOString();
    if (!cardForm.title.trim()) {
      alert('Please enter a card title.');
      return;
    }
    // Build a card compatible with the /board page schema
    const newCard = {
      id: `stea_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: 'Idea', // start in Idea
      createdAt: nowIso,
      updatedAt: nowIso,
      type: cardForm.type,
      urgency: cardForm.urgency,
      title: cardForm.title.trim(),
      description: cardForm.description || '',
    };

    // 1) Save in Firestore (future board sync)
    try {
      await addDoc(collection(db, 'stea_cards'), {
        ...newCard,
        savedAt: serverTimestamp(),
        source: 'toume_test_portal',
      });
    } catch (e) {
      console.error('Failed to create STEa card in Firestore', e);
      alert('Could not save card to Firestore (it will still appear on your /board via localStorage).');
    }

    // 2) Also add to localStorage so current /board shows it immediately
    saveCardToLocalStorage(newCard);

    setCardModalOpen(false);
    setCardSeed(null);
    setCardForm({ type: 'bug', urgency: 'medium', title: '', description: '' });
    alert('Card created! Check /apps/stea/board.');
  };

  /* ===== Test cases (unchanged list) ===== */
  const testCases = [
    { id: 'TC-001', name: 'Complete User Onboarding Flow', priority: 'CRITICAL', time: '5 min', description: 'Sign in → Create circle → Add child → Create event → Complete tour' },
    { id: 'TC-002', name: 'Circle Creation and Member Invitation', priority: 'CRITICAL', time: '3 min', description: 'Create circle → Invite member → Accept invitation' },
    { id: 'TC-003', name: 'Event Creation with Privacy Controls', priority: 'CRITICAL', time: '3 min', description: 'Create event → Set privacy to Private → Verify visibility' },
    { id: 'TC-004', name: 'Google Calendar Connection', priority: 'CRITICAL', time: '4 min', description: 'Connect Google Calendar → Import events → Add overlay metadata' },
    { id: 'TC-005', name: 'Handover Creation and Completion', priority: 'CRITICAL', time: '4 min', description: 'Create handover → Add checklist → Attach inventory → Complete → Verify location update' },
    { id: 'TC-006', name: 'Gift Reservation System', priority: 'CRITICAL', time: '3 min', description: 'Add gift → Reserve as User A → Verify User B cannot reserve' },
    { id: 'TC-007', name: 'Real-Time Multi-User Updates', priority: 'HIGH', time: '4 min', description: 'Two users edit same data → Verify real-time sync' },
    { id: 'TC-008', name: 'App Store Reviewer Access', priority: 'CRITICAL', time: '2 min', description: 'Tap logo 7 times → Verify demo mode → Test features' },
    { id: 'TC-009', name: 'Inventory Location Tracking', priority: 'HIGH', time: '3 min', description: 'Add item → Create handover → Complete → Verify location update' },
    { id: 'TC-010', name: 'Calendar Conflict Detection', priority: 'HIGH', time: '3 min', description: 'Create overlapping events → Verify conflict badge → Check suggestions' },
    { id: 'TC-011', name: 'Permission Enforcement', priority: 'HIGH', time: '3 min', description: 'Sign in as Trusted Adult → Verify blocked actions' },
    { id: 'TC-012', name: 'Data Deletion Compliance', priority: 'CRITICAL', time: '3 min', description: 'Create test account → Delete account → Verify complete removal' },
    { id: 'TC-013', name: 'Large Circle Performance', priority: 'MEDIUM', time: '4 min', description: 'Test with 8+ members, 50+ events → Measure response times' },
    { id: 'TC-014', name: 'Offline/Online Synchronization', priority: 'HIGH', time: '4 min', description: 'Edit offline → Reconnect → Verify sync' },
    { id: 'TC-015', name: 'File Upload Security', priority: 'HIGH', time: '3 min', description: 'Test file size limits → Type validation → Security checks' },
    { id: 'TC-016', name: 'App Crash Prevention', priority: 'HIGH', time: '5 min', description: 'Rapid navigation → Invalid data → Network errors → Monitor crashes' },
    { id: 'TC-017', name: 'Onboarding Completion Rate', priority: 'MEDIUM', time: '6 min', description: 'Fresh install → Complete onboarding → Note confusing steps' },
    { id: 'TC-018', name: 'Calendar Confusion Prevention', priority: 'HIGH', time: '4 min', description: 'Connect Google Calendar → Verify clear distinction between calendar types' },
    { id: 'TC-019', name: 'Accessibility Basics', priority: 'MEDIUM', time: '4 min', description: 'Enable screen reader → Test navigation → Check contrast' },
    { id: 'TC-020', name: 'Cross-Platform Consistency', priority: 'MEDIUM', time: '5 min', description: 'Compare iOS/Android → Check feature parity → Performance' },
  ];

  /* ===== UI ===== */
  const priorityColors = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  if (!authReady) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border bg-white/70 p-6 text-center text-sm text-neutral-600">
          Checking your STEa access…
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border bg-white/70 p-6 text-center text-sm text-neutral-600">
          Redirecting you to the STEa home to sign in…
        </div>
      </main>
    );
  }

  return (
    <main className="pb-10 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10"
          src="/img/tou.me_logo.jpeg"
          width={64}
          height={64}
          alt="Tou.me logo"
          priority
        />
        <div>
          <div className="font-extrabold text-red-600">🧪 Tou.me Testing Portal</div>
          <div className="text-muted text-sm">Internal testing for team and user group</div>
          <p className="mt-2 text-sm text-neutral-700">
            This page is for coordinated testing of Tou.me MVP 1.3. Complete the test cases below,
            report issues, and provide feedback. Results now save to Firestore and you can create STEa cards directly.
          </p>
        </div>
      </div>

      {/* Tester Info */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Tester Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input
              type="text"
              value={testerName}
              onChange={(e) => setTesterName(e.target.value)}
              onBlur={saveTesterInfo}
              placeholder="Enter your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Build Version</label>
            <input
              type="text"
              value={currentBuild}
              onChange={(e) => setCurrentBuild(e.target.value)}
              placeholder="e.g., 1.3.0-beta.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select platform</option>
              <option value="iOS">iOS</option>
              <option value="Android">Android</option>
              <option value="Both">Both</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Actions</label>
            <div className="flex gap-2">
              <button
                onClick={exportResults}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export Results
              </button>
              <button
                onClick={saveSessionSnapshot}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save Snapshot
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Summary */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Testing Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{getPassRate()}%</div>
            <div className="text-sm text-blue-800">Overall Pass Rate</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{getCriticalPassRate()}%</div>
            <div className="text-sm text-red-800">Critical Tests</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(testResults).filter((r) => r.status === 'pass').length}
            </div>
            <div className="text-sm text-green-800">Tests Passed</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {Object.values(testResults).filter((r) => r.status === 'fail').length}
            </div>
            <div className="text-sm text-gray-800">Tests Failed</div>
          </div>
        </div>
      </section>

      {/* Test Cases */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Test Cases</h2>
        <div className="space-y-4">
          {testCases.map((test) => {
            const result = testResults[test.id];

            return (
              <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-medium">{test.id}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${priorityColors[test.priority]}`}>
                        {test.priority}
                      </span>
                      <span className="text-sm text-gray-500">{test.time}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{test.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => updateTestResult(test.id, 'pass', result?.notes || '')}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        result?.status === 'pass' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                      }`}
                    >
                      ✓ Pass
                    </button>
                    <button
                      onClick={() => updateTestResult(test.id, 'fail', result?.notes || '')}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        result?.status === 'fail' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                      }`}
                    >
                      ✗ Fail
                    </button>
                    <button
                      onClick={() => updateTestResult(test.id, 'skip', result?.notes || '')}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        result?.status === 'skip' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-yellow-100'
                      }`}
                    >
                      ⏭ Skip
                    </button>
                  </div>
                </div>

                {/* Notes + Actions */}
                <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>
                      Status:{' '}
                      <strong className="capitalize">
                        {result?.status || '—'}
                      </strong>
                    </span>
                    <span>{result?.timestamp ? new Date(result.timestamp).toLocaleString() : ''}</span>
                  </div>
                  <textarea
                    placeholder="Add notes about this test (issues found, observations, etc.)"
                    value={result?.notes || ''}
                    onChange={(e) => updateTestResult(test.id, result?.status || 'pass', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none"
                    rows={2}
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    {/* Create STEa card from Fail */}
                    <button
                      onClick={() => openCardFromFail(test)}
                      disabled={result?.status !== 'fail'}
                      className={`px-3 py-2 text-sm rounded border ${
                        result?.status === 'fail'
                          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                          : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      title={result?.status === 'fail' ? 'Create a bug card from this fail' : 'Only enabled when failed'}
                    >
                      ➕ Create STEa Card (Fail)
                    </button>

                    {/* Additional feedback → Create card for any status */}
                    <button
                      onClick={() => openCardFromFeedback(test)}
                      className="px-3 py-2 text-sm rounded border bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                      title="Create a card from feedback for this test"
                    >
                      📝 Create STEa Card (Feedback)
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* General Feedback */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">General Feedback & Issues</h2>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share any general feedback, bugs found, UX issues, or suggestions for improvement..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={6}
        />
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <p className="text-sm text-gray-600 flex-1">
            Feedback is saved locally. Use "Save Snapshot" to push a full copy to Firestore.
          </p>
          <button
            onClick={() => {
              localStorage.setItem('toume-feedback', feedback);
              alert('Feedback saved locally!');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Save Feedback
          </button>

          {/* Quick card from general feedback */}
          <button
            onClick={() => {
              const preset = {
                type: 'observation',
                urgency: 'medium',
                title: `Tou.me — General Feedback (${testerName || 'tester'})`,
                description:
                  `Build: ${currentBuild || 'n/a'}\nPlatform: ${platform || 'n/a'}\nTester: ${testerName || 'n/a'}\n\nFeedback:\n${feedback || '(add details)'}\n`,
              };
              setCardSeed({ from: 'general', test: null, preset });
              setCardForm(preset);
              setCardModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create STEa Card from Feedback
          </button>
        </div>
      </section>

      {/* Release Readiness */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Release Readiness Checklist</h2>
        <div className="space-y-2">
          <div className={`flex items-center gap-2 ${getCriticalPassRate() === 100 ? 'text-green-600' : 'text-red-600'}`}>
            <span>{getCriticalPassRate() === 100 ? '✅' : '❌'}</span>
            <span>All critical tests passing (currently {getCriticalPassRate()}%)</span>
          </div>
          <div className={`flex items-center gap-2 ${getPassRate() >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
            <span>{getPassRate() >= 90 ? '✅' : '⚠️'}</span>
            <span>Overall pass rate ≥90% (currently {getPassRate()}%)</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>📋</span>
            <span>No critical bugs reported in feedback</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>🚀</span>
            <span>App store reviewer access working (TC-008)</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="card p-6 mt-4 text-center">
        <p className="text-sm text-gray-600">
          This testing portal is for internal use only. Results save locally and to Firestore on each action.
          <br />
          Need the board?{' '}
          <Link href="/apps/stea/board" className="text-blue-600 hover:underline">
            Open STEa board
          </Link>
          .
        </p>
      </section>

      {/* ===== Card Modal ===== */}
      {cardModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCardModalOpen(false)} />
          <div className="relative z-10 w-full max-w-xl card p-5">
            <h3 className="text-xl font-extrabold mb-3">
              Create STEa Card {cardSeed?.test ? `— ${cardSeed.test.id}` : ''}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={cardForm.type}
                  onChange={(e) => setCardForm((f) => ({ ...f, type: e.target.value }))}
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
                  value={cardForm.urgency}
                  onChange={(e) => setCardForm((f) => ({ ...f, urgency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {['low', 'medium', 'high', 'critical'].map((u) => (
                    <option key={u} value={u}>
                      {u[0].toUpperCase() + u.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={cardForm.title}
                  onChange={(e) => setCardForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Fix calendar privacy not applying on private events"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={6}
                  value={cardForm.description}
                  onChange={(e) => setCardForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Repro steps, expected vs actual, context…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setCardModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={createSteaCard}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Create Card
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
