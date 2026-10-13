import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db/store';
import { getSession } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const customer = store.getCustomerById(id);

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const preferences = store.getPartnerPreferences(id);
  const notes = store.getCustomerNotes(id);
  const introductions = store.getIntroductions(id);

  return NextResponse.json({
    customer,
    preferences,
    notes,
    introductions,
  });
}

export async function PATCH(
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
    const updated = store.updateCustomer(id, updates);

    if (!updated) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
