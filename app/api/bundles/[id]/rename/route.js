import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sanitizeSlug } from '@/lib/constants';

export async function POST(req, { params }) {
  try {
    const { id: rawParam } = await params;
    const { password, newSlug: rawSlug } = await req.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const newSlug = sanitizeSlug(rawSlug);
    if (!newSlug) {
      return NextResponse.json({ error: 'Enter a valid slug.' }, { status: 400 });
    }

    const meta = await redis.get('mn_bundles_meta') || [];
    const idx = meta.findIndex(b => b.id === rawParam || b.slug === rawParam);
    if (idx < 0) {
      return NextResponse.json({ error: 'Combo not found.' }, { status: 404 });
    }

    const bundleId = meta[idx].id;
    const existing = await redis.get(`mn_bundle:${bundleId}`);
    if (!existing) {
      return NextResponse.json({ error: 'Combo not found.' }, { status: 404 });
    }

    const oldSlug = existing.slug || bundleId;
    if (newSlug === oldSlug) {
      return NextResponse.json({ success: true, newSlug });
    }

    // Check for collision with another combo
    const conflict = meta.some((b, i) => i !== idx && (b.slug === newSlug || b.id === newSlug));
    if (conflict) {
      return NextResponse.json({ error: `Slug "${newSlug}" is already in use by another combo.` }, { status: 400 });
    }

    const updated = {
      ...existing,
      slug: newSlug,
      updatedAt: new Date().toISOString(),
    };
    await redis.set(`mn_bundle:${bundleId}`, updated);

    meta[idx] = {
      ...meta[idx],
      slug: newSlug,
    };
    await redis.set('mn_bundles_meta', meta);

    revalidatePath('/');
    revalidatePath('/combos');
    revalidatePath(`/combo/${oldSlug}`);
    revalidatePath(`/combo/${newSlug}`);
    revalidatePath(`/bundle/${oldSlug}`);
    revalidatePath(`/bundle/${newSlug}`);

    return NextResponse.json({ success: true, newSlug });
  } catch (e) {
    console.error('Error renaming combo slug:', e);
    return NextResponse.json({ error: 'Failed to rename combo URL.' }, { status: 500 });
  }
}
