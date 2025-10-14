'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function TouMeTestersOnly() {
  const [testResults, setTestResults] = useState({});
  const [feedback, setFeedback] = useState('');
  const [testerName, setTesterName] = useState('');
  const [currentBuild, setCurrentBuild] = useState('');
  const [platform, setPlatform] = useState('');

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
  }, []);

  // Save results to localStorage
  const saveResults = (newResults) => {
    setTestResults(newResults);
    localStorage.setItem('toume-test-results', JSON.stringify(newResults));
  };

  const saveTesterInfo = () => {
    localStorage.setItem('toume-tester-name', testerName);
  };

  const updateTestResult = (testId, status, notes = '') => {
    const newResults = {
      ...testResults,
      [testId]: {
        status,
        notes,
        timestamp: new Date().toISOString(),
        tester: testerName,
        build: currentBuild,
        platform
      }
    };
    saveResults(newResults);
  };

  const getPassRate = () => {
    const total = testCases.length;
    const passed = Object.values(testResults).filter(r => r.status === 'pass').length;
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  };

  const getCriticalPassRate = () => {
    const criticalTests = testCases.filter(t => t.priority === 'CRITICAL');
    const criticalPassed = criticalTests.filter(t => 
      testResults[t.id]?.status === 'pass'
    ).length;
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
        passed: Object.values(testResults).filter(r => r.status === 'pass').length,
        failed: Object.values(testResults).filter(r => r.status === 'fail').length,
        skipped: Object.values(testResults).filter(r => r.status === 'skip').length
      }
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toume-test-results-${testerName}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const testCases = [
    {
      id: 'TC-001',
      name: 'Complete User Onboarding Flow',
      priority: 'CRITICAL',
      time: '5 min',
      description: 'Sign in → Create circle → Add child → Create event → Complete tour'
    },
    {
      id: 'TC-002',
      name: 'Circle Creation and Member Invitation',
      priority: 'CRITICAL',
      time: '3 min',
      description: 'Create circle → Invite member → Accept invitation'
    },
    {
      id: 'TC-003',
      name: 'Event Creation with Privacy Controls',
      priority: 'CRITICAL',
      time: '3 min',
      description: 'Create event → Set privacy to Private → Verify visibility'
    },
    {
      id: 'TC-004',
      name: 'Google Calendar Connection',
      priority: 'CRITICAL',
      time: '4 min',
      description: 'Connect Google Calendar → Import events → Add overlay metadata'
    },
    {
      id: 'TC-005',
      name: 'Handover Creation and Completion',
      priority: 'CRITICAL',
      time: '4 min',
      description: 'Create handover → Add checklist → Attach inventory → Complete → Verify location update'
    },
    {
      id: 'TC-006',
      name: 'Gift Reservation System',
      priority: 'CRITICAL',
      time: '3 min',
      description: 'Add gift → Reserve as User A → Verify User B cannot reserve'
    },
    {
      id: 'TC-007',
      name: 'Real-Time Multi-User Updates',
      priority: 'HIGH',
      time: '4 min',
      description: 'Two users edit same data → Verify real-time sync'
    },
    {
      id: 'TC-008',
      name: 'App Store Reviewer Access',
      priority: 'CRITICAL',
      time: '2 min',
      description: 'Tap logo 7 times → Verify demo mode → Test features'
    },
    {
      id: 'TC-009',
      name: 'Inventory Location Tracking',
      priority: 'HIGH',
      time: '3 min',
      description: 'Add item → Create handover → Complete → Verify location update'
    },
    {
      id: 'TC-010',
      name: 'Calendar Conflict Detection',
      priority: 'HIGH',
      time: '3 min',
      description: 'Create overlapping events → Verify conflict badge → Check suggestions'
    },
    {
      id: 'TC-011',
      name: 'Permission Enforcement',
      priority: 'HIGH',
      time: '3 min',
      description: 'Sign in as Trusted Adult → Verify blocked actions'
    },
    {
      id: 'TC-012',
      name: 'Data Deletion Compliance',
      priority: 'CRITICAL',
      time: '3 min',
      description: 'Create test account → Delete account → Verify complete removal'
    },
    {
      id: 'TC-013',
      name: 'Large Circle Performance',
      priority: 'MEDIUM',
      time: '4 min',
      description: 'Test with 8+ members, 50+ events → Measure response times'
    },
    {
      id: 'TC-014',
      name: 'Offline/Online Synchronization',
      priority: 'HIGH',
      time: '4 min',
      description: 'Edit offline → Reconnect → Verify sync'
    },
    {
      id: 'TC-015',
      name: 'File Upload Security',
      priority: 'HIGH',
      time: '3 min',
      description: 'Test file size limits → Type validation → Security checks'
    },
    {
      id: 'TC-016',
      name: 'App Crash Prevention',
      priority: 'HIGH',
      time: '5 min',
      description: 'Rapid navigation → Invalid data → Network errors → Monitor crashes'
    },
    {
      id: 'TC-017',
      name: 'Onboarding Completion Rate',
      priority: 'MEDIUM',
      time: '6 min',
      description: 'Fresh install → Complete onboarding → Note confusing steps'
    },
    {
      id: 'TC-018',
      name: 'Calendar Confusion Prevention',
      priority: 'HIGH',
      time: '4 min',
      description: 'Connect Google Calendar → Verify clear distinction between calendar types'
    },
    {
      id: 'TC-019',
      name: 'Accessibility Basics',
      priority: 'MEDIUM',
      time: '4 min',
      description: 'Enable screen reader → Test navigation → Check contrast'
    },
    {
      id: 'TC-020',
      name: 'Cross-Platform Consistency',
      priority: 'MEDIUM',
      time: '5 min',
      description: 'Compare iOS/Android → Check feature parity → Performance'
    }
  ];

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
            report issues, and provide feedback. Results are saved locally and can be exported.
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
            <button
              onClick={exportResults}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Export Results
            </button>
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
              {Object.values(testResults).filter(r => r.status === 'pass').length}
            </div>
            <div className="text-sm text-green-800">Tests Passed</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {Object.values(testResults).filter(r => r.status === 'fail').length}
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
            const priorityColors = {
              CRITICAL: 'bg-red-100 text-red-800 border-red-200',
              HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
              MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200'
            };

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
                      onClick={() => updateTestResult(test.id, 'pass')}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        result?.status === 'pass' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                      }`}
                    >
                      ✓ Pass
                    </button>
                    <button
                      onClick={() => updateTestResult(test.id, 'fail')}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        result?.status === 'fail' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                      }`}
                    >
                      ✗ Fail
                    </button>
                    <button
                      onClick={() => updateTestResult(test.id, 'skip')}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        result?.status === 'skip' 
                          ? 'bg-yellow-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-yellow-100'
                      }`}
                    >
                      ⏭ Skip
                    </button>
                  </div>
                </div>

                {result && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Status: <strong className="capitalize">{result.status}</strong></span>
                      <span>{new Date(result.timestamp).toLocaleString()}</span>
                    </div>
                    <textarea
                      placeholder="Add notes about this test (issues found, observations, etc.)"
                      value={result.notes || ''}
                      onChange={(e) => updateTestResult(test.id, result.status, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none"
                      rows="2"
                    />
                  </div>
                )}
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
          rows="6"
        />
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Feedback is saved locally. Use "Export Results" to share with the team.
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
          This testing portal is for internal use only. Results are stored locally in your browser.
          <br />
          Questions? Contact the development team or check the{' '}
          <Link href="/apps/toume" className="text-blue-600 hover:underline">
            main Tou.me page
          </Link>.
        </p>
      </section>
    </main>
  );
}
