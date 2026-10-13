import { NextResponse } from 'next/server';
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import '@/lib/lemonsqueezy';

export async function POST(req: Request) {
  try {
    const { variantId } = await req.json();

    if (!variantId) {
      return NextResponse.json({ error: 'Missing variantId' }, { status: 400 });
    }

    const checkout = await createCheckout(
      process.env.LEMON_SQUEEZY_STORE_ID || '',
      variantId,
      {
        checkoutData: {
          custom: {
            // Put custom parameters here if needed
          },
        },
        productOptions: {
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
        },
      }
    );

    return NextResponse.json({ url: checkout.data?.data.attributes.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
