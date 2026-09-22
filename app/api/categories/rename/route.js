import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { DEFAULT_CATEGORIES, DEFAULT_LANGUAGES, DEFAULT_OFFER_TYPES, getBookCategories } from '@/lib/constants';

const TAXONOMY_KEY = 'mn_taxonomy';

export async function POST(req) {
  try {
    const { password, oldName, newName } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const oldCat = String(oldName || '').trim();
    const newCat = String(newName || '').trim();

    if (!oldCat || !newCat) {
      return NextResponse.json({ error: 'Both old and new category names are required.' }, { status: 400 });
    }
    if (oldCat.toLowerCase() === newCat.toLowerCase() && oldCat === newCat) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // 1. Update taxonomy list in Redis
    const stored = await redis.get(TAXONOMY_KEY) || {
      categories: [...DEFAULT_CATEGORIES],
      languages: [...DEFAULT_LANGUAGES],
      offerTypes: [...DEFAULT_OFFER_TYPES],
    };
    if (!stored.categories) stored.categories = [...DEFAULT_CATEGORIES];

    // Replace old category or add new if not present
    let foundInTaxonomy = false;
    stored.categories = stored.categories.map(c => {
      if (c.toLowerCase() === oldCat.toLowerCase()) {
        foundInTaxonomy = true;
        return newCat;
      }
      return c;
    });
    if (!foundInTaxonomy && !stored.categories.some(c => c.toLowerCase() === newCat.toLowerCase())) {
      stored.categories.push(newCat);
    }
    // De-duplicate
    stored.categories = [...new Set(stored.categories)];
    await redis.set(TAXONOMY_KEY, stored);

    // 2. Update books in Redis (mn_books_meta and each individual mn_book:[slug])
    const meta = await redis.get('mn_books_meta') || [];
    let affectedCount = 0;

    const updatedMeta = meta.map(b => {
      const cats = getBookCategories(b);
      const hasOld = cats.some(c => c.toLowerCase() === oldCat.toLowerCase());
      if (hasOld) {
        affectedCount++;
        const nextCats = cats.map(c => c.toLowerCase() === oldCat.toLowerCase() ? newCat : c);
        const primaryCat = nextCats[0] || newCat;
        return {
          ...b,
          category: primaryCat,
          categories: nextCats,
        };
      }
      return b;
    });

    for (const b of meta) {
      const cats = getBookCategories(b);
      if (cats.some(c => c.toLowerCase() === oldCat.toLowerCase())) {
        const full = await redis.get(`mn_book:${b.slug}`);
        if (full) {
          const fullCats = getBookCategories(full);
          const nextCats = fullCats.map(c => c.toLowerCase() === oldCat.toLowerCase() ? newCat : c);
          const primaryCat = nextCats[0] || newCat;
          await redis.set(`mn_book:${b.slug}`, {
            ...full,
            category: primaryCat,
            categories: nextCats,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    if (affectedCount > 0) {
      await redis.set('mn_books_meta', updatedMeta);
    }

    revalidatePath('/');
    return NextResponse.json({ success: true, count: affectedCount, taxonomy: stored });
  } catch (e) {
    console.error('Rename category error:', e);
    return NextResponse.json({ error: e?.message || 'Failed to rename category.' }, { status: 500 });
  }
}
