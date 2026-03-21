import { NextResponse } from 'next/server';
import { UC_DEFINITIONS } from '@/lib/sorr/controlui';
import { ensureSeedData, getDashboardPayload, getSorrDb, upsertSorrUser, verifySorrSession } from '@/lib/sorr/controlui-server';

export async function GET(request) {
  const auth = await verifySorrSession(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { db } = await getSorrDb();
    await ensureSeedData(db);
    await upsertSorrUser(db, auth.user);
    const payload = await getDashboardPayload(db);

    return NextResponse.json(
      {
        ...payload,
        useCases: UC_DEFINITIONS,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SoRR Control bootstrap] failed', error);
    return NextResponse.json({ error: 'Failed to load SoRR Control data.' }, { status: 500 });
  }
}
