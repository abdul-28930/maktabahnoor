import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

// Initializes mn_stock:book:<slug> counter keys from mn_books_meta stockCount.
// Run this once from admin to fix books that predate the counter system.
export async function POST(req) {
  try {
    const { password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const meta = await redis.get('mn_books_meta') || [];
    let synced = 0;
    for (const b of meta) {
      const key = `mn_stock:book:${b.slug}`;
      const existing = await redis.get(key);
      // Only initialize if key doesn't exist — don't overwrite live counters
      if (existing === null || existing === undefined) {
        const sc = b.stockCount ?? (b.inStock ? 1 : 0);
        await redis.set(key, Number(sc));
        synced++;
      }
    }
    return NextResponse.json({ success: true, synced, total: meta.length });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Failed.' }, { status: 500 });
  }
}
