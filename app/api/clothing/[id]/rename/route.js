import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sanitizeSlug } from '@/lib/constants';

const KEY = 'mn_clothing';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { password, newSlug: raw } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const newSlug = sanitizeSlug(raw);
    if (!newSlug) return NextResponse.json({ error: 'Enter a valid slug.' }, { status: 400 });

    const all = await redis.get(KEY) || [];
    const idx = all.findIndex(c => c.id === id || c.slug === id);
    if (idx < 0) return NextResponse.json({ error: 'Clothing item not found.' }, { status: 404 });

    const oldSlug = all[idx].slug || all[idx].id;
    if (newSlug === oldSlug) return NextResponse.json({ success: true, newSlug });

    // Check if newSlug is already in use by another clothing item
    const conflict = all.some((c, i) => i !== idx && c.slug === newSlug);
    if (conflict) {
      return NextResponse.json({ error: `Slug "${newSlug}" is already in use by another clothing item.` }, { status: 400 });
    }

    all[idx] = {
      ...all[idx],
      slug: newSlug,
      updatedAt: new Date().toISOString()
    };
    await redis.set(KEY, all);

    revalidatePath('/');
    revalidatePath('/clothing');
    revalidatePath(`/clothing/${oldSlug}`);
    revalidatePath(`/clothing/${newSlug}`);

    return NextResponse.json({ success: true, newSlug });
  } catch (e) {
    console.error('Error renaming clothing slug:', e);
    return NextResponse.json({ error: 'Failed to rename.' }, { status: 500 });
  }
}
