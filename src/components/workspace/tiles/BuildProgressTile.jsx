'use client';

import Link from 'next/link';
import { TileContainer, TileHeader, formatRelativeTime } from './TileComponents';

export default function BuildProgressTile({ data }) {
  if (!data?.apps?.length) {
    return (
      <TileContainer gradient="from-blue-500/20 to-indigo-500/20" borderColor="border-blue-200">
        <TileHeader icon="📊" title="Build Progress" />
        <div className="text-sm text-neutral-500">No apps tracked</div>
      </TileContainer>
    );
  }

  // For now, show the first app. In future, could aggregate or show multiple
  const app = data.apps[0];

  return (
    <Link href={`/apps/stea/filo?app=${encodeURIComponent(app.name)}`}>
      <TileContainer
        gradient="from-blue-500/20 to-indigo-500/20"
        borderColor="border-blue-200"
        hoverable
      >
        <TileHeader icon="📊" title="Build Progress" />

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-neutral-900">{app.progress}%</span>
            <span className="text-xs text-neutral-600 truncate flex-shrink-0 max-w-[6rem]" title={app.name}>
              {app.name}
            </span>
          </div>

          <div className="space-y-1 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Epics</span>
              <span className="font-medium">
                {app.epicsComplete}/{app.epicsTotal}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Features</span>
              <span className="font-medium">
                {app.featuresInProgress}/{app.featuresTotal}
              </span>
            </div>
            {app.bugsOpen > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Bugs</span>
                <span className="font-medium">{app.bugsOpen}</span>
              </div>
            )}
          </div>

          <div className="text-xs text-neutral-500 pt-1 border-t border-neutral-200 whitespace-nowrap overflow-hidden text-ellipsis">
            Last activity: {formatRelativeTime(app.lastActivity)}
          </div>
        </div>
      </TileContainer>
    </Link>
  );
}
