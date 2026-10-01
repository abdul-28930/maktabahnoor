import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCategoryArabic } from '@/lib/constants';

const KEY = 'mn_homepage_cats';

// Public — read the admin-curated list for the "Browse by Topic" section.
// Returns { categories: Array<{ name: string, ar: string }> | null }
// null means "not configured yet — use taxonomy defaults".
export async function GET() {
  try {
    const stored = await redis.get(KEY);
    if (!stored || !Array.isArray(stored)) {
      return NextResponse.json({ categories: null });
    }
    const normalized = stored.map(item => {
      if (typeof item === 'string') {
        return { name: item, ar: getCategoryArabic(item) };
      }
      return {
        name: item?.name || '',
        ar: item?.ar || getCategoryArabic(item?.name || ''),
      };
    }).filter(c => c.name);

    return NextResponse.json(
      { categories: normalized.length > 0 ? normalized : null },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
    );
  } catch {
    return NextResponse.json({ categories: null });
  }
}

// Admin-only — save the curated list.
export async function POST(req) {
  try {
    const { password, categories } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    if (!Array.isArray(categories)) {
      return NextResponse.json({ error: 'categories must be an array.' }, { status: 400 });
    }
    const normalized = categories.map(c => {
      if (typeof c === 'string') {
        return { name: c.trim(), ar: getCategoryArabic(c) };
      }
      const name = String(c?.name || '').trim();
      const ar = String(c?.ar || '').trim() || getCategoryArabic(name);
      return { name, ar };
    }).filter(c => c.name);

    const toStore = normalized.length > 0 ? normalized : null;
    await redis.set(KEY, toStore);
    revalidatePath('/');
    return NextResponse.json({ success: true, categories: toStore });
  } catch (e) {
    console.error('homepage-categories POST error:', e);
    return NextResponse.json({ error: e?.message || 'Failed.' }, { status: 500 });
  }
}
