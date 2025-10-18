'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { auth, db, googleProvider } from '@/lib/firebase';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

/* ===== Constants ===== */
const TEST_CONFIGS = {
  quick: {
    name: 'Quick Tests',
    description: 'Fast feedback tests (~2-3 min)',
    estimatedTime: '2-3 minutes',
    color: 'bg-green-600',
    hoverColor: 'hover:bg-green-700',
    tests: ['unit', 'critical-integration'],
    testCount: 45,
  },
  critical: {
    name: 'Critical Tests',
    description: 'Production readiness tests (~8-10 min)',
    estimatedTime: '8-10 minutes',
    color: 'bg-orange-600',
    hoverColor: 'hover:bg-orange-700',
    tests: ['unit', 'integration', 'critical-e2e', 'security'],
    testCount: 89,
  },
  comprehensive: {
    name: 'Full Suite',
    description: 'Complete test coverage (~25-30 min)',
    estimatedTime: '25-30 minutes',
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    tests: ['unit', 'integration', 'e2e', 'performance', 'accessibility', 'security'],
    testCount: 135,
  },
};

const TEST_STATUS_COLORS = {
  queued: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  running: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  passed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

const ISSUE_SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const ISSUE_CATEGORY_COLORS = {
  unit: 'bg-blue-50 text-blue-700 border-blue-200',
  integration: 'bg-purple-50 text-purple-700 border-purple-200',
  e2e: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  performance: 'bg-orange-50 text-orange-700 border-orange-200',
  accessibility: 'bg-green-50 text-green-700 border-green-200',
  security: 'bg-red-50 text-red-700 border-red-200',
  unknown: 'bg-gray-50 text-gray-700 border-gray-200',
  system: 'bg-gray-50 text-gray-700 border-gray-200',
};

/* ===== Helpers ===== */
const toDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === 'function') return v.toDate();
  // string or number
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

/* ===== Real Test Execution Integration ===== */
const executeRealTestSuite = async (configType, initiatedBy, onProgress) => {
  console.log(`🚀 Dispatching ${configType} suite to GitHub Actions`);

  const response = await fetch('/api/run-tests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ configType, initiatedBy }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Run tests API failed (${response.status}): ${errorText || response.statusText}`,
    );
  }

  const data = await response.json();
  const runId = data?.runId || `test-run-${Date.now()}`;
  const status = data?.status || 'queued';

  const run = {
    id: runId,
    config: configType,
    status,
    progress: 0,
    startTime: new Date(),
  };

  onProgress?.(run);
  return run;
};

const calculateTotalTests = (testConfig) => {
  return (
    (testConfig.unitTests?.length || 0) +
    (testConfig.integrationTests?.length || 0) +
    (testConfig.e2eTests?.length || 0) +
    (testConfig.performanceTests?.length || 0) +
    (testConfig.accessibilityTests?.length || 0) +
    (testConfig.securityTests?.length || 0)
  );
};

const convertCommandResultsToIssues = (commandResults, testRunId) => {
  const issues = [];

  commandResults
    .filter((result) => !result.success)
    .forEach((result, index) => {
      const category = extractCategoryFromCommand(result.command);
      issues.push({
        id: `issue-${testRunId}-${index}`,
        title: `${category.toUpperCase()}: Command Failed`,
        description: `Test command failed: ${result.command}\n\nError: ${result.stderr || result.error || 'Unknown error'}`,
        severity: getSeverityFromCategory(category),
        category,
        testName: result.command.split(' ')[2] || 'unknown-test',
        recommendation: getRecommendationForFailure({ category }),
        createdAt: new Date(),
      });
    });

  return issues;
};

const extractCategoryFromCommand = (command) => {
  if (command.includes('test:unit')) return 'unit';
  if (command.includes('test:integration')) return 'integration';
  if (command.includes('test:e2e')) return 'e2e';
  if (command.includes('test:performance')) return 'performance';
  if (command.includes('test:accessibility')) return 'accessibility';
  if (command.includes('test:security')) return 'security';
  return 'unknown';
};

const getSeverityFromCategory = (category) => {
  switch (category) {
    case 'security':
      return 'critical';
    case 'e2e':
      return 'high';
    case 'performance':
      return 'high';
    case 'integration':
      return 'medium';
    case 'accessibility':
      return 'medium';
    case 'unit':
      return 'low';
    default:
      return 'medium';
  }
};

