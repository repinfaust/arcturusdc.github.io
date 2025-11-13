'use client';

export default function DesignTokensPanel({ component, onClose }) {
  const tokens = component.tokens || {};
  const colors = tokens.colors || [];
  const typography = tokens.typography || [];
  const spacing = tokens.spacing || [];

  const hasTokens = colors.length > 0 || typography.length > 0 || spacing.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Design Tokens</h2>
              <p className="mt-1 text-sm text-gray-600">{component.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!hasTokens ? (
            <div className="text-center py-12">
              <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="mt-4 text-sm text-gray-600">
                No design tokens extracted for this component
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Token extraction is currently in beta
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Colors */}
              {colors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                    Colors
                  </h3>
                  <div className="space-y-2">
                    {colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded border border-gray-300 shadow-sm"
                            style={{ backgroundColor: color.value }}
                            title={color.value}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{color.name}</p>
                            <p className="text-xs text-gray-500">{color.type}</p>
                          </div>
                        </div>
                        <code className="text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                          {color.value}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Typography */}
              {typography.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                    Typography
                  </h3>
                  <div className="space-y-2">
                    {typography.map((typo, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <p className="text-sm font-medium text-gray-900 mb-2">{typo.name}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Font:</span>{' '}
                            <span className="text-gray-900 font-mono">{typo.fontFamily}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Size:</span>{' '}
                            <span className="text-gray-900 font-mono">{typo.fontSize}px</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Weight:</span>{' '}
                            <span className="text-gray-900 font-mono">{typo.fontWeight}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Line Height:</span>{' '}
                            <span className="text-gray-900 font-mono">{typo.lineHeight}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spacing */}
              {spacing.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                    Spacing
                  </h3>
                  <div className="space-y-2">
                    {spacing.map((space, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <p className="text-sm font-medium text-gray-900">{space.name}</p>
                        <code className="text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                          {space.value}px
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants */}
              {component.variants && component.variants.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                    Variants
                  </h3>
                  <div className="space-y-3">
                    {component.variants.map((variant, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-2">{variant.name}</p>
                        {variant.values && variant.values.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {variant.values.map((value, vidx) => (
                              <span
                                key={vidx}
                                className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700"
                              >
                                {value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => window.open(component.figmaUrl, '_blank')}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Open in Figma
          </button>
        </div>
      </div>
    </div>
  );
}
