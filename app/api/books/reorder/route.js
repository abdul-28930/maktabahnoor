import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function PUT(req) {
  try {
    const { password, slugs } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (!Array.isArray(slugs)) return NextResponse.json({ error: 'Invalid order.' }, { status: 400 });

    const meta = await redis.get('mn_books_meta') || [];
    const orderOf = Object.fromEntries(slugs.map((s, i) => [s, i]));
    for (const b of meta) if (b.slug in orderOf) b.order = orderOf[b.slug];
    await redis.set('mn_books_meta', meta);
    revalidatePath('/');
    revalidatePath('/books');
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed to save order.' }, { status: 500 }); }
}
