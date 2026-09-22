import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export async function GET() {
  try {
    const [bundles, meta] = await Promise.all([
      redis.get('mn_bundles_meta') || [],
      redis.get('mn_books_meta') || []
    ]);
    const bookMap = new Map((meta || []).map(b => [b.slug, b]));
    const populated = (bundles || []).map(bundle => ({
      ...bundle,
      books: (bundle.bookSlugs || []).map(slug => bookMap.get(slug)).filter(Boolean)
    }));
    return NextResponse.json({ bundles: populated }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
    });
  } catch { return NextResponse.json({ bundles: [] }); }
}

export async function POST(req) {
  try {
    const { password, ...data } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (!data.name?.trim())
      return NextResponse.json({ error: 'Bundle name required.' }, { status: 400 });

    const id  = uid();
    const now = new Date().toISOString();
    const bundle = {
      id,
      sku:         data.sku?.trim() || '',
      name:        data.name.trim(),
      description: data.description?.trim() || '',
      bookSlugs:   data.bookSlugs || [],
      totalMrp:    parseFloat(data.totalMrp) || 0,
      bundlePrice: parseFloat(data.bundlePrice) || 0,
      offerType:   data.offerType || 'Limited Deal',
      stockCount:  parseInt(data.stockCount) || 0,
      active:      data.active !== false,
      createdAt:   now, updatedAt: now,
    };

    await redis.set(`mn_bundle:${id}`, bundle);
    await redis.set(`mn_stock:bundle:${id}`, bundle.stockCount);
    const meta = await redis.get('mn_bundles_meta') || [];
    meta.unshift({ id, sku: bundle.sku, name: bundle.name, bookSlugs: bundle.bookSlugs,
                   totalMrp: bundle.totalMrp, bundlePrice: bundle.bundlePrice,
                   offerType: bundle.offerType, stockCount: bundle.stockCount,
                   active: bundle.active, createdAt: now });
    await redis.set('mn_bundles_meta', meta);
    return NextResponse.json({ success: true, id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
