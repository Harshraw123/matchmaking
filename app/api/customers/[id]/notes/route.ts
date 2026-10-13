import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { store } from '@/lib/db/store';
import { getSession } from '@/lib/auth/session';

const NoteSchema = z.object({
  noteText: z.string().min(3),
  category: z.enum(['Call', 'Meeting', 'Follow-up', 'General']).default('General'),
  nextFollowUpDate: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = NoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Note text is required.' }, { status: 400 });
    }

    const newNote = store.addCustomerNote({
      customerId: id,
      matchmakerId: session.user.id,
      matchmakerName: session.user.name,
      noteText: parsed.data.noteText,
      category: parsed.data.category,
      nextFollowUpDate: parsed.data.nextFollowUpDate,
    });

    return NextResponse.json({ success: true, note: newNote });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
