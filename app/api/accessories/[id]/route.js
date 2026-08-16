import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

const KEY = 'mn_accessories';

export async function PUT(req, { params }) {
  try {
    const { password, ...updates } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const all = await redis.get(KEY) || [];
    const idx = all.findIndex(a => a.id === params.id);
    if (idx < 0) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.mrp !== undefined) updates.mrp = updates.mrp ? Number(updates.mrp) : null;
    if (updates.stockCount !== undefined) updates.stockCount = parseInt(updates.stockCount) || 0;
    all[idx] = { ...all[idx], ...updates, id: params.id, updatedAt: new Date().toISOString() };
    await redis.set(KEY, all);
    return NextResponse.json({ success: true, item: all[idx] });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  try {
    const { password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const all = await redis.get(KEY) || [];
    await redis.set(KEY, all.filter(a => a.id !== params.id));
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}
