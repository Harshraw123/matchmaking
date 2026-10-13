import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db/store';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const journeyStage = searchParams.get('journeyStage') || undefined;
  const city = searchParams.get('city') || undefined;
  const gender = searchParams.get('gender') || undefined;
  const maritalStatus = searchParams.get('maritalStatus') || undefined;
  const verificationStatus = searchParams.get('verificationStatus') || undefined;
  const sortBy = (searchParams.get('sortBy') as 'name' | 'age' | 'completeness' | 'lastContacted') || 'name';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);

  const result = store.getAllCustomers({
    search,
    journeyStage,
    city,
    gender,
    maritalStatus,
    verificationStatus,
    sortBy,
    sortOrder,
    page,
    pageSize,
  });

  const metrics = store.getOperationalMetrics();

  return NextResponse.json({
    ...result,
    metrics,
  });
}
