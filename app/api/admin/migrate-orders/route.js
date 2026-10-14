import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const map = await redis.hgetall('mn_orders');
    if (!map || Object.keys(map).length === 0)
      return NextResponse.json({ migrated: 0, message: 'No orders found in old hash.' });

    let migrated = 0;
    for (const [ref, val] of Object.entries(map)) {
      const record = typeof val === 'string' ? JSON.parse(val) : val;
      await redis.set(`mn_order:${ref}`, record);
      migrated++;
    }

    return NextResponse.json({ migrated, message: `Successfully migrated ${migrated} order(s).` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Migration failed.', detail: e.message }, { status: 500 });
  }
}