const getRecommendationForFailure = (test) => {
  switch (test.category) {
    case 'unit':
      return 'Review unit test implementation and fix failing assertions';
    case 'integration':
      return 'Check component interactions and data flow between services';
    case 'e2e':
      return 'Investigate user journey flow and fix UI/UX issues';
    case 'performance':
      return 'Optimize code performance and reduce resource usage';
    case 'accessibility':
      return 'Fix accessibility issues to improve app usability';
    case 'security':
      return 'Address security vulnerability immediately';
    default:
      return 'Investigate test failure and implement appropriate fix';
  }
};

/* ===== STEa Card Creation ===== */
const createSteaCardFromIssue = async (issue, testRun) => {
  const cardData = {
    title: `🧪 ${issue.title}`,
    description: `**Automated Test Failure**

**Test:** ${issue.testName}
**Category:** ${issue.category.toUpperCase()}
**Severity:** ${issue.severity.toUpperCase()}
**Test Run:** ${testRun.config?.toUpperCase?.() || 'UNKNOWN'} (${toDate(testRun.startTime)?.toLocaleString?.() || 'Unknown time'})

**Issue Description:**
${issue.description}

**Recommendation:**
${issue.recommendation}

---
*This card was automatically created from automated test failure detection.*`,
    type: 'bug',
    app: 'Tou.Me',
    priority: issue.severity,
    reporter: 'automated-testing@toume.app',
    assignee: '',
    sizeEstimate: getSizeFromSeverity(issue.severity),
    statusColumn: 'Idea',
    archived: false,
    attachments: [],
  };

  try {
    await addDoc(collection(db, 'stea_cards'), {
      ...cardData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: 'automated-testing',
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to create STEa card:', error);
    return { success: false, error: error.message };
  }
};

const getSizeFromSeverity = (severity) => {
  switch (severity) {
    case 'critical':
      return 'L';
    case 'high':
      return 'M';
    case 'medium':
      return 'S';
    case 'low':
      return 'XS';
    default:
      return 'M';
  }
};

/* ===== Main Component ===== */
export default function AutomatedTestsDashboard() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [currentTestRun, setCurrentTestRun] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [testIssues, setTestIssues] = useState([]);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [creatingCards, setCreatingCards] = useState(new Set());
  const [isStoppingRun, setIsStoppingRun] = useState(false);

  const ensureSessionCookie = useCallback(async (firebaseUser) => {
    if (!firebaseUser) return;

    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error(`Session cookie creation failed (${response.status})`);
      }
    } catch (error) {
      console.error('Failed to ensure session cookie', error);
    }
  }, []);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (firebaseUser) {
        ensureSessionCookie(firebaseUser);
      } else {
        setCurrentTestRun(null);
      }
    });

    return () => unsubscribe();
  }, [ensureSessionCookie]);

  // Load test history from Firestore
  useEffect(() => {
    if (!user) {
      setTestHistory([]);
      setTestIssues([]);
      setCurrentTestRun(null);
      return;
    }

    const runsQuery = query(collection(db, 'testRuns'), orderBy('startedAt', 'desc'));
    const unsubscribe = onSnapshot(runsQuery, (snapshot) => {
      const runs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const config = data?.config || 'quick';
        const expectedTotal =
          data?.summary?.totalTests ?? TEST_CONFIGS[config]?.testCount ?? 0;
        const completed = (data?.passed || 0) + (data?.failed || 0);
        const progress =
          expectedTotal > 0 ? Math.min(100, Math.round((completed / expectedTotal) * 100)) : 0;

        const summaryData = data?.summary || {};
        const passed = summaryData.passed ?? data?.passed ?? 0;
        const failed = summaryData.failed ?? data?.failed ?? 0;
        const skipped = summaryData.skipped ?? 0;
        const totalTests = summaryData.totalTests ?? expectedTotal;
        const successRate =
          summaryData.successRate ?? (totalTests > 0 ? (passed / totalTests) * 100 : 0);

        runs.push({
          id: doc.id,
          ...data,
          progress,
          summary: {
            totalTests,
            passed,
            failed,
            skipped,
            successRate,
          },
        });
      });

      setTestHistory(runs);

      const active = runs.find((run) => run.id === currentTestRun?.id);
      if (active) {
        if (active.status === 'running' || active.status === 'queued') {
          setCurrentTestRun((prev) => ({ ...(prev || {}), ...active }));
        } else {
          setCurrentTestRun(null);
        }
      }
    });

    setTestIssues([]);

    return () => {
      unsubscribe();
    };
  }, [user, currentTestRun?.id]);

  const handleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await ensureSessionCookie(credential.user);
    } catch (error) {
      console.error('Google sign-in failed', error);
      alert(`Google sign-in failed: ${error.message}`);
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Failed to call logout API', error);
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Firebase sign-out failed', error);
    }

    setUser(null);
    setCurrentTestRun(null);
    setTestHistory([]);
    setTestIssues([]);
    setSigningOut(false);
  };

  const runTestSuite = async (configType) => {
    if (!user) {
      alert('Please sign in before starting a test run.');
      return;
    }

    if (currentTestRun) {
      console.log('❌ Test already running, ignoring new request');
      return;
    }

    console.log(`🚀 Starting test suite: ${configType}`);
    console.log(`📋 Test config:`, TEST_CONFIGS[configType]);

    try {
      await ensureSessionCookie(user);
      await executeRealTestSuite(configType, user.email ?? 'dashboard', (run) => {
        console.log('📈 Test run queued:', run);
        setCurrentTestRun(run);
      });

      alert('✅ Test run queued. Follow the live status below while GitHub Actions executes it.');
    } catch (error) {
      console.error('Test suite execution failed:', error);
      setCurrentTestRun(null);
      alert(`❌ Test suite execution failed: ${error.message}`);
    }
  };

  const stopCurrentRun = useCallback(async () => {
    if (!currentTestRun) return;
    if (isStoppingRun) return;

    const confirmStop = window.confirm(
      'Stop the current test run? This will cancel the GitHub Actions job and mark the run as cancelled.',
    );
    if (!confirmStop) return;

    try {
      setIsStoppingRun(true);
      const response = await fetch('/api/run-tests/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: currentTestRun.id,
          cancelledBy: user?.email ?? 'dashboard',
          reason: 'Cancelled from dashboard',
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || 'Failed to cancel run');
      }

      alert('🛑 Cancellation requested. GitHub Actions will halt shortly.');
    } catch (error) {
      console.error('Failed to cancel run', error);
      alert(`Failed to cancel run: ${error.message}`);
    } finally {
      setIsStoppingRun(false);
    }
  }, [currentTestRun, isStoppingRun, user]);

  const createCardFromIssue = async (issue) => {
    const issueId = issue.id;
    setCreatingCards((prev) => new Set([...prev, issueId]));

    try {
      const testRun = testHistory.find((run) => run.id === issue.testRunId) || {
        config: 'unknown',
        startTime: issue.createdAt,
      };

      const result = await createSteaCardFromIssue(issue, testRun);

      if (result.success) {
        if (issue.id) {
          await updateDoc(doc(db, 'automated_test_issues', issue.id), {
            cardCreated: true,
            cardCreatedAt: serverTimestamp(),
          });
        }
        alert('STEa card created successfully! 🎉');
      } else {
        alert(`Failed to create card: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating card:', error);
      alert('Failed to create STEa card');
    } finally {
      setCreatingCards((prev) => {
        const next = new Set(prev);
        next.delete(issueId);
        return next;
      });
    }
  };

  const getSuccessRate = () => {
    if (testHistory.length === 0) return 0;
    const latest = testHistory[0];
    return latest?.summary?.successRate || 0;
  };

  const getCriticalIssuesCount = () => {
    return testIssues.filter((issue) => issue.severity === 'critical').length;
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Current Test Run */}
      {currentTestRun && (
        <div className="card p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-6 h-6 border-2 border-blue-600 rounded-full ${
                currentTestRun.status === 'running'
                  ? 'border-t-transparent animate-spin'
                  : 'border-dashed'
              }`}
            ></div>
            <h3 className="text-lg font-semibold">
              {currentTestRun.status === 'running'
                ? 'Test Suite Running'
                : currentTestRun.status === 'queued'
                ? 'Test Suite Queued'
                : 'Active Test Suite'}
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{TEST_CONFIGS[currentTestRun.config]?.name}</span>
              <span>{currentTestRun.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentTestRun.progress ?? 0}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              Started: {toDate(currentTestRun.startTime)?.toLocaleTimeString?.() || '—'}
            </p>
            <p className="text-sm text-gray-600">
              Status: {currentTestRun.status?.toUpperCase?.() || 'QUEUED'}
            </p>
            {(currentTestRun.status === 'running' || currentTestRun.status === 'queued') && (
              <button
                onClick={stopCurrentRun}
                disabled={isStoppingRun}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-60"
              >
                {isStoppingRun ? 'Stopping…' : 'Stop Tests'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Run Test Suites</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(TEST_CONFIGS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => runTestSuite(key)}
              disabled={!!currentTestRun}
              className={`p-4 rounded-lg text-white transition-colors ${
                currentTestRun ? 'bg-gray-400 cursor-not-allowed' : `${config.color} ${config.hoverColor}`
              }`}
            >
              <div className="text-lg font-semibold">{config.name}</div>
              <div className="text-sm opacity-90">{config.description}</div>
              <div className="text-xs opacity-75 mt-1">{config.estimatedTime}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{getSuccessRate().toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{getCriticalIssuesCount()}</div>
          <div className="text-sm text-gray-600">Critical Issues</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{testHistory.length}</div>
          <div className="text-sm text-gray-600">Total Runs</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{testIssues.length}</div>
          <div className="text-sm text-gray-600">Open Issues</div>
        </div>
      </div>

      {/* Recent Test Runs */}
      {testHistory.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Test Runs</h3>
          <div className="space-y-3">
            {testHistory.slice(0, 5).map((run) => (
              <div key={run.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded border ${TEST_STATUS_COLORS[run.status]}`}>
                    {run.status?.toUpperCase?.()}
                  </span>
                  <span className="font-medium">{TEST_CONFIGS[run.config]?.name}</span>
                  <span className="text-sm text-gray-600">
                    {toDate(run.startTime)?.toLocaleString?.() || 'Unknown time'}
                  </span>
                </div>
                <div className="text-sm">
                  {run.summary && (
                    <span
                      className={(run.summary.successRate ?? 0) >= 90 ? 'text-green-600' : 'text-red-600'}
                    >
                      {run.summary.passed}/{run.summary.totalTests} passed (
                      {(run.summary.successRate ?? 0).toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Issues */}
      {testIssues.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Issues</h3>
          <div className="space-y-3">
            {testIssues.slice(0, 5).map((issue) => (
              <div key={issue.id} className="border rounded p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded border ${ISSUE_SEVERITY_COLORS[issue.severity]}`}
                    >
                      {issue.severity?.toUpperCase?.()}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded border ${
                        ISSUE_CATEGORY_COLORS[issue.category] ?? ISSUE_CATEGORY_COLORS.unknown
                      }`}
                    >
                      {issue.category?.toUpperCase?.()}
                    </span>
                  </div>
                  <button
                    onClick={() => createCardFromIssue(issue)}
                    disabled={creatingCards.has(issue.id) || issue.cardCreated}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                      issue.cardCreated
                        ? 'bg-green-50 text-green-600 border-green-200 cursor-not-allowed'
                        : creatingCards.has(issue.id)
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    {issue.cardCreated ? '✓ Card Created' : creatingCards.has(issue.id) ? 'Creating...' : '+ Create STEa Card'}
                  </button>
                </div>
                <h4 className="font-medium">{issue.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Test: {issue.testName} • {toDate(issue.createdAt)?.toLocaleString?.() || 'Unknown time'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Test Run History</h2>
      {testHistory.length === 0 ? (
        <div className="card p-6 text-center text-gray-500">
          No test runs yet. Run your first test suite to see history here.
        </div>
      ) : (
        <div className="space-y-4">
          {testHistory.map((run) => (
            <div key={run.id} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-sm rounded border ${TEST_STATUS_COLORS[run.status]}`}>
                    {run.status?.toUpperCase?.()}
                  </span>
                  <h3 className="text-lg font-semibold">{TEST_CONFIGS[run.config]?.name}</h3>
                </div>
                <div className="text-sm text-gray-600">
                  {toDate(run.startTime)?.toLocaleString?.() || 'Unknown time'}
                </div>
              </div>

              {run.summary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold">{run.summary.totalTests}</div>
                    <div className="text-xs text-gray-600">Total Tests</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">{run.summary.passed}</div>
                    <div className="text-xs text-gray-600">Passed</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600">{run.summary.failed}</div>
                    <div className="text-xs text-gray-600">Failed</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">
                      {(run.summary.successRate ?? 0).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">
                      {Math.round((run.summary.duration || 0) / 1000)}s
                    </div>
                    <div className="text-xs text-gray-600">Duration</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderIssues = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Test Issues</h2>
      {testIssues.length === 0 ? (
        <div className="card p-6 text-center text-gray-500">No issues found. Great job! 🎉</div>
      ) : (
        <div className="space-y-4">
          {testIssues.map((issue) => (
            <div key={issue.id} className="card p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded border ${ISSUE_SEVERITY_COLORS[issue.severity]}`}
                  >
                    {issue.severity?.toUpperCase?.()}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded border ${
                      ISSUE_CATEGORY_COLORS[issue.category] ?? ISSUE_CATEGORY_COLORS.unknown
                    }`}
                  >
                    {issue.category?.toUpperCase?.()}
                  </span>
                </div>
                <button
                  onClick={() => createCardFromIssue(issue)}
                  disabled={creatingCards.has(issue.id) || issue.cardCreated}
                  className={`px-4 py-2 text-sm rounded border transition-colors ${
                    issue.cardCreated
                      ? 'bg-green-50 text-green-600 border-green-200 cursor-not-allowed'
                      : creatingCards.has(issue.id)
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {issue.cardCreated ? '✓ Card Created' : creatingCards.has(issue.id) ? 'Creating Card...' : '+ Create STEa Card'}
                </button>
              </div>

              <h3 className="text-lg font-semibold mb-2">{issue.title}</h3>
              <p className="text-gray-700 mb-3">{issue.description}</p>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                <div className="text-sm font-medium text-blue-800">💡 Recommendation:</div>
                <div className="text-sm text-blue-700">{issue.recommendation}</div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Test: {issue.testName}</span>
                <span>{toDate(issue.createdAt)?.toLocaleString?.() || 'Unknown time'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!authReady) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20">
        <div className="card p-6 text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Checking authentication…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20">
        <div className="card p-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Sign in to run automated tests</h1>
          <p className="text-sm text-gray-600">
            Connect with your Google account to access the STEa automated testing dashboard and trigger real Jest runs.
          </p>
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {signingIn ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Signing in…
              </>
            ) : (
              <>
                <span>Continue with Google</span>
              </>
            )}
          </button>
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
          <div className="font-extrabold text-blue-600">🧪 Automated Testing Dashboard</div>
          <div className="text-muted text-sm">
            Monitor automated test runs, track issues, and create STEa cards
          </div>
          <p className="mt-2 text-sm text-neutral-700">
            This dashboard provides real-time visibility into automated test execution, performance
            metrics, and issue tracking with direct integration to your STEa board.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="text-gray-600">
          Signed in as <span className="font-medium text-gray-900">{user?.email ?? 'unknown'}</span>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-60"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      {/* Debug Section */}
      <div className="mt-4 card p-4 bg-yellow-50 border-yellow-200">
        <h3 className="text-sm font-semibold mb-2 text-yellow-800">🔧 Debug Tools</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={async () => {
              try {
                const testId = 'test-connection-check';
                const response = await fetch(`/api/test-progress/${testId}`);
                const text = await response.text();
                console.log('Progress route status:', response.status, 'body:', text);
                alert(`Progress route responded with ${response.status}`);
              } catch (e) {
                console.error(e);
                alert(`Error: ${e.message}`);
              }
            }}
            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded border border-yellow-300 hover:bg-yellow-200"
          >
            Test API Connection
          </button>

          <button
            onClick={() => {
              console.log('📊 Current test run:', currentTestRun);
              console.log('📋 Test history:', testHistory);
              console.log('🐛 Test issues:', testIssues);
              console.log('👤 User:', user);
            }}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded border border-blue-300 hover:bg-blue-200"
          >
            Log Debug Info
          </button>

          <button
            onClick={async () => {
              try {
                const testId = `debug-test-${Date.now()}`;
                const response = await fetch('/api/run-tests', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-vercel-background': '1',
                  },
                  body: JSON.stringify({ configType: 'quick', testRunId: testId }),
                });
                const txt = await response.text();
                console.log('run-tests status:', response.status, 'body:', txt);
                alert(`Run-tests responded with ${response.status}`);
              } catch (e) {
                console.error(e);
                alert(`Error: ${e.message}`);
              }
            }}
            className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded border border-green-300 hover:bg-green-200"
          >
            Test Run-Tests API
          </button>

          <button
            onClick={() => {
              console.log('🌐 Environment Info:', {
                href: window.location.href,
                origin: window.location.origin,
                pathname: window.location.pathname,
                ua: navigator.userAgent,
                at: new Date().toISOString(),
              });
              alert('Environment info logged to console');
            }}
            className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded border border-purple-300 hover:bg-purple-200"
          >
            Log Environment
          </button>
        </div>
        <div className="mt-2 text-xs text-yellow-700">
          Use these tools to debug API connectivity and test execution issues. Check browser console
          for detailed logs.
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'history', label: 'History' },
            { id: 'issues', label: `Issues (${testIssues.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {selectedTab === 'dashboard' && renderDashboard()}
        {selectedTab === 'history' && renderHistory()}
        {selectedTab === 'issues' && renderIssues()}
      </div>

      {/* Footer */}
      <div className="mt-8 card p-4 text-center text-sm text-gray-600">
        <p>
          Automated testing dashboard for Tou.me development team. Issues automatically sync to{' '}
          <a href="/apps/stea/board" className="text-blue-600 hover:underline">
            STEa board
          </a>
          .
        </p>
      </div>
    </main>
  );
}
