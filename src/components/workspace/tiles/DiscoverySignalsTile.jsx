'use client';

import Link from 'next/link';
import { TileContainer, TileHeader } from './TileComponents';

export default function DiscoverySignalsTile({ data }) {
  if (!data) {
    return (
      <TileContainer gradient="from-amber-500/20 to-orange-500/20" borderColor="border-amber-200">
        <TileHeader icon="🔍" title="Discovery Signals" />
        <div className="text-sm text-neutral-500">No discovery data</div>
      </TileContainer>
    );
  }

  return (
    <Link href="/apps/stea/harls">
      <TileContainer
        gradient="from-amber-500/20 to-orange-500/20"
        borderColor="border-amber-200"
        hoverable
      >
        <TileHeader icon="🔍" title="Discovery Signals" />

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-neutral-900">{data.coverage}%</span>
            <span className="text-xs text-neutral-600">coverage</span>
          </div>

          <div className="space-y-1 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>New Notes</span>
              <span className="font-medium">{data.newNotes}</span>
            </div>
            {data.jtbdDrafts > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>JTBD Drafts</span>
                <span className="font-medium">{data.jtbdDrafts}</span>
              </div>
            )}
          </div>

          <div className="text-xs text-neutral-500 pt-1 border-t border-neutral-200">
            {data.jtbdDrafts > 0
              ? `${data.jtbdDrafts} draft${data.jtbdDrafts > 1 ? 's' : ''} not promoted`
              : 'All drafts promoted'}
          </div>
        </div>
      </TileContainer>
    </Link>
  );
}
