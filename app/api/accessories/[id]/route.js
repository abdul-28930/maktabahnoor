import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sanitizeSlug } from '@/lib/constants';

const KEY = 'mn_accessories';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const all = await redis.get(KEY) || [];
    const item = all.find(a => a.slug === id || a.id === id);
    if (!item) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ accessory: item });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { password, ...updates } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const all = await redis.get(KEY) || [];
    const idx = all.findIndex(a => a.id === id || a.slug === id);
    if (idx < 0) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const currentItem = all[idx];
    if (updates.slug) {
      const sanitized = sanitizeSlug(updates.slug);
      if (sanitized && sanitized !== currentItem.slug) {
        if (all.some((a, i) => i !== idx && a.slug === sanitized)) {
          return NextResponse.json({ error: `Slug "${sanitized}" is already in use.` }, { status: 400 });
        }
        updates.slug = sanitized;
      }
    }

    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.mrp !== undefined) updates.mrp = updates.mrp ? Number(updates.mrp) : null;
    if (updates.stockCount !== undefined) updates.stockCount = parseInt(updates.stockCount) || 0;
    if (updates.variants !== undefined) {
      updates.variants = Array.isArray(updates.variants) ? updates.variants
        .filter(v => v.label?.trim())
        .map(v => ({ id: v.id || (Date.now().toString(36)+Math.random().toString(36).slice(2,6)), label: v.label.trim(), color: v.color || '#1b4332', stockCount: Math.max(0, parseInt(v.stockCount) || 0) }))
        : [];
    }
    all[idx] = { ...all[idx], ...updates, id: currentItem.id, updatedAt: new Date().toISOString() };
    await redis.set(KEY, all);

    revalidatePath('/');
    revalidatePath('/accessories');
    if (currentItem.slug) {
      revalidatePath(`/accessory/${currentItem.slug}`);
      revalidatePath(`/accessories/${currentItem.slug}`);
    }
    if (updates.slug && updates.slug !== currentItem.slug) {
      revalidatePath(`/accessory/${updates.slug}`);
      revalidatePath(`/accessories/${updates.slug}`);
    }

    return NextResponse.json({ success: true, item: all[idx] });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const { password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const all = await redis.get(KEY) || [];
    const item = all.find(a => a.id === id || a.slug === id);
    await redis.set(KEY, all.filter(a => a.id !== id && a.slug !== id));

    revalidatePath('/');
    revalidatePath('/accessories');
    if (item?.slug) {
      revalidatePath(`/accessory/${item.slug}`);
      revalidatePath(`/accessories/${item.slug}`);
    }

    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}
