// src/app/api/test-results/[id]/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(_req, { params }) {
  try {
    const { id } = params;
    const ref = doc(db, 'test_results', id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json(
        { error: 'Results not found', id },
        { status: 404 },
      );
    }

    return NextResponse.json(snap.data());
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to load results', details: String(err?.message || err) },
      { status: 500 },
    );
  }
}
