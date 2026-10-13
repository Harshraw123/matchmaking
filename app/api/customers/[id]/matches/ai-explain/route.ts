import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { store } from '@/lib/db/store';
import { getSession } from '@/lib/auth/session';
import { generateAiMatchInsights } from '@/lib/ai/openai';
import { scoreCandidate } from '@/lib/matching/scoring';

const AiExplainSchema = z.object({
  candidateId: z.string(),
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
    const parsed = AiExplainSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'candidateId is required' }, { status: 400 });
    }

    const candidate = store.getCustomerById(parsed.data.candidateId);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const customerPrefs = store.getPartnerPreferences(id) || undefined;
    const candidatePrefs = store.getPartnerPreferences(candidate.id) || undefined;

    const scored = scoreCandidate(customer, customerPrefs, candidate, candidatePrefs);

    const insights = await generateAiMatchInsights(
      customer,
      candidate,
      scored.overallScore,
      scored.scoreCoverage,
      scored.factorScores,
      scored.strengths,
      scored.potentialConflicts,
      scored.unknowns
    );

    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI explanation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
