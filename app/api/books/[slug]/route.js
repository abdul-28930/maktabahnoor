import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET(_, { params }) {
  try {
    const book = await redis.get(`mn_book:${params.slug}`);
    if (!book) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
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
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await redis.set(`mn_book:${params.slug}`, updated);
    const meta = await redis.get('mn_books_meta') || [];
    const idx  = meta.findIndex(b => b.slug === params.slug);
    if (idx >= 0) {
      meta[idx] = { ...meta[idx], title: updated.title, titleAr: updated.titleAr, author: updated.author, category: updated.category, language: updated.language, binding: updated.binding, volumes: updated.volumes, pages: updated.pages, inStock: updated.inStock, tags: updated.tags, coverUrl: updated.coverUrl };
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
    const meta = await redis.get('mn_books_meta') || [];
    await redis.set('mn_books_meta', meta.filter(b => b.slug !== params.slug));
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed.' }, { status: 500 }); }
}
