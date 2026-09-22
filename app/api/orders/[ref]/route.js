import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { ref } = params;
    if (!ref) {
      return NextResponse.json({ error: 'Order reference required.' }, { status: 400 });
    }

    const order = await redis.hget('mn_orders', ref);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch order.' }, { status: 500 });
  }
}
