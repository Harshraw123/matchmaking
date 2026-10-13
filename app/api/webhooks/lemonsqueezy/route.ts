import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  const body = await req.text();
  const hmac = crypto.createHmac('sha256', process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '');
  const digest = Buffer.from(hmac.update(body).digest('hex'), 'utf8');
  const signature = Buffer.from(req.headers.get('x-signature') || '', 'utf8');

  if (signature.length !== digest.length || !crypto.timingSafeEqual(digest, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const eventName = payload.meta.event_name;

  if (eventName === 'order_created') {
    // Fulfill order in database
    console.log(`Lemon Squeezy Order Created: ${payload.data.id}`);
  }

  return NextResponse.json({ received: true });
}
