'use client';

import Link from 'next/link';
import { TileContainer, TileHeader } from './TileComponents';

export default function BacklogHealthTile({ data }) {
  if (!data) {
    return (
      <TileContainer gradient="from-violet-500/20 to-purple-500/20" borderColor="border-violet-200">
        <TileHeader icon="📋" title="Backlog Health" />
        <div className="text-sm text-neutral-500">No backlog data</div>
      </TileContainer>
    );
  }

  return (
    <Link href="/apps/stea/filo?filter=blocked">
      <TileContainer
        gradient="from-violet-500/20 to-purple-500/20"
        borderColor="border-violet-200"
        hoverable
      >
        <TileHeader icon="📋" title="Backlog Health" />

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-neutral-900">{data.cycleTime}</span>
            <span className="text-xs text-neutral-600">days avg</span>
          </div>

          <div className="space-y-1 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Ready</span>
              <span className="font-medium">{data.ready}</span>
            </div>
            <div className="flex justify-between">
              <span>In Development</span>
              <span className="font-medium">{data.inDevelopment}</span>
            </div>
            {data.blocked > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Blocked</span>
                <span className="font-medium">{data.blocked}</span>
              </div>
            )}
            {data.bugsOpen > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Bugs</span>
                <span className="font-medium">{data.bugsOpen}</span>
              </div>
            )}
          </div>
        </div>
      </TileContainer>
    </Link>
  );
}
