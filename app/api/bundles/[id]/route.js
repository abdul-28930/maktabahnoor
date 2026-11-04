import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET(_, { params }) {
  try {
    const rawId = params.id;
    let bundle = await redis.get(`mn_bundle:${rawId}`);
    let actualId = rawId;

    if (!bundle) {
      const meta = await redis.get('mn_bundles_meta') || [];
      const match = meta.find(b => b.slug === rawId || b.id === rawId);
      if (match) {
        actualId = match.id;
        bundle = await redis.get(`mn_bundle:${actualId}`);
      }
    }
    if (!bundle) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const liveStock = await redis.get(`mn_stock:bundle:${actualId}`);
    if (liveStock !== null && liveStock !== undefined) bundle.stockCount = liveStock;

    // Populate book details
    if (bundle.bookSlugs?.length) {
      const books = await Promise.all(bundle.bookSlugs.map(s => redis.get(`mn_book:${s}`)));
      bundle.books = books.filter(Boolean);
    }
    return NextResponse.json({ bundle });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}

export async function PUT(req, { params }) {
  try {
    const { password, ...updates } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const rawId = params.id;
    let actualId = rawId;
    let existing = await redis.get(`mn_bundle:${rawId}`);
    if (!existing) {
      const meta = await redis.get('mn_bundles_meta') || [];
      const match = meta.find(b => b.slug === rawId || b.id === rawId);
      if (match) {
        actualId = match.id;
        existing = await redis.get(`mn_bundle:${actualId}`);
      }
    }
    if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await redis.set(`mn_bundle:${actualId}`, updated);
    if (updates.stockCount !== undefined) await redis.set(`mn_stock:bundle:${actualId}`, parseInt(updates.stockCount) || 0);
    const meta = await redis.get('mn_bundles_meta') || [];
    const idx  = meta.findIndex(b => b.id === actualId);
    if (idx >= 0) {
      meta[idx] = { ...meta[idx], sku: updated.sku, name: updated.name, slug: updated.slug, bookSlugs: updated.bookSlugs,
                    totalMrp: updated.totalMrp, bundlePrice: updated.bundlePrice,
                    offerType: updated.offerType, stockCount: updated.stockCount, active: updated.active };
      await redis.set('mn_bundles_meta', meta);
    }
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  try {
    const { password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const rawId = params.id;
    let actualId = rawId;
    let existing = await redis.get(`mn_bundle:${rawId}`);
    if (!existing) {
      const meta = await redis.get('mn_bundles_meta') || [];
      const match = meta.find(b => b.slug === rawId || b.id === rawId);
      if (match) actualId = match.id;
    }

    await redis.del(`mn_bundle:${actualId}`);
    await redis.del(`mn_stock:bundle:${actualId}`);
    const meta = await redis.get('mn_bundles_meta') || [];
    await redis.set('mn_bundles_meta', meta.filter(b => b.id !== actualId));
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}
