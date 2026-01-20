'use client';

import Link from 'next/link';
import { TileContainer, TileHeader } from './TileComponents';

export default function TestingSnapshotTile({ data }) {
  if (!data) {
    return (
      <TileContainer gradient="from-emerald-500/20 to-green-500/20" borderColor="border-emerald-200">
        <TileHeader icon="🧪" title="Testing Snapshot" />
        <div className="text-sm text-neutral-500">No test data</div>
      </TileContainer>
    );
  }

  const totalTests = data.pass + data.fail + data.awaitingRetest;
  const passRate = totalTests > 0 ? Math.round((data.pass / totalTests) * 100) : 0;

  return (
    <Link href="/apps/stea/hans?filter=failing">
      <TileContainer
        gradient="from-emerald-500/20 to-green-500/20"
        borderColor="border-emerald-200"
        hoverable
      >
        <TileHeader icon="🧪" title="Testing Snapshot" />

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-neutral-900">{passRate}%</span>
            <span className="text-xs text-neutral-600">pass rate</span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-emerald-700">
              <span>Pass</span>
              <span className="font-medium">{data.pass}</span>
            </div>
            {data.fail > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Fail</span>
                <span className="font-medium">{data.fail}</span>
              </div>
            )}
            {data.awaitingRetest > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Awaiting Retest</span>
                <span className="font-medium">{data.awaitingRetest}</span>
              </div>
            )}
          </div>

          <div className="text-xs text-neutral-600 pt-1 border-t border-neutral-200 flex justify-between">
            <span>Coverage</span>
            <span className="font-medium">{data.coverage}%</span>
          </div>
        </div>
      </TileContainer>
    </Link>
  );
}
