import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const password = searchParams.get('password');
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const index = await redis.get('mn_orders_index') || [];
    const map   = await redis.hgetall('mn_orders') || {};
    const orders = index.map(ref => map[ref]).filter(Boolean);
    return NextResponse.json({ orders });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ orders: [] });
  }
}

export async function PUT(req) {
  try {
    const { password, orderRef, fulfilled } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const map = await redis.hgetall('mn_orders') || {};
    const existing = map[orderRef];
    if (!existing) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    const updated = { ...existing, fulfilled: !!fulfilled };
    await redis.hset('mn_orders', { [orderRef]: updated });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { password, orderRef } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    await redis.hdel('mn_orders', orderRef);
    const index = await redis.get('mn_orders_index') || [];
    await redis.set('mn_orders_index', index.filter(r => r !== orderRef));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
