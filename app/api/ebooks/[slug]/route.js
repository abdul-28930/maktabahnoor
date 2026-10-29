import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { MANDATORY_BOOK_FIELDS, metaSafeCoverUrl, getBookCategories } from '@/lib/constants';
import { ensureThumbnail } from '@/lib/thumbnails';

const FIELD_LABELS = { title: 'Title', author: 'Author', category: 'Category', language: 'Language', price: 'Price', stockCount: 'Stock Count', binding: 'Binding' };

function missingMandatoryFields(data) {
  return MANDATORY_BOOK_FIELDS.filter(k => {
    if (data.comingSoon && (k === 'price' || k === 'stockCount')) return false;
    if (k === 'category') {
      const cats = getBookCategories(data);
      return cats.length === 0;
    }
    const v = data[k];
    return v === undefined || v === null || String(v).trim() === '';
  }).map(k => FIELD_LABELS[k] || k);
}

export async function GET(_, { params }) {
  try {
    const ebook = await redis.get(`mn_ebook:${params.slug}`);
    if (!ebook) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const liveStock = await redis.get(`mn_stock:ebook:${params.slug}`);
    if (ebook.comingSoon) {
      ebook.stockCount = 0;
      ebook.inStock = false;
    } else if (liveStock !== null && liveStock !== undefined) {
      ebook.stockCount = liveStock;
      ebook.inStock = liveStock > 0;
    }
    return NextResponse.json({ ebook });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}

export async function PUT(req, { params }) {
  try {
    const { password, ...updates } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const existing = await redis.get(`mn_ebook:${params.slug}`);
    if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const merged = { ...existing, ...updates };
    const missing = missingMandatoryFields(merged);
    if (missing.length)
      return NextResponse.json({ error: `Required field${missing.length > 1 ? 's' : ''} missing: ${missing.join(', ')}.` }, { status: 400 });
    const comingSoon = updates.comingSoon !== undefined ? Boolean(updates.comingSoon) : Boolean(existing.comingSoon);
    const stockCount = comingSoon ? 0 : Math.max(0, parseInt(updates.stockCount ?? existing.stockCount) || 0);
    const categories = getBookCategories(merged);
    const primaryCategory = categories[0] || 'General';
    const thumb = await ensureThumbnail(updates.coverThumb ?? existing.coverThumb, updates.coverUrl ?? existing.coverUrl);
    const fullCover = (updates.coverUrl && updates.coverUrl.startsWith('/api/'))
      ? (existing.coverUrl || '')
      : (updates.coverUrl !== undefined ? updates.coverUrl : existing.coverUrl);
    const updated = { ...existing, ...updates,
      comingSoon,
      coverUrl: fullCover,
      category: primaryCategory,
      categories,
      stockCount, inStock: !comingSoon && stockCount > 0,
      coverThumb: thumb,
      mrp: comingSoon ? 0 : (parseFloat(updates.mrp ?? existing.mrp) || 0),
      price: comingSoon ? 0 : (parseFloat(updates.price ?? existing.price) || 0),
      offerType: comingSoon ? '' : (updates.offerType ?? existing.offerType ?? ''),
      updatedAt: new Date().toISOString() };
    await redis.set(`mn_ebook:${params.slug}`, updated);
    await redis.set(`mn_stock:ebook:${params.slug}`, stockCount);
    const meta = await redis.get('mn_ebooks_meta') || [];
    const idx  = meta.findIndex(b => b.slug === params.slug);
    if (idx >= 0) {
      const metaCoverUrl = (fullCover && fullCover.startsWith('data:'))
        ? `/api/ebooks/${params.slug}/cover`
        : (fullCover || '');
      meta[idx] = { ...meta[idx], sku: updated.sku, title: updated.title, translator: updated.translator, publisher: updated.publisher,
        author: updated.author, category: updated.category, categories: updated.categories, language: updated.language,
        binding: updated.binding, volumes: updated.volumes, pages: updated.pages,
        mrp: updated.mrp, price: updated.price, offerType: updated.offerType,
        stockCount, inStock: updated.inStock, comingSoon, visible: updated.visible !== false, tags: updated.tags,
        coverUrl: metaCoverUrl,
        gallery: updated.gallery };
      await redis.set('mn_ebooks_meta', meta);
      revalidatePath('/');
      revalidatePath('/ebooks');
    }
    return NextResponse.json({ success: true });
  } catch (e) { console.error('PUT /api/ebooks/[slug]:', e); return NextResponse.json({ error: e?.message || 'Failed.' }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  try {
    const { password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    await redis.del(`mn_ebook:${params.slug}`);
    await redis.del(`mn_stock:ebook:${params.slug}`);
    const meta = await redis.get('mn_ebooks_meta') || [];
    await redis.set('mn_ebooks_meta', meta.filter(b => b.slug !== params.slug));
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (e) { console.error('DELETE /api/ebooks/[slug]:', e); return NextResponse.json({ error: e?.message || 'Failed.' }, { status: 500 }); }
}
