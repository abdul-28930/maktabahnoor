import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { MANDATORY_BOOK_FIELDS } from '@/lib/constants';

const FIELD_LABELS = { title: 'Title', author: 'Author', category: 'Category', language: 'Language', price: 'Price' };

function missingMandatoryFields(data) {
  return MANDATORY_BOOK_FIELDS.filter(k => {
    const v = data[k];
    return v === undefined || v === null || String(v).trim() === '';
  }).map(k => FIELD_LABELS[k] || k);
}

export async function GET(_, { params }) {
  try {
    const book = await redis.get(`mn_book:${params.slug}`);
    if (!book) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const liveStock = await redis.get(`mn_stock:book:${params.slug}`);
    if (liveStock !== null && liveStock !== undefined) {
      book.stockCount = liveStock;
      book.inStock = liveStock > 0;
    }
    return NextResponse.json({ book });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}

export async function PUT(req, { params }) {
  try {
    const { password, ...updates } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const existing = await redis.get(`mn_book:${params.slug}`);
    if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const merged = { ...existing, ...updates };
    const missing = missingMandatoryFields(merged);
    if (missing.length)
      return NextResponse.json({ error: `Required field${missing.length > 1 ? 's' : ''} missing: ${missing.join(', ')}.` }, { status: 400 });
    const stockCount = parseInt(updates.stockCount ?? existing.stockCount) || 0;
    const updated = { ...existing, ...updates,
      stockCount, inStock: stockCount > 0,
      mrp: parseFloat(updates.mrp ?? existing.mrp) || 0,
      price: parseFloat(updates.price ?? existing.price) || 0,
      updatedAt: new Date().toISOString() };
    await redis.set(`mn_book:${params.slug}`, updated);
    await redis.set(`mn_stock:book:${params.slug}`, stockCount);
    const meta = await redis.get('mn_books_meta') || [];
    const idx  = meta.findIndex(b => b.slug === params.slug);
    if (idx >= 0) {
      meta[idx] = { ...meta[idx], sku: updated.sku, title: updated.title, translator: updated.translator,
        author: updated.author, category: updated.category, language: updated.language,
        binding: updated.binding, volumes: updated.volumes, pages: updated.pages,
        mrp: updated.mrp, price: updated.price, offerType: updated.offerType,
        stockCount, inStock: updated.inStock, visible: updated.visible !== false, tags: updated.tags, coverUrl: updated.coverUrl,
        gallery: updated.gallery };
      await redis.set('mn_books_meta', meta);
    }
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  try {
    const { password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    await redis.del(`mn_book:${params.slug}`);
    await redis.del(`mn_stock:book:${params.slug}`);
    const meta = await redis.get('mn_books_meta') || [];
    await redis.set('mn_books_meta', meta.filter(b => b.slug !== params.slug));
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}
