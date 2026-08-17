import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const KEY = 'mn_hero_slides';

export async function PUT(req, { params }) {
  try {
    const { password, ...updates } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const all = await redis.get(KEY) || [];
    const idx = all.findIndex(s => s.id === params.id);
    if (idx < 0) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    all[idx] = { ...all[idx], ...updates, id: params.id, updatedAt: new Date().toISOString() };
    await redis.set(KEY, all);
    revalidatePath('/');
    return NextResponse.json({ success: true, slide: all[idx] });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  try {
    const { password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const all = await redis.get(KEY) || [];
    await redis.set(KEY, all.filter(s => s.id !== params.id));
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}
