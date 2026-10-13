import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

lemonSqueezySetup({
  apiKey: process.env.LEMON_SQUEEZY_API_KEY || '',
  onError: (error) => console.error("Lemon Squeezy Error:", error),
});
