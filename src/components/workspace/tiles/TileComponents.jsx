export function TileContainer({ children, gradient, borderColor, hoverable }) {
  const baseClasses = `
    block p-4 min-h-[10rem] rounded-2xl border-2 bg-gradient-to-br
    transition-all duration-200 overflow-hidden
    ${gradient} ${borderColor}
  `;

  const hoverClasses = hoverable
    ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer'
    : '';

  return (
    <div className={`${baseClasses} ${hoverClasses}`}>
      {children}
    </div>
  );
}

export function TileHeader({ icon, title }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
      <span className="text-lg">{icon}</span>
    </div>
  );
}

export function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
