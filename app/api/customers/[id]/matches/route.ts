import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db/store';
import { getSession } from '@/lib/auth/session';
import { rankCandidates, SortCriteria } from '@/lib/matching/ranking';

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

  const { searchParams } = new URL(request.url);
  const sort = (searchParams.get('sort') as SortCriteria) || 'overall';
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true';

  const customerPrefs = store.getPartnerPreferences(id) || undefined;
  const allCustomersData = store.getAllCustomers({ pageSize: 500 }).customers;
  const allPrefsMap = store.getAllPreferencesMap();
  const alreadyIntroducedIds = store.getAllIntroducedCandidateIds(id);

  // Filter pool: opposite gender and not self
  const candidatesPool = allCustomersData.filter(
    c => c.id !== customer.id && c.gender !== customer.gender
  );

  const ranked = rankCandidates(
    customer,
    customerPrefs,
    candidatesPool,
    allPrefsMap,
    {
      sort,
      verifiedOnly,
      alreadyIntroducedIds,
    }
  );

  store.saveMatchRecommendations(id, ranked);

  return NextResponse.json({
    customer,
    matches: ranked,
    total: ranked.length,
  });
}
