'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600 border-gray-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

export default function PublicTestPage() {
  const params = useParams();
  const token = params?.token;

  const [loading, setLoading] = useState(true);
  const [testCase, setTestCase] = useState(null);
  const [error, setError] = useState('');

  // Form state
  const [testerName, setTesterName] = useState('');
  const [testerEmail, setTesterEmail] = useState('');
  const [platform, setPlatform] = useState('');
  const [buildVersion, setBuildVersion] = useState('');
  const [criteriaResults, setCriteriaResults] = useState({});
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Load test case
  useEffect(() => {
    if (!token) return;

    const fetchTestCase = async () => {
      try {
        const response = await fetch(`/api/hans/getByToken?token=${token}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to load test case');
        }

        const data = await response.json();
        setTestCase(data.testCase);
      } catch (err) {
        console.error('Error loading test case:', err);
        setError(err.message || 'Failed to load test case');
      } finally {
        setLoading(false);
      }
    };

    fetchTestCase();
  }, [token]);

  const toggleCriteria = (index) => {
    setCriteriaResults(prev => ({
      ...prev,
      [index]: prev[index] === 'passed'
        ? 'failed'
        : prev[index] === 'failed'
          ? undefined
          : 'passed',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    // Validate: at least check some criteria or provide feedback
    const hasCriteriaResults = Object.keys(criteriaResults).length > 0;
    if (!hasCriteriaResults && !feedback.trim()) {
      alert('Please check at least one acceptance criteria or provide feedback.');
      return;
    }

    // Determine overall status
    const criteriaValues = Object.values(criteriaResults);
    const hasAnyFailed = criteriaValues.includes('failed');
    const overallStatus = hasAnyFailed ? 'failed' : 'passed';

    setSubmitting(true);

    try {
      const response = await fetch('/api/hans/submitResults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          testerName: testerName.trim() || 'Anonymous',
          testerEmail: testerEmail.trim() || null,
          platform: platform || null,
          buildVersion: buildVersion.trim() || null,
          criteriaResults: Object.entries(criteriaResults).map(([index, status]) => ({
            index: parseInt(index),
            status,
          })),
          overallStatus,
          feedback: feedback.trim() || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit results');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting results:', err);
      alert(err.message || 'Failed to submit results. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-4">
            <svg className="animate-spin h-6 w-6 text-neutral-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-neutral-600">Loading test case...</p>
        </div>
      </main>
    );
  }

  if (error || !testCase) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Test Case Not Found</h1>
          <p className="text-neutral-600 mb-6">
            {error || 'This test link may have expired or been removed.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
          >
            Go to Home
          </Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Thank You!</h1>
          <p className="text-neutral-600 mb-6">
            Your test results have been submitted successfully. The team will review your feedback.
          </p>
          <div className="text-sm text-neutral-500">
            You can close this page now.
          </div>
        </div>
      </main>
    );
  }

  const passedCount = Object.values(criteriaResults).filter(s => s === 'passed').length;
  const failedCount = Object.values(criteriaResults).filter(s => s === 'failed').length;
  const totalCriteria = testCase.acceptanceCriteria?.length || 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-gradient-to-br from-blue-50 to-indigo-100 flex-shrink-0">
              <span className="text-3xl">🧪</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {testCase.app}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${PRIORITY_COLORS[testCase.priority] || PRIORITY_COLORS.medium}`}>
                  {testCase.priority?.toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">{testCase.title}</h1>
              {testCase.description && (
                <p className="text-neutral-600">{testCase.description}</p>
              )}
              {(testCase.linkedEpicLabel || testCase.linkedFeatureLabel) && (
                <div className="flex items-center gap-2 mt-3 text-sm text-neutral-500">
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
          </div>
        </div>

        {/* Test Case Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* User Story */}
          {testCase.userStory && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-3">User Story</h2>
              <p className="text-neutral-700 bg-blue-50 border border-blue-200 rounded-lg p-4">
                {testCase.userStory}
              </p>
            </div>
          )}

          {/* Acceptance Criteria */}
          {testCase.acceptanceCriteria && testCase.acceptanceCriteria.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-neutral-900">Acceptance Criteria</h2>
                <div className="text-sm text-neutral-600">
                  <span className="text-green-600 font-medium">{passedCount} passed</span>
                  {' · '}
                  <span className="text-red-600 font-medium">{failedCount} failed</span>
                  {' · '}
                  <span className="text-neutral-500">{totalCriteria - passedCount - failedCount} unchecked</span>
                </div>
              </div>
              <div className="space-y-3">
                {testCase.acceptanceCriteria.map((criterion, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleCriteria(idx)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      criteriaResults[idx] === 'passed'
                        ? 'border-green-500 bg-green-50'
                        : criteriaResults[idx] === 'failed'
                          ? 'border-red-500 bg-red-50'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                        criteriaResults[idx] === 'passed'
                          ? 'border-green-600 bg-green-600 text-white'
                          : criteriaResults[idx] === 'failed'
                            ? 'border-red-600 bg-red-600 text-white'
                            : 'border-neutral-300 bg-white text-neutral-400'
                      }`}>
                        {criteriaResults[idx] === 'passed' ? '✓' : criteriaResults[idx] === 'failed' ? '✕' : '?'}
                      </div>
                      <span className={`flex-1 ${
                        criteriaResults[idx] === 'passed'
                          ? 'text-green-900'
                          : criteriaResults[idx] === 'failed'
                            ? 'text-red-900'
                            : 'text-neutral-700'
                      }`}>
                        {criterion}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-3">
                Click each item to mark as Passed ✓ or Failed ✕. Click again to toggle.
              </p>
            </div>
          )}

          {/* User Flow */}
          {testCase.userFlow && testCase.userFlow.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">User Flow</h2>
              <div className="space-y-3">
                {testCase.userFlow.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                    <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-neutral-700 pt-0.5">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">Submit Your Test Results</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Your Name <span className="text-neutral-400">(optional)</span>
              </label>
              <input
                type="text"
                value={testerName}
                onChange={(e) => setTesterName(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email <span className="text-neutral-400">(optional)</span>
              </label>
              <input
                type="email"
                value={testerEmail}
                onChange={(e) => setTesterEmail(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Platform <span className="text-neutral-400">(optional)</span>
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select platform</option>
                <option value="iOS">iOS</option>
                <option value="Android">Android</option>
                <option value="Web">Web</option>
                <option value="Desktop">Desktop</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Build/Version <span className="text-neutral-400">(optional)</span>
              </label>
              <input
                type="text"
                value={buildVersion}
                onChange={(e) => setBuildVersion(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 1.3.0"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Additional Feedback <span className="text-neutral-400">(optional)</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Share any additional observations, issues, or suggestions..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all ${
              submitting
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Test Results'
            )}
          </button>

          <p className="text-xs text-neutral-500 text-center mt-4">
            Your feedback helps improve the product. Thank you for testing!
          </p>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-neutral-600">
          <p>Powered by Hans Testing Suite</p>
        </div>
      </div>
    </main>
  );
}
