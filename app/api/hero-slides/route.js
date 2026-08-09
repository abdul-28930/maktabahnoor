import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

const KEY = 'mn_hero_slides';
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// Public — returns only active slides, in display order, unless the caller
// is the admin panel (passes the session password), which needs to see and
// manage hidden/inactive slides too.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get('password') === process.env.ADMIN_PASSWORD;
    const all = await redis.get(KEY) || [];
    const list = (isAdmin ? all : all.filter(s => s.active !== false))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return NextResponse.json({ slides: list });
  } catch { return NextResponse.json({ slides: [] }); }
}

export async function POST(req) {
  try {
    const { password, ...data } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const mode = data.mode === 'book' ? 'book' : 'custom';
    if (mode === 'book' && !data.bookSlug?.trim())
      return NextResponse.json({ error: 'Select a book to feature.' }, { status: 400 });
    if (mode === 'custom' && !data.imageUrl?.trim())
      return NextResponse.json({ error: 'An image is required for a custom slide.' }, { status: 400 });
    if (mode === 'custom' && !data.title?.trim())
      return NextResponse.json({ error: 'Title is required for a custom slide.' }, { status: 400 });

    const all = await redis.get(KEY) || [];
    const now = new Date().toISOString();
    const slide = {
      id: uid(),
      mode,
      bookSlug:  mode === 'book' ? data.bookSlug.trim() : '',
      imageUrl:  data.imageUrl?.trim() || '',
      eyebrow:   data.eyebrow?.trim() || '',
      title:     data.title?.trim() || '',
      subtitle:  data.subtitle?.trim() || '',
      ctaLabel:  data.ctaLabel?.trim() || '',
      ctaUrl:    data.ctaUrl?.trim() || '',
      active:    data.active !== false,
      order:     all.length ? Math.max(...all.map(s => s.order ?? 0)) + 1 : 0,
      createdAt: now, updatedAt: now,
    };
    await redis.set(KEY, [...all, slide]);
    return NextResponse.json({ success: true, slide });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save.' }, { status: 500 });
  }
}
