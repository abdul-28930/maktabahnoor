import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { slugify, nameSlug, splitAuthors, splitTranslators, metaSafeCoverUrl, getBookCategories } from '@/lib/constants';
import { ensureThumbnail } from '@/lib/thumbnails';

const MANDATORY_EBOOK_FIELDS = ['title', 'category', 'language', 'price', 'binding'];
const FIELD_LABELS = { title: 'Title', author: 'Author', category: 'Category', language: 'Language', price: 'Price', binding: 'Binding' };

function missingMandatoryFields(data) {
  return MANDATORY_EBOOK_FIELDS.filter(k => {
    if (data.comingSoon && k === 'price') return false;
    if (k === 'category') {
      const cats = getBookCategories(data);
      return cats.length === 0;
    }
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
  const isAdmin  = searchParams.get('password') === process.env.ADMIN_PASSWORD;
  try {
    const meta = await redis.get('mn_ebooks_meta') || [];
    let list = isAdmin ? meta : meta.filter(b => b.visible !== false);
    if (!all) list = list.filter(b => b.comingSoon || b.inStock !== false);
    if (category) list = list.filter(b => getBookCategories(b).includes(category));
    if (language)  list = list.filter(b => b.language === language);
    if (tag)       list = list.filter(b => b.tags?.includes(tag));
    if (author)    list = list.filter(b => splitAuthors(b.author).some(a => nameSlug(a) === nameSlug(author)));
    if (publisher) list = list.filter(b => nameSlug(b.publisher) === nameSlug(publisher));
    if (translator) list = list.filter(b => splitTranslators(b.translator).some(t => nameSlug(t) === nameSlug(translator)));
    list = list.sort((a, b) => {
      const aOrd = a.order ?? new Date(a.createdAt).getTime();
      const bOrd = b.order ?? new Date(b.createdAt).getTime();
      return aOrd - bOrd;
    });
    list = list.map(b => {
      const isComingSoon = Boolean(b.comingSoon);
      return {
        ...b,
        comingSoon: isComingSoon,
        inStock: !isComingSoon,
      };
    });
    return NextResponse.json(
      { ebooks: list },
      {
        headers: {
          'Cache-Control': isAdmin ? 'no-store' : 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch { return NextResponse.json({ ebooks: [] }); }
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

    const comingSoon = Boolean(data.comingSoon);
    // Prefix slug with "ebook-" to avoid collisions with book slugs
    const slug = 'ebook-' + slugify(data.title, data.author || '');
    const now  = new Date().toISOString();
    const categories = getBookCategories(data);
    const primaryCategory = categories[0] || 'General';
    const ebook = {
      slug,
      sku:         data.sku?.trim() || '',
      title:       data.title?.trim() || '',
      author:      data.author?.trim() || '',
      translator:  data.translator?.trim() || '',
      publisher:   data.publisher?.trim() || '',
      language:    data.language || 'Arabic',
      category:    primaryCategory,
      categories,
      description: data.description?.trim() || '',
      binding:     data.binding || '',
      pages:       parseInt(data.pages) || 0,
      mrp:         comingSoon ? 0 : (parseFloat(data.mrp) || 0),
      price:       comingSoon ? 0 : (parseFloat(data.price) || 0),
      offerType:   comingSoon ? '' : (data.offerType || ''),
      inStock:     !comingSoon,
      comingSoon,
      visible:     data.visible !== false,
      order:       (data.order !== undefined && data.order !== null) ? Number(data.order) : Date.now(),
      tags:        data.tags || [],
      coverUrl:    data.coverUrl || '',
      coverThumb:  await ensureThumbnail(data.coverThumb, data.coverUrl),
      gallery:     Array.isArray(data.gallery) ? data.gallery.filter(Boolean) : [],
      createdAt:   now, updatedAt: now,
    };

    await redis.set(`mn_ebook:${slug}`, ebook);
    const meta = await redis.get('mn_ebooks_meta') || [];
    const metaCoverUrl = (ebook.coverUrl && ebook.coverUrl.startsWith('data:'))
      ? `/api/ebooks/${slug}/cover`
      : (ebook.coverUrl || '');
    const m = { slug, sku: ebook.sku, title: ebook.title, author: ebook.author, translator: ebook.translator, publisher: ebook.publisher,
                category: ebook.category, categories: ebook.categories, language: ebook.language, binding: ebook.binding,
                pages: ebook.pages, mrp: ebook.mrp, price: ebook.price,
                offerType: ebook.offerType, inStock: ebook.inStock, comingSoon, visible: ebook.visible, order: ebook.order,
                tags: ebook.tags, coverUrl: metaCoverUrl, createdAt: now };
    const idx = meta.findIndex(b => b.slug === slug);
    if (idx >= 0) meta[idx] = m; else meta.unshift(m);
    await redis.set('mn_ebooks_meta', meta);
    revalidatePath('/');
    revalidatePath('/ebooks');
    return NextResponse.json({ success: true, slug });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || 'Failed to save.' }, { status: 500 });
  }
}
