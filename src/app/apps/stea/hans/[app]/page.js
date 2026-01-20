'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, where, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useTenant } from '@/contexts/TenantContext';
import TenantSwitcher from '@/components/TenantSwitcher';
import SteaAppsDropdown from '@/components/SteaAppsDropdown';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'passed', label: 'Passed', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-700 border-red-200' },
];

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600 border-gray-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

export default function AppSpecificHansPage() {
  const router = useRouter();
  const params = useParams();
  const { currentTenant, loading: tenantLoading } = useTenant();
  const searchParams = useSearchParams();
  const caseIdParam = searchParams?.get('case');

  // Decode app name from URL
  const appName = params?.app ? decodeURIComponent(params.app) : null;

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedCase, setExpandedCase] = useState(caseIdParam || null);

  // Card creation modal
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState({});
  const [cardSeed, setCardSeed] = useState(null);
  const [creatingCard, setCreatingCard] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdCardId, setCreatedCardId] = useState(null);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        const next = encodeURIComponent(`/apps/stea/hans/${params?.app || ''}`);
        router.replace(`/apps/stea?next=${next}`);
      }
    });
    return () => unsubscribe();
  }, [router, params?.app]);

  // Load test cases from Firestore filtered by app
  useEffect(() => {
    if (!user || !currentTenant?.id || !appName) {
      setTestCases([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'hans_cases'),
      where('tenantId', '==', currentTenant.id),
      where('app', '==', appName),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cases = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTestCases(cases);
      setLoading(false);
    }, (error) => {
      console.error('Error loading test cases:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, currentTenant, appName]);

  // Filter test cases by status only (app is already filtered by query)
  const filteredCases = useMemo(() => {
    return testCases.filter(tc => {
      if (statusFilter && tc.status !== statusFilter) return false;
      return true;
    });
  }, [testCases, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = testCases.length;
    const passed = testCases.filter(tc => tc.status === 'passed').length;
    const failed = testCases.filter(tc => tc.status === 'failed').length;
    const inProgress = testCases.filter(tc => tc.status === 'in_progress').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return { total, passed, failed, inProgress, passRate };
  }, [testCases]);

  // Card creation handlers
  const openCardFromFail = (testCase) => {
    const urgencyMap = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical',
    };
    const urgency = urgencyMap[testCase.priority] || 'medium';

    const preset = {
      type: 'bug',
      urgency,
      priority: testCase.priority || 'medium',
      app: testCase.app || appName,
      title: `${testCase.app}: ${testCase.title} - Failed Test`,
      description: `Test Case: ${testCase.title}\nPriority: ${testCase.priority}\nStatus: Failed\n\nTest Description:\n${testCase.description || 'N/A'}\n\nUser Story:\n${testCase.userStory || 'N/A'}\n\nNotes:\n${testCase.testNotes || '(none)'}\n`,
      epicId: testCase.linkedEpicId || null,
      featureId: testCase.linkedFeatureId || null,
      epicLabel: testCase.linkedEpicLabel || '',
      featureLabel: testCase.linkedFeatureLabel || '',
    };

    setCardSeed({ from: 'fail', testCase, preset });
    setCardForm(preset);
    setCardModalOpen(true);
  };

  const openCardFromFeedback = (testCase) => {
    const urgencyMap = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical',
    };
    const urgency = urgencyMap[testCase.priority] || 'medium';

    const preset = {
      type: 'observation',
      urgency,
      priority: testCase.priority || 'medium',
      app: testCase.app || appName,
      title: `${testCase.app}: Feedback on ${testCase.title}`,
      description: `Feedback on Test Case: ${testCase.title}\nPriority: ${testCase.priority}\n\nTest Description:\n${testCase.description || 'N/A'}\n\nFeedback:\n${testCase.testNotes || '(add details here)'}\n`,
      epicId: testCase.linkedEpicId || null,
      featureId: testCase.linkedFeatureId || null,
      epicLabel: testCase.linkedEpicLabel || '',
      featureLabel: testCase.linkedFeatureLabel || '',
    };

    setCardSeed({ from: 'feedback', testCase, preset });
    setCardForm(preset);
    setCardModalOpen(true);
  };

  const handleCreateCard = async () => {
    if (!cardForm.title || !currentTenant?.id) {
      alert('Title and workspace are required');
      return;
    }

    setCreatingCard(true);
    try {
      const generateSearchTokens = (text) => {
        if (!text) return [];
        const normalized = text.toLowerCase().trim();
        const words = normalized.split(/\s+/);
        const tokens = new Set();
        tokens.add(normalized);
        words.forEach(word => {
          if (word.length > 2) {
            tokens.add(word);
            for (let i = 3; i <= word.length; i++) {
              tokens.add(word.substring(0, i));
            }
          }
        });
        return Array.from(tokens);
      };

      const newCard = {
        ...cardForm,
        label: cardForm.title,
        tenantId: currentTenant.id,
        statusColumn: 'Idea',
        entityType: 'card',
        type: cardForm.type || 'observation',
        archived: false,
        searchTokens: generateSearchTokens(
          `${cardForm.title} ${cardForm.description || ''} ${cardForm.app || ''}`
        ),
        createdAt: serverTimestamp(),
        createdBy: user?.email || user?.uid || 'unknown',
        updatedAt: serverTimestamp(),
        source: 'hans_test_suite',
        linkedTestCaseId: cardSeed?.testCase?.id || null,
      };

      const docRef = await addDoc(collection(db, 'stea_cards'), newCard);

      setCardModalOpen(false);
      setCardForm({});
      setCardSeed(null);
      setCreatedCardId(docRef.id);
      setSuccessModalOpen(true);
    } catch (error) {
      console.error('Error creating card:', error);
      alert('Failed to create card. Please try again.');
    } finally {
      setCreatingCard(false);
    }
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

  if (tenantLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border bg-white/70 p-6 text-center text-sm text-neutral-600">
          Loading workspace…
        </div>
      </main>
    );
  }

  if (!currentTenant) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-amber-900">No Workspace Access</h2>
          <p className="mb-4 text-sm text-amber-700">
            You don&apos;t have access to any workspaces yet. Contact your administrator.
          </p>
          <Link
            href="/apps/stea"
            className="inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700"
          >
            Back to STEa
          </Link>
        </div>
      </main>
    );
  }

  if (!appName) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-red-900">Invalid App</h2>
          <p className="mb-4 text-sm text-red-700">
            No app specified in URL.
          </p>
          <Link
            href="/apps/stea/hans"
            className="inline-block rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Back to Hans
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-10 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="card p-6 flex items-start gap-4 mt-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-gradient-to-br from-blue-50 to-indigo-100">
          <span className="text-3xl">🧪</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/apps/stea/hans"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              ← Hans Testing Suite
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900">
            {appName} Test Cases
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Test cases, testing sessions, and quality tracking for {appName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SteaAppsDropdown />
          <TenantSwitcher />
        </div>
      </div>

      {/* Quick Stats */}
      <section className="mt-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
            <div className="text-xs text-neutral-600 mt-1">Total Cases</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <div className="text-xs text-neutral-600 mt-1">Passed</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-neutral-600 mt-1">Failed</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-xs text-neutral-600 mt-1">In Progress</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.passRate}%</div>
            <div className="text-xs text-neutral-600 mt-1">Pass Rate</div>
          </div>
        </div>
      </section>

      {/* Test Cases */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-700 px-2">
            Test Cases for {appName}
          </h2>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="card p-8 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-4">
              <svg className="animate-spin h-6 w-6 text-neutral-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-sm text-neutral-600">Loading test cases...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">
              {testCases.length === 0 ? `No Test Cases for ${appName} Yet` : 'No Matching Test Cases'}
            </h3>
            <p className="text-sm text-neutral-600 max-w-md mx-auto mb-4">
              {testCases.length === 0
                ? `Create test cases for ${appName} from the Filo board using the "Send to Hans" button on any card.`
                : 'Try adjusting your status filter to see more test cases.'}
            </p>
            {testCases.length === 0 && (
              <Link
                href={`/apps/stea/filo?app=${encodeURIComponent(appName)}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
              >
                Open {appName} in Filo →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCases.map((testCase) => (
              <TestCaseCard
                key={testCase.id}
                testCase={testCase}
                expanded={expandedCase === testCase.id}
                onToggleExpand={() => setExpandedCase(expandedCase === testCase.id ? null : testCase.id)}
                onCreateFailCard={openCardFromFail}
                onCreateFeedbackCard={openCardFromFeedback}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-neutral-500">
        <p>Hans is part of the STEa Studio toolkit</p>
      </div>

      {/* Card Creation Modal */}
      {cardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">
                Create STEa Card {cardSeed?.from === 'fail' ? '(Failed Test)' : '(Feedback)'}
              </h2>
              <button
                onClick={() => {
                  setCardModalOpen(false);
                  setCardForm({});
                  setCardSeed(null);
                }}
                className="text-neutral-500 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Type
                </label>
                <select
                  value={cardForm.type || 'observation'}
                  onChange={(e) => setCardForm({ ...cardForm, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="bug">Bug</option>
                  <option value="feature">Feature</option>
                  <option value="observation">Observation</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Priority
                </label>
                <select
                  value={cardForm.priority || 'medium'}
                  onChange={(e) => setCardForm({ ...cardForm, priority: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={cardForm.title || ''}
                  onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter card title..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  value={cardForm.description || ''}
                  onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={8}
                  placeholder="Enter card description..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setCardModalOpen(false);
                    setCardForm({});
                    setCardSeed(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCard}
                  disabled={creatingCard || !cardForm.title}
                  className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingCard ? 'Creating...' : 'Create Card in Filo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <span className="text-3xl">✓</span>
              </div>
            </div>

            <h2 className="text-center text-xl font-bold text-neutral-900 mb-2">
              Card Created Successfully!
            </h2>

            <p className="text-center text-sm text-neutral-600 mb-6">
              Your {cardSeed?.from === 'fail' ? 'bug report' : 'feedback'} card has been created in Filo.
              {createdCardId && (
                <span className="block mt-2 text-xs text-neutral-500 font-mono">
                  Card ID: {createdCardId}
                </span>
              )}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setSuccessModalOpen(false);
                  router.push(`/apps/stea/filo?app=${encodeURIComponent(appName)}`);
                }}
                className="w-full px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
              >
                Open {appName} in Filo →
              </button>

              <button
                onClick={() => setSuccessModalOpen(false)}
                className="w-full px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
              >
                Stay in Hans
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ========== Test Case Card Component ========== */
function TestCaseCard({ testCase, expanded, onToggleExpand, onCreateFailCard, onCreateFeedbackCard }) {
  const [updating, setUpdating] = useState(false);
  const [criteriaStatus, setCriteriaStatus] = useState({});
  const [testNotes, setTestNotes] = useState(testCase.testNotes || '');

  const statusOption = STATUS_OPTIONS.find(s => s.value === testCase.status) || STATUS_OPTIONS[0];

  const handleStatusChange = async (newStatus) => {
    if (updating) return;
    setUpdating(true);

    try {
      await updateDoc(doc(db, 'hans_cases', testCase.id), {
        status: newStatus,
        testNotes: testNotes,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (updating) return;
    setUpdating(true);

    try {
      await updateDoc(doc(db, 'hans_cases', testCase.id), {
        testNotes: testNotes,
        updatedAt: new Date().toISOString(),
      });
      alert('Notes saved successfully!');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const toggleCriteria = (index) => {
    setCriteriaStatus(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const passedCount = Object.values(criteriaStatus).filter(Boolean).length;
  const totalCriteria = testCase.acceptanceCriteria?.length || 0;

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {/* App Badge */}
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
              {testCase.app}
            </span>

            {/* Priority Badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${PRIORITY_COLORS[testCase.priority] || PRIORITY_COLORS.medium}`}>
              {testCase.priority?.toUpperCase()}
            </span>

            {/* Status Badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${statusOption.color}`}>
              {statusOption.label}
            </span>
          </div>

          <h3 className="text-lg font-bold text-neutral-900">{testCase.title}</h3>

          {testCase.description && (
            <p className="text-sm text-neutral-600 mt-2">{testCase.description}</p>
          )}

          {/* Hierarchy breadcrumb */}
          {(testCase.linkedEpicLabel || testCase.linkedFeatureLabel) && (
            <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
              {testCase.linkedEpicLabel && (
                <>
                  <span className="font-medium">{testCase.linkedEpicLabel}</span>
                  {testCase.linkedFeatureLabel && <span>→</span>}
                </>
              )}
              {testCase.linkedFeatureLabel && (
                <span className="font-medium">{testCase.linkedFeatureLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleExpand}
            className="px-3 py-2 text-sm border rounded-lg hover:bg-neutral-50 transition-colors"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>

          <Link
            href={`/apps/stea/filo?app=${encodeURIComponent(testCase.app)}`}
            className="px-3 py-2 text-sm border rounded-lg hover:bg-neutral-50 transition-colors"
            title="View source card in Filo"
          >
            View in Filo →
          </Link>
        </div>
      </div>

      {/* Expanded Content - Same as main Hans page */}
      {expanded && (
        <div className="border-t pt-4 space-y-6">
          {/* Preconditions */}
          {testCase.userStory && (
            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-2 flex items-center gap-2">
                <span className="text-blue-600">📋</span>
                Preconditions
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                  {testCase.userStory}
                </p>
              </div>
            </div>
          )}

          {/* Test Steps */}
          {testCase.userFlow && testCase.userFlow.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-2 flex items-center gap-2">
                <span className="text-purple-600">🔢</span>
                Test Steps
              </h4>
              <div className="space-y-2">
                {testCase.userFlow.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm text-neutral-700 pt-0.5">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expected Results */}
          {testCase.acceptanceCriteria && testCase.acceptanceCriteria.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-2 flex items-center gap-2">
                <span className="text-green-600">✅</span>
                Expected Results ({passedCount}/{totalCriteria} validated)
              </h4>
              <div className="space-y-2">
                {testCase.acceptanceCriteria.map((criterion, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={!!criteriaStatus[idx]}
                      onChange={() => toggleCriteria(idx)}
                      className="mt-0.5 h-5 w-5 rounded border-green-300 text-green-600 focus:ring-2 focus:ring-green-500"
                    />
                    <span className={`flex-1 text-sm ${criteriaStatus[idx] ? 'text-green-400 line-through' : 'text-neutral-700'}`}>
                      {criterion}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Test Notes */}
          <div>
            <h4 className="text-sm font-bold text-neutral-900 mb-2 flex items-center gap-2">
              <span className="text-amber-600">📝</span>
              Test Notes
            </h4>
            <textarea
              value={testNotes}
              onChange={(e) => setTestNotes(e.target.value)}
              placeholder="Add notes about test execution, observations, issues encountered..."
              className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 text-sm text-neutral-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
              rows={4}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSaveNotes}
                disabled={updating}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* Status Update */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-neutral-700 mb-3">Update Test Status</h4>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={updating || testCase.status === opt.value}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    testCase.status === opt.value
                      ? `${opt.color} cursor-default`
                      : 'border border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50'
                  } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Create STEa Cards */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-neutral-700 mb-3">Close the Loop in STEa</h4>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onCreateFailCard({ ...testCase, testNotes })}
                disabled={testCase.status !== 'failed'}
                className="flex-1 min-w-[200px] px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                title={testCase.status !== 'failed' ? 'Only available when test status is Failed' : 'Create a bug card in Filo for this failed test'}
              >
                ➕ Create STEa Card (Fail)
              </button>

              <button
                onClick={() => onCreateFeedbackCard({ ...testCase, testNotes })}
                className="flex-1 min-w-[200px] px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                title="Create a feedback/observation card in Filo for this test"
              >
                📝 Create STEa Card (Feedback)
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Create cards in Filo to report bugs or share feedback from testing
            </p>
          </div>

          {/* Public Link */}
          {testCase.publicToken && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-neutral-700 mb-2">Share with Testers</h4>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/t/${testCase.publicToken}`}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg bg-neutral-50"
                  onClick={(e) => e.target.select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/t/${testCase.publicToken}`);
                    alert('Link copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Copy Link
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Token expires: {testCase.publicTokenExpiry ? new Date(testCase.publicTokenExpiry).toLocaleString() : 'Unknown'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
