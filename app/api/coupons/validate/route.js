import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { code, subtotal } = await req.json();
    const clean = code?.trim().toUpperCase();
    if (!clean) return NextResponse.json({ valid: false, error: 'Enter a coupon code.' });

    const all = await redis.get('mn_coupons') || [];
    const coupon = all.find(c => c.code === clean);
    if (!coupon) return NextResponse.json({ valid: false, error: 'Invalid coupon code.' });
    if (coupon.active === false) return NextResponse.json({ valid: false, error: 'This coupon is no longer active.' });
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return NextResponse.json({ valid: false, error: 'This coupon has expired.' });
    if (coupon.minOrder && subtotal < coupon.minOrder)
      return NextResponse.json({ valid: false, error: `This coupon needs a minimum order of ₹${coupon.minOrder}.` });

    const discount = coupon.type === 'percent'
      ? Math.round(subtotal * (coupon.value / 100))
      : Math.min(coupon.value, subtotal);

    return NextResponse.json({ valid: true, code: coupon.code, type: coupon.type, value: coupon.value, discount });
  } catch { return NextResponse.json({ valid: false, error: 'Something went wrong.' }); }
}
