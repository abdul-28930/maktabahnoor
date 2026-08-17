import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

const KEY = 'mn_coupons';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('password') !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const all = await redis.get(KEY) || [];
    return NextResponse.json({ coupons: all });
  } catch { return NextResponse.json({ coupons: [] }); }
}

export async function POST(req) {
  try {
    const { password, ...data } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const code = data.code?.trim().toUpperCase();
    if (!code) return NextResponse.json({ error: 'Code is required.' }, { status: 400 });
    if (!data.value || Number(data.value) <= 0) return NextResponse.json({ error: 'A valid discount value is required.' }, { status: 400 });
    if (data.type === 'percent' && Number(data.value) > 100) return NextResponse.json({ error: 'Percent discount cannot exceed 100.' }, { status: 400 });

    const all = await redis.get(KEY) || [];
    if (all.some(c => c.code === code)) return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 400 });

    const coupon = {
      code,
      type: data.type === 'flat' ? 'flat' : 'percent',
      value: Number(data.value),
      minOrder: data.minOrder ? Number(data.minOrder) : 0,
      expiresAt: data.expiresAt || null,
      active: data.active !== false,
      usedCount: 0,
      createdAt: new Date().toISOString(),
    };
    await redis.set(KEY, [...all, coupon]);
    return NextResponse.json({ success: true, coupon });
  } catch (e) { return NextResponse.json({ error: 'Failed to save.' }, { status: 500 }); }
}
