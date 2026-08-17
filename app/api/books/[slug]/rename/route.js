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

    const book = await redis.get(`mn_book:${oldSlug}`);
    if (!book) return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    if (await redis.get(`mn_book:${newSlug}`))
      return NextResponse.json({ error: `Slug "${newSlug}" is already in use by another book.` }, { status: 400 });

    // Move the book record itself.
    await redis.set(`mn_book:${newSlug}`, { ...book, slug: newSlug });
    await redis.del(`mn_book:${oldSlug}`);

    // Update the lightweight meta list used for browsing/filtering.
    const meta = await redis.get('mn_books_meta') || [];
    const idx = meta.findIndex(b => b.slug === oldSlug);
    if (idx >= 0) { meta[idx] = { ...meta[idx], slug: newSlug }; await redis.set('mn_books_meta', meta); }

    // Cascade — anywhere else that stored the old slug as a reference.
    const bundlesMeta = await redis.get('mn_bundles_meta') || [];
    let bundlesTouched = false;
    for (const b of bundlesMeta) {
      if (b.bookSlugs?.includes(oldSlug)) {
        b.bookSlugs = b.bookSlugs.map(s => s === oldSlug ? newSlug : s);
        bundlesTouched = true;
        const full = await redis.get(`mn_bundle:${b.id}`);
        if (full?.bookSlugs) await redis.set(`mn_bundle:${b.id}`, { ...full, bookSlugs: full.bookSlugs.map(s => s === oldSlug ? newSlug : s) });
      }
    }
    if (bundlesTouched) await redis.set('mn_bundles_meta', bundlesMeta);

    const slides = await redis.get('mn_hero_slides') || [];
    let slidesTouched = false;
    for (const s of slides) {
      if (s.bookSlug === oldSlug) { s.bookSlug = newSlug; slidesTouched = true; }
    }
    if (slidesTouched) await redis.set('mn_hero_slides', slides);

    const picks = await redis.get('mn_homepage_picks');
    if (picks) {
      let picksTouched = false;
      for (const key of ['featured', 'newArrivals']) {
        if (picks[key]?.includes(oldSlug)) { picks[key] = picks[key].map(s => s === oldSlug ? newSlug : s); picksTouched = true; }
      }
      if (picksTouched) await redis.set('mn_homepage_picks', picks);
    }

    revalidatePath('/');
    return NextResponse.json({ success: true, newSlug });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to rename.' }, { status: 500 });
  }
}
