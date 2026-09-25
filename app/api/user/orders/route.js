import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { getUserFromSessionToken } from '@/lib/userAuth';

export async function GET(req) {
  try {
    const token = req.cookies.get('mn_user_token')?.value;
    const user = token ? await getUserFromSessionToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const index = await redis.get('mn_orders_index') || [];
    const map = await redis.hgetall('mn_orders') || {};
    const orders = index
      .map(ref => map[ref])
      .filter(order => order && order.userId === user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({ orders });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 });
  }
}
