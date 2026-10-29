import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

function sanitizeSlug(s) {
  return String(s || '').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(req, { params }) {
  try {
    const { password, newSlug: raw } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const oldSlug = params.slug;
    const newSlug = sanitizeSlug(raw);
    if (!newSlug) return NextResponse.json({ error: 'Enter a valid slug.' }, { status: 400 });
    if (newSlug === oldSlug) return NextResponse.json({ success: true, newSlug });

    const meta = await redis.get('mn_ebooks_meta') || [];
    const idx = meta.findIndex(b => b.slug === oldSlug);

    let ebook = await redis.get(`mn_ebook:${oldSlug}`);
    if (!ebook) {
      const existingNew = await redis.get(`mn_ebook:${newSlug}`);
      if (existingNew && idx >= 0) {
        ebook = existingNew;
      } else {
        return NextResponse.json({ error: 'E-Book not found.' }, { status: 404 });
      }
    } else {
      if (await redis.get(`mn_ebook:${newSlug}`))
        return NextResponse.json({ error: `Slug "${newSlug}" is already in use by another e-book.` }, { status: 400 });

      await redis.set(`mn_ebook:${newSlug}`, { ...ebook, slug: newSlug });
      await redis.del(`mn_ebook:${oldSlug}`);
    }

    // Migrate live stock counter
    const liveStock = await redis.get(`mn_stock:ebook:${oldSlug}`);
    if (liveStock !== null && liveStock !== undefined) {
      await redis.set(`mn_stock:ebook:${newSlug}`, liveStock);
      await redis.del(`mn_stock:ebook:${oldSlug}`);
    } else if (ebook.stockCount !== undefined && (await redis.get(`mn_stock:ebook:${newSlug}`)) === null) {
      await redis.set(`mn_stock:ebook:${newSlug}`, ebook.stockCount);
    }

    // Update meta list
    if (idx >= 0) {
      const coverUrl = meta[idx].coverUrl === `/api/ebooks/${oldSlug}/cover`
        ? `/api/ebooks/${newSlug}/cover`
        : meta[idx].coverUrl;
      meta[idx] = { ...meta[idx], slug: newSlug, coverUrl };
      await redis.set('mn_ebooks_meta', meta);
    }

    revalidatePath('/');
    revalidatePath('/ebooks');
    revalidatePath(`/ebook/${oldSlug}`);
    revalidatePath(`/ebook/${newSlug}`);

    return NextResponse.json({ success: true, newSlug });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to rename.' }, { status: 500 });
  }
}
