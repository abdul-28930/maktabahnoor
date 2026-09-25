import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { DEFAULT_CATEGORIES, DEFAULT_LANGUAGES, DEFAULT_OFFER_TYPES, getBookCategories } from '@/lib/constants';

const TAXONOMY_KEY = 'mn_taxonomy';
const FALLBACK_CATEGORY = 'General';

export async function POST(req) {
  try {
    const { password, name } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const target = String(name || '').trim();
    if (!target) {
      return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });
    }

    // 1. Remove from taxonomy list in Redis
    const stored = await redis.get(TAXONOMY_KEY) || {
      categories: [...DEFAULT_CATEGORIES],
      languages: [...DEFAULT_LANGUAGES],
      offerTypes: [...DEFAULT_OFFER_TYPES],
    };
    if (!stored.categories) stored.categories = [...DEFAULT_CATEGORIES];

    const existed = stored.categories.some(c => c.toLowerCase() === target.toLowerCase());
    if (!existed) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }
    if (stored.categories.length <= 1) {
      return NextResponse.json({ error: 'At least one category must remain.' }, { status: 400 });
    }

    const remainingCategories = stored.categories.filter(c => c.toLowerCase() !== target.toLowerCase());
    // Category is a mandatory book field, so any book left with none needs a
    // fallback — prefer "General" if it still exists, otherwise the first
    // remaining category in the list.
    const fallback = remainingCategories.find(c => c.toLowerCase() === FALLBACK_CATEGORY.toLowerCase())
      || remainingCategories[0];

    stored.categories = remainingCategories;
    await redis.set(TAXONOMY_KEY, stored);

    // 2. Strip the category from books in Redis (mn_books_meta and each
    // individual mn_book:[slug]), falling back where it was their only one.
    const meta = await redis.get('mn_books_meta') || [];
    let affectedCount = 0;

    const updatedMeta = meta.map(b => {
      const cats = getBookCategories(b);
      const hasTarget = cats.some(c => c.toLowerCase() === target.toLowerCase());
      if (hasTarget) {
        affectedCount++;
        const nextCats = cats.filter(c => c.toLowerCase() !== target.toLowerCase());
        if (nextCats.length === 0) nextCats.push(fallback);
        return {
          ...b,
          category: nextCats[0],
          categories: nextCats,
        };
      }
      return b;
    });

    for (const b of meta) {
      const cats = getBookCategories(b);
      if (cats.some(c => c.toLowerCase() === target.toLowerCase())) {
        const full = await redis.get(`mn_book:${b.slug}`);
        if (full) {
          const fullCats = getBookCategories(full);
          const nextCats = fullCats.filter(c => c.toLowerCase() !== target.toLowerCase());
          if (nextCats.length === 0) nextCats.push(fallback);
          await redis.set(`mn_book:${b.slug}`, {
            ...full,
            category: nextCats[0],
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
    console.error('Delete category error:', e);
    return NextResponse.json({ error: e?.message || 'Failed to delete category.' }, { status: 500 });
  }
}
