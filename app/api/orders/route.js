import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const password = searchParams.get('password');
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const index = await redis.get('mn_orders_index') || [];
    const fetched = await Promise.all(index.map(ref => redis.get(`mn_order:${ref}`)));
    let orders = fetched.filter(Boolean);

    // Auto-migrate from old hash format on first load after backup restore
    if (orders.length === 0) {
      const oldMap = await redis.hgetall('mn_orders');
      if (oldMap && Object.keys(oldMap).length > 0) {
        const entries = Object.entries(oldMap).map(([ref, val]) => [ref, typeof val === 'string' ? JSON.parse(val) : val]);
        await Promise.all(entries.map(([ref, record]) => redis.set(`mn_order:${ref}`, record)));
        orders = entries.map(([, record]) => record);
        // Rebuild index if it was also missing
        if (index.length === 0) {
          orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          await redis.set('mn_orders_index', orders.map(o => o.orderRef));
        }
      }
    }

    return NextResponse.json({ orders });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ orders: [] });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { password, orderRef, fulfilled, status, adminNote, note } = body;
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (!orderRef)
      return NextResponse.json({ error: 'Missing orderRef.' }, { status: 400 });

    const existing = await redis.get(`mn_order:${orderRef}`);
    if (!existing) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    const updated = { ...existing };

    if (status !== undefined) {
      updated.status = status;
      updated.fulfilled = (status === 'fulfilled');
    } else if (fulfilled !== undefined) {
      updated.fulfilled = !!fulfilled;
      updated.status = fulfilled ? 'fulfilled' : 'pending';
    }

    if (adminNote !== undefined) {
      updated.adminNote = typeof adminNote === 'string' ? adminNote.trim() : '';
    } else if (note !== undefined) {
      updated.adminNote = typeof note === 'string' ? note.trim() : '';
    }

    await redis.set(`mn_order:${orderRef}`, updated);
    return NextResponse.json({ success: true, order: updated });
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
    await redis.del(`mn_order:${orderRef}`);
    const index = await redis.get('mn_orders_index') || [];
    await redis.set('mn_orders_index', index.filter(r => r !== orderRef));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
