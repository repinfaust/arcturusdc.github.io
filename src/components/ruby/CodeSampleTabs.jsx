'use client';

import { useState } from 'react';

export default function CodeSampleTabs({ codeSamples }) {
  const [activeLanguage, setActiveLanguage] = useState('curl');

  if (!codeSamples) {
    return (
      <div className="text-sm text-gray-500 italic">
        No code samples available
      </div>
    );
  }

  const languages = [
    { key: 'curl', label: 'cURL', icon: '💻' },
    { key: 'javascript', label: 'JavaScript', icon: '🟨' },
    { key: 'typescript', label: 'TypeScript', icon: '🔷' },
  ];

  const availableLanguages = languages.filter(lang => codeSamples[lang.key]);

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Language Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200">
        {availableLanguages.map(lang => (
          <button
            key={lang.key}
            onClick={() => setActiveLanguage(lang.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeLanguage === lang.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-2">{lang.icon}</span>
            {lang.label}
          </button>
        ))}
      </div>

      {/* Code Display */}
      <div className="relative">
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => copyToClipboard(codeSamples[activeLanguage])}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded transition-colors flex items-center space-x-1"
            title="Copy to clipboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Copy</span>
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <pre className="p-4 overflow-x-auto text-sm">
            <code className={`language-${activeLanguage} text-gray-100`}>
              {codeSamples[activeLanguage]}
            </code>
          </pre>
        </div>
      </div>

      {/* Usage Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <span className="font-semibold">💡 Tip:</span> Replace placeholder values (e.g., <code className="bg-blue-100 px-1 rounded">&lt;token&gt;</code>) with actual values before running.
        </p>
      </div>
    </div>
  );
}
