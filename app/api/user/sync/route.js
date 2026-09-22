import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { getUserFromSessionToken } from '@/lib/userAuth';

export async function GET(req) {
  try {
    const token = req.cookies.get('mn_user_token')?.value;
    if (!token) {
      return NextResponse.json({ cart: null, wishlist: null });
    }

    const user = await getUserFromSessionToken(token);
    if (!user) {
      return NextResponse.json({ cart: null, wishlist: null });
    }

    const [cart, wishlist] = await Promise.all([
      redis.get(`mn_user_cart:${user.id}`),
      redis.get(`mn_user_wishlist:${user.id}`),
    ]);

    return NextResponse.json({
      cart: cart || [],
      wishlist: wishlist || [],
    });
  } catch (e) {
    return NextResponse.json({ cart: null, wishlist: null });
  }
}

export async function POST(req) {
  try {
    const token = req.cookies.get('mn_user_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromSessionToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { cart, wishlist } = await req.json();

    const ops = [];
    if (cart !== undefined) {
      ops.push(redis.set(`mn_user_cart:${user.id}`, cart));
    }
    if (wishlist !== undefined) {
      ops.push(redis.set(`mn_user_wishlist:${user.id}`, wishlist));
    }

    await Promise.all(ops);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
  }
}
