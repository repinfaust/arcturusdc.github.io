'use client';

import Link from 'next/link';
import { TileContainer, TileHeader } from './TileComponents';

export default function DocumentationActivityTile({ data }) {
  if (!data) {
    return (
      <TileContainer gradient="from-rose-500/20 to-pink-500/20" borderColor="border-rose-200">
        <TileHeader icon="📚" title="Documentation" />
        <div className="text-sm text-neutral-500">No doc data</div>
      </TileContainer>
    );
  }

  return (
    <Link href="/apps/stea/ruby?filter=recent">
      <TileContainer
        gradient="from-rose-500/20 to-pink-500/20"
        borderColor="border-rose-200"
        hoverable
      >
        <TileHeader icon="📚" title="Documentation" />

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-neutral-900">{data.linkedPercentage}%</span>
            <span className="text-xs text-neutral-600">linked</span>
          </div>

          <div className="space-y-1 text-xs text-neutral-600">
            {data.newDocs > 0 && (
              <div className="flex justify-between">
                <span>New Docs</span>
                <span className="font-medium">{data.newDocs}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Updated This Week</span>
              <span className="font-medium">{data.updatedThisWeek}</span>
            </div>
          </div>

          <div className="text-xs text-neutral-500 pt-1 border-t border-neutral-200">
            {data.linkedPercentage >= 90
              ? 'Excellent linkage'
              : `${100 - data.linkedPercentage}% need linking`}
          </div>
        </div>
      </TileContainer>
    </Link>
  );
}
