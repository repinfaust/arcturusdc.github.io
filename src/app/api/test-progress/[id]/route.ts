// src/app/api/test-progress/[id]/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(_req, { params }) {
  try {
    const { id } = params;
    const ref = doc(db, 'test_progress', id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // Return a stable shape so the UI doesn’t choke while the run warms up
      return NextResponse.json({
        id,
        status: 'pending',
        percent: 0,
        counts: { total: 0, passed: 0, failed: 0, running: 0 },
        lastLine: '',
      });
    }

    return NextResponse.json(snap.data());
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to load progress', details: String(err?.message || err) },
      { status: 500 },
    );
  }
}
