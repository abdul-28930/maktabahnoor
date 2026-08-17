import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

const KEY = 'mn_coupons';

export async function PUT(req, { params }) {
  try {
    const { password, ...updates } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const all = await redis.get(KEY) || [];
    const idx = all.findIndex(c => c.code === params.code);
    if (idx < 0) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    if (updates.value !== undefined) updates.value = Number(updates.value);
    if (updates.minOrder !== undefined) updates.minOrder = Number(updates.minOrder) || 0;
    all[idx] = { ...all[idx], ...updates, code: params.code };
    await redis.set(KEY, all);
    return NextResponse.json({ success: true, coupon: all[idx] });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  try {
    const { password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const all = await redis.get(KEY) || [];
    await redis.set(KEY, all.filter(c => c.code !== params.code));
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}
