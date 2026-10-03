import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sanitizeSlug } from '@/lib/constants';

const KEY = 'mn_clothing';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const all = await redis.get(KEY) || [];
    const item = all.find(c => c.slug === id || c.id === id);
    if (!item) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ clothing: item });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { password, ...updates } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const all = await redis.get(KEY) || [];
    const idx = all.findIndex(c => c.id === id || c.slug === id);
    if (idx < 0) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const currentItem = all[idx];
    if (updates.slug) {
      const sanitized = sanitizeSlug(updates.slug);
      if (sanitized && sanitized !== currentItem.slug) {
        if (all.some((c, i) => i !== idx && c.slug === sanitized)) {
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
        .map(v => ({ id: v.id || (Date.now().toString(36)+Math.random().toString(36).slice(2,6)), label: v.label.trim(), size: v.size?.trim() || '', color: v.color || '', stockCount: Math.max(0, parseInt(v.stockCount) || 0) }))
        : [];
    }
    all[idx] = { ...all[idx], ...updates, id: currentItem.id, updatedAt: new Date().toISOString() };
    await redis.set(KEY, all);

    revalidatePath('/');
    revalidatePath('/clothing');
    if (currentItem.slug) {
      revalidatePath(`/clothing/${currentItem.slug}`);
    }
    if (updates.slug && updates.slug !== currentItem.slug) {
      revalidatePath(`/clothing/${updates.slug}`);
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
    const item = all.find(c => c.id === id || c.slug === id);
    await redis.set(KEY, all.filter(c => c.id !== id && c.slug !== id));

    revalidatePath('/');
    revalidatePath('/clothing');
    if (item?.slug) {
      revalidatePath(`/clothing/${item.slug}`);
    }

    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}
