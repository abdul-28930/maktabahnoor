import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { slugify } from '@/lib/constants';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const language = searchParams.get('language');
  const tag      = searchParams.get('tag');
  const all      = searchParams.get('all') === '1';
  try {
    const meta = await redis.get('mn_books_meta') || [];
    let list = all ? meta : meta.filter(b => (b.stockCount ?? (b.inStock ? 1 : 0)) > 0);
    if (category) list = list.filter(b => b.category === category);
    if (language)  list = list.filter(b => b.language === language);
    if (tag)       list = list.filter(b => b.tags?.includes(tag));
    list = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return NextResponse.json({ books: list });
  } catch { return NextResponse.json({ books: [] }); }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { password, ...data } = body;
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (!data.title?.trim())
      return NextResponse.json({ error: 'Title required.' }, { status: 400 });

    const slug = slugify(data.title, data.author || '');
    const now  = new Date().toISOString();
    const stockCount = parseInt(data.stockCount) || 0;
    const book = {
      slug,
      sku:         data.sku?.trim() || '',
      title:       data.title?.trim() || '',
      titleAr:     data.titleAr?.trim() || '',
      author:      data.author?.trim() || '',
      authorAr:    data.authorAr?.trim() || '',
      language:    data.language || 'Arabic',
      category:    data.category || 'General',
      description: data.description?.trim() || '',
      volumes:     parseInt(data.volumes) || 1,
      binding:     data.binding || '',
      pages:       parseInt(data.pages) || 0,
      mrp:         parseFloat(data.mrp) || 0,
      price:       parseFloat(data.price) || 0,
      offerType:   data.offerType || '',
      stockCount,
      inStock:     stockCount > 0,
      tags:        data.tags || [],
      coverUrl:    data.coverUrl || '',
      createdAt:   now, updatedAt: now,
    };

    await redis.set(`mn_book:${slug}`, book);
    const meta = await redis.get('mn_books_meta') || [];
    const m = { slug, sku: book.sku, title: book.title, titleAr: book.titleAr, author: book.author,
                category: book.category, language: book.language, binding: book.binding,
                volumes: book.volumes, pages: book.pages, mrp: book.mrp, price: book.price,
                offerType: book.offerType, stockCount, inStock: book.inStock,
                tags: book.tags, coverUrl: book.coverUrl, createdAt: now };
    const idx = meta.findIndex(b => b.slug === slug);
    if (idx >= 0) meta[idx] = m; else meta.unshift(m);
    await redis.set('mn_books_meta', meta);
    return NextResponse.json({ success: true, slug });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save.' }, { status: 500 });
  }
}
