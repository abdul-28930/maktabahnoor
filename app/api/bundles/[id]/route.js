import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET(_, { params }) {
  try {
    const bundle = await redis.get(`mn_bundle:${params.id}`);
    if (!bundle) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

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
    const existing = await redis.get(`mn_bundle:${params.id}`);
    if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await redis.set(`mn_bundle:${params.id}`, updated);
    const meta = await redis.get('mn_bundles_meta') || [];
    const idx  = meta.findIndex(b => b.id === params.id);
    if (idx >= 0) {
      meta[idx] = { ...meta[idx], sku: updated.sku, name: updated.name, bookSlugs: updated.bookSlugs,
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
    await redis.del(`mn_bundle:${params.id}`);
    const meta = await redis.get('mn_bundles_meta') || [];
    await redis.set('mn_bundles_meta', meta.filter(b => b.id !== params.id));
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}
