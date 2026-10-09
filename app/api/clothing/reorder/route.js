import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const KEY = 'mn_clothing';

export async function PUT(req) {
  try {
    const { password, ids } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (!Array.isArray(ids))
      return NextResponse.json({ error: 'Invalid order list.' }, { status: 400 });

    const all = await redis.get(KEY) || [];
    const orderOf = new Map(ids.map((id, i) => [String(id), i]));

    const sorted = [...all].sort((a, b) => {
      const idxA = orderOf.has(String(a.id)) ? orderOf.get(String(a.id)) : 999999;
      const idxB = orderOf.has(String(b.id)) ? orderOf.get(String(b.id)) : 999999;
      return idxA - idxB;
    });

    await redis.set(KEY, sorted);
    revalidatePath('/');
    revalidatePath('/clothing');
    return NextResponse.json({ success: true, clothing: sorted });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Failed to save order.' }, { status: 500 });
  }
}
