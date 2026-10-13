import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { store } from '@/lib/db/store';
import { getSession } from '@/lib/auth/session';

const SendMatchSchema = z.object({
  candidateId: z.string(),
  matchRecommendationId: z.string().optional(),
  customMessage: z.string().min(10, 'Introduction message must be at least 10 characters.'),
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
  const customer = store.getCustomerById(id);

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = SendMatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid payload' },
        { status: 400 }
      );
    }

    const { candidateId, matchRecommendationId, customMessage } = parsed.data;

    const introduction = store.sendMatchIntroduction({
      customerId: id,
      candidateId,
      matchRecommendationId,
      customMessage,
      sentByMatchmakerId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Match introduction recorded and sent successfully.',
      introduction,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send match';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
