'use client';

import { useState } from 'react';
import CodeSampleTabs from './CodeSampleTabs';

export default function EndpointCard({ endpoint, expanded, onToggle, getMethodColor }) {
  const [activeTab, setActiveTab] = useState('request');

  const hasParameters = endpoint.parameters && endpoint.parameters.length > 0;
  const hasRequestBody = !!endpoint.requestBody;
  const hasResponses = endpoint.responses && endpoint.responses.length > 0;
  const hasSecurity = endpoint.security && endpoint.security.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-4 flex-1">
          <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getMethodColor(endpoint.method)}`}>
            {endpoint.method}
          </span>
          <span className="font-mono text-sm text-gray-900 font-medium">
            {endpoint.path}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {endpoint.summary && (
            <span className="text-sm text-gray-600 hidden md:block">
              {endpoint.summary}
            </span>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-200">
          {/* Summary & Description */}
          <div className="px-6 py-4 bg-gray-50">
            {endpoint.summary && (
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {endpoint.summary}
              </h3>
            )}
            {endpoint.description && (
              <p className="text-gray-600">{endpoint.description}</p>
            )}
            {endpoint.tags && endpoint.tags.length > 0 && (
              <div className="mt-3 flex items-center space-x-2">
                {endpoint.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-1 px-6">
              {['request', 'responses', 'code'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'request' && 'Request'}
                  {tab === 'responses' && 'Responses'}
                  {tab === 'code' && 'Code Samples'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-4">
            {/* Request Tab */}
            {activeTab === 'request' && (
              <div className="space-y-6">
                {/* Security */}
                {hasSecurity && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Authentication</h4>
                    <div className="space-y-2">
                      {endpoint.security.map((sec, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-mono">
                            {sec.type}
                          </span>
                          <span className="text-gray-600">{sec.name}</span>
                          {sec.in && <span className="text-gray-400">({sec.in})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parameters */}
                {hasParameters && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Parameters</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">In</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {endpoint.parameters.map((param, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-sm font-mono text-gray-900">{param.name}</td>
                              <td className="px-3 py-2 text-sm">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {param.in}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-sm font-mono text-gray-600">
                                {param.schema?.type || 'string'}
                              </td>
                              <td className="px-3 py-2 text-sm">
                                {param.required ? (
                                  <span className="text-red-600 font-medium">Yes</span>
                                ) : (
                                  <span className="text-gray-400">No</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600">
                                {param.description || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Request Body */}
                {hasRequestBody && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Request Body
                      {endpoint.requestBody.required && (
                        <span className="ml-2 text-red-600 text-xs font-normal">(required)</span>
                      )}
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Content-Type: <span className="font-mono">{endpoint.requestBody.contentType}</span>
                      </p>
                      {endpoint.requestBody.schema && (
                        <pre className="text-xs font-mono text-gray-800 overflow-x-auto">
                          {JSON.stringify(endpoint.requestBody.schema, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {!hasParameters && !hasRequestBody && !hasSecurity && (
                  <p className="text-sm text-gray-500 italic">No request parameters or body</p>
                )}
              </div>
            )}

            {/* Responses Tab */}
            {activeTab === 'responses' && (
              <div className="space-y-4">
                {hasResponses ? (
                  endpoint.responses.map((response, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded text-sm font-bold ${
                            response.statusCode.startsWith('2')
                              ? 'bg-green-100 text-green-800'
                              : response.statusCode.startsWith('4')
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {response.statusCode}
                          </span>
                          <span className="text-sm text-gray-600">{response.description}</span>
                        </div>
                        {response.contentType && (
                          <span className="text-xs font-mono text-gray-500">
                            {response.contentType}
                          </span>
                        )}
                      </div>
                      {response.schema && (
                        <div className="p-4 bg-white">
                          <pre className="text-xs font-mono text-gray-800 overflow-x-auto">
                            {JSON.stringify(response.schema, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No response documentation available</p>
                )}
              </div>
            )}

            {/* Code Samples Tab */}
            {activeTab === 'code' && (
              <CodeSampleTabs codeSamples={endpoint.codeSamples} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
