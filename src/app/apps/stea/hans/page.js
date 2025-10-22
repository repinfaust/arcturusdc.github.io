'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';

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

export default function HansTestingSuite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseIdParam = searchParams?.get('case');

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [appFilter, setAppFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedCase, setExpandedCase] = useState(caseIdParam || null);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        const next = encodeURIComponent('/apps/stea/hans');
        router.replace(`/apps/stea?next=${next}`);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Load test cases from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'hans_cases'),
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
  }, [user]);

  // Get unique apps for filter
  const availableApps = useMemo(() => {
    const apps = new Set(testCases.map(tc => tc.app).filter(Boolean));
    return Array.from(apps).sort();
  }, [testCases]);

  // Filter test cases
  const filteredCases = useMemo(() => {
    return testCases.filter(tc => {
      if (appFilter && tc.app !== appFilter) return false;
      if (statusFilter && tc.status !== statusFilter) return false;
      return true;
    });
  }, [testCases, appFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = testCases.length;
    const passed = testCases.filter(tc => tc.status === 'passed').length;
    const failed = testCases.filter(tc => tc.status === 'failed').length;
    const inProgress = testCases.filter(tc => tc.status === 'in_progress').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return { total, passed, failed, inProgress, passRate };
  }, [testCases]);

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
    <main className="pb-10 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="card p-6 flex items-start gap-4 mt-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-gradient-to-br from-blue-50 to-indigo-100">
          <span className="text-3xl">🧪</span>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-neutral-900">Hans Testing Suite</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage test cases, coordinate user testing sessions, and track quality across all apps
          </p>
        </div>
        <Link
          href="/apps/stea/board"
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
        >
          Open Filo Board
        </Link>
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

      {/* App Testing Portals */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4 px-2">Legacy Testing Portals</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Tou.me Portal */}
          <Link
            href="/apps/stea/hans/toume"
            className="group card p-6 hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/img/tou.me_logo.jpeg"
                  width={48}
                  height={48}
                  alt="Tou.me"
                  className="rounded-xl border border-black/10"
                />
                <div>
                  <h3 className="font-bold text-neutral-900">Tou.me Testing Portal</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    MVP 1.3 hardcoded test cases
                  </p>
                </div>
              </div>
              <span className="text-neutral-400 group-hover:text-neutral-700 transition-colors">
                →
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Filters and Test Cases */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-700 px-2">Test Cases from Filo</h2>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <select
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="">All Apps</option>
              {availableApps.map(app => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>

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
              {testCases.length === 0 ? 'No Test Cases Yet' : 'No Matching Test Cases'}
            </h3>
            <p className="text-sm text-neutral-600 max-w-md mx-auto mb-4">
              {testCases.length === 0
                ? 'Test cases sent from the Filo board will appear here. Use the "Send to Hans" button on any card to create structured test cases.'
                : 'Try adjusting your filters to see more test cases.'}
            </p>
            {testCases.length === 0 && (
              <Link
                href="/apps/stea/board"
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
              >
                Open Filo Board →
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
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-neutral-500">
        <p>
          Hans is part of the STEa Studio toolkit.{' '}
          <Link href="/apps/stea" className="text-neutral-700 hover:underline">
            Back to STEa Home
          </Link>
        </p>
      </div>
    </main>
  );
}

/* ========== Test Case Card Component ========== */
function TestCaseCard({ testCase, expanded, onToggleExpand }) {
  const [updating, setUpdating] = useState(false);
  const [criteriaStatus, setCriteriaStatus] = useState({});

  const statusOption = STATUS_OPTIONS.find(s => s.value === testCase.status) || STATUS_OPTIONS[0];

  const handleStatusChange = async (newStatus) => {
    if (updating) return;
    setUpdating(true);

    try {
      await updateDoc(doc(db, 'hans_cases', testCase.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
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
            href={`/apps/stea/board`}
            className="px-3 py-2 text-sm border rounded-lg hover:bg-neutral-50 transition-colors"
            title="View source card in Filo"
          >
            View in Filo →
          </Link>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t pt-4 space-y-4">
          {/* User Story */}
          {testCase.userStory && (
            <div>
              <h4 className="text-sm font-semibold text-neutral-700 mb-2">User Story</h4>
              <p className="text-sm text-neutral-600 bg-blue-50 border border-blue-200 rounded p-3">
                {testCase.userStory}
              </p>
            </div>
          )}

          {/* Acceptance Criteria */}
          {testCase.acceptanceCriteria && testCase.acceptanceCriteria.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-neutral-700">
                  Acceptance Criteria ({passedCount}/{totalCriteria} passed)
                </h4>
              </div>
              <div className="space-y-2">
                {testCase.acceptanceCriteria.map((criterion, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={!!criteriaStatus[idx]}
                      onChange={() => toggleCriteria(idx)}
                      className="mt-0.5 h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500"
                    />
                    <span className={`flex-1 text-sm ${criteriaStatus[idx] ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
                      {criterion}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* User Flow */}
          {testCase.userFlow && testCase.userFlow.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-neutral-700 mb-2">User Flow</h4>
              <div className="space-y-2">
                {testCase.userFlow.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm text-neutral-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
