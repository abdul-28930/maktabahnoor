import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const FIELD = 'translator';

export async function POST(req) {
  try {
    const { password, oldName, newName } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const clean = newName?.trim();
    if (!clean) return NextResponse.json({ error: 'Enter a name.' }, { status: 400 });
    if (clean === oldName) return NextResponse.json({ success: true, count: 0 });

    const meta = await redis.get('mn_books_meta') || [];
    const affected = meta.filter(b => b[FIELD] === oldName);
    if (!affected.length) return NextResponse.json({ error: `No books found with this ${FIELD}.` }, { status: 404 });

    for (const b of affected) {
      const full = await redis.get(`mn_book:${b.slug}`);
      if (full) await redis.set(`mn_book:${b.slug}`, { ...full, [FIELD]: clean });
    }
    await redis.set('mn_books_meta', meta.map(b => b[FIELD] === oldName ? { ...b, [FIELD]: clean } : b));

    revalidatePath('/');
    return NextResponse.json({ success: true, count: affected.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to rename.' }, { status: 500 });
  }
}
