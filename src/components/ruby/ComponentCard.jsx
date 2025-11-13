'use client';

export default function ComponentCard({ component, viewMode, onSelect, onOpenInFigma, onShowTokens }) {
  const hasTokens = component.tokens && (
    (component.tokens.colors && component.tokens.colors.length > 0) ||
    (component.tokens.typography && component.tokens.typography.length > 0) ||
    (component.tokens.spacing && component.tokens.spacing.length > 0)
  );

  const variantCount = component.variants?.length || 0;

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
            {component.thumbnailUrl ? (
              <img
                src={component.thumbnailUrl}
                alt={component.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {component.name}
                </h3>
                {component.description && (
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {component.description}
                  </p>
                )}
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    component.type === 'COMPONENT'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {component.type === 'COMPONENT' ? 'Component' : 'Component Set'}
                  </span>
                  {variantCount > 0 && (
                    <span className="text-xs text-gray-500">
                      {variantCount} {variantCount === 1 ? 'variant' : 'variants'}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                {hasTokens && (
                  <button
                    onClick={onShowTokens}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="View design tokens"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={onOpenInFigma}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Open in Figma"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19L18.9999 6.413L11.2071 14.2071L9.79289 12.7929L17.5849 5H13V3H21Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
      {/* Thumbnail */}
      <div className="aspect-square bg-gray-100 relative">
        {component.thumbnailUrl ? (
          <img
            src={component.thumbnailUrl}
            alt={component.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
          {hasTokens && (
            <button
              onClick={onShowTokens}
              className="px-3 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Tokens
            </button>
          )}
          <button
            onClick={onOpenInFigma}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Open in Figma
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 truncate" title={component.name}>
          {component.name}
        </h3>
        {component.description && (
          <p className="mt-1 text-xs text-gray-600 line-clamp-2">
            {component.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            component.type === 'COMPONENT'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-purple-100 text-purple-800'
          }`}>
            {component.type === 'COMPONENT' ? 'Component' : 'Set'}
          </span>
          {variantCount > 0 && (
            <span className="text-xs text-gray-500">
              {variantCount} {variantCount === 1 ? 'variant' : 'variants'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
