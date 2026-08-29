import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { slugify, nameSlug, splitAuthors, MANDATORY_BOOK_FIELDS } from '@/lib/constants';

const FIELD_LABELS = { title: 'Title', author: 'Author', category: 'Category', language: 'Language', price: 'Price', stockCount: 'Stock Count', binding: 'Binding' };

function missingMandatoryFields(data) {
  return MANDATORY_BOOK_FIELDS.filter(k => {
    const v = data[k];
    return v === undefined || v === null || String(v).trim() === '';
  }).map(k => FIELD_LABELS[k] || k);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const language = searchParams.get('language');
  const tag      = searchParams.get('tag');
  const author   = searchParams.get('author');
  const publisher = searchParams.get('publisher');
  const translator = searchParams.get('translator');
  const all      = searchParams.get('all') === '1';
  // Only the admin panel (which sends its session password) can see books
  // that have been hidden from the storefront. Every other caller — the
  // public listing, the author page, related-books, etc. — never sees them,
  // regardless of the `all` (out-of-stock-inclusive) flag.
  const isAdmin  = searchParams.get('password') === process.env.ADMIN_PASSWORD;
  try {
    const meta = await redis.get('mn_books_meta') || [];
    let list = isAdmin ? meta : meta.filter(b => b.visible !== false);
    if (!all) list = list.filter(b => (b.stockCount ?? (b.inStock ? 1 : 0)) > 0);
    if (category) list = list.filter(b => b.category === category);
    if (language)  list = list.filter(b => b.language === language);
    if (tag)       list = list.filter(b => b.tags?.includes(tag));
    if (author)    list = list.filter(b => splitAuthors(b.author).some(a => nameSlug(a) === nameSlug(author)));
    if (publisher) list = list.filter(b => nameSlug(b.publisher) === nameSlug(publisher));
    if (translator) list = list.filter(b => nameSlug(b.translator) === nameSlug(translator));
    // Out-of-stock books sink to the bottom by default; newest-first within
    // each group. Pages that want a different order (e.g. the /books
    // listing's sort dropdown) re-sort this on the client.
    list = list.sort((a, b) => {
      const aOut = (a.stockCount ?? (a.inStock ? 1 : 0)) <= 0 ? 1 : 0;
      const bOut = (b.stockCount ?? (b.inStock ? 1 : 0)) <= 0 ? 1 : 0;
      if (aOut !== bOut) return aOut - bOut;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return NextResponse.json({ books: list });
  } catch { return NextResponse.json({ books: [] }); }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { password, ...data } = body;
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const missing = missingMandatoryFields(data);
    if (missing.length)
      return NextResponse.json({ error: `Required field${missing.length > 1 ? 's' : ''} missing: ${missing.join(', ')}.` }, { status: 400 });

    const slug = slugify(data.title, data.author || '');
    const now  = new Date().toISOString();
    const stockCount = Math.max(0, parseInt(data.stockCount) || 0);
    const book = {
      slug,
      sku:         data.sku?.trim() || '',
      title:       data.title?.trim() || '',
      author:      data.author?.trim() || '',
      translator:  data.translator?.trim() || '',
      publisher:   data.publisher?.trim() || '',
      language:    data.language || 'Arabic',
      category:    data.category || 'General',
      description: data.description?.trim() || '',
      volumes:     data.volumes ? parseInt(data.volumes) : null,
      binding:     data.binding || '',
      pages:       parseInt(data.pages) || 0,
      mrp:         parseFloat(data.mrp) || 0,
      price:       parseFloat(data.price) || 0,
      offerType:   data.offerType || '',
      stockCount,
      inStock:     stockCount > 0,
      visible:     data.visible !== false,
      order:       Date.now(),
      tags:        data.tags || [],
      coverUrl:    data.coverUrl || '',
      gallery:     Array.isArray(data.gallery) ? data.gallery.filter(Boolean) : [],
      createdAt:   now, updatedAt: now,
    };

    await redis.set(`mn_book:${slug}`, book);
    await redis.set(`mn_stock:book:${slug}`, stockCount);
    const meta = await redis.get('mn_books_meta') || [];
    const m = { slug, sku: book.sku, title: book.title, author: book.author, translator: book.translator, publisher: book.publisher,
                category: book.category, language: book.language, binding: book.binding,
                volumes: book.volumes, pages: book.pages, mrp: book.mrp, price: book.price,
                offerType: book.offerType, stockCount, inStock: book.inStock, visible: book.visible, order: book.order,
                tags: book.tags, coverUrl: book.coverUrl, createdAt: now };
    const idx = meta.findIndex(b => b.slug === slug);
    if (idx >= 0) meta[idx] = m; else meta.unshift(m);
    await redis.set('mn_books_meta', meta);
    revalidatePath('/');
    return NextResponse.json({ success: true, slug });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save.' }, { status: 500 });
  }
}
