import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db/store';
import { getSession } from '@/lib/auth/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const updates = await request.json();
    const updated = store.updatePartnerPreferences(id, updates);
    return NextResponse.json({ success: true, preferences: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update preferences failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
