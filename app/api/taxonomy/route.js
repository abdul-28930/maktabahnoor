import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { DEFAULT_CATEGORIES, DEFAULT_LANGUAGES, DEFAULT_OFFER_TYPES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const TAXONOMY_KEY = 'mn_taxonomy';
const FIELDS = ['categories', 'languages', 'offerTypes'];

function seedTaxonomy() {
  return {
    categories: [...DEFAULT_CATEGORIES],
    languages:  [...DEFAULT_LANGUAGES],
    offerTypes: [...DEFAULT_OFFER_TYPES],
  };
}

// Ensures each field exists as an array. If stored is null or a field was never set,
// seeds it with defaults. Stored categories in Redis are the source of truth,
// so deleted categories are never re-added.
function normalizeTaxonomy(stored) {
  if (!stored || typeof stored !== 'object') {
    return seedTaxonomy();
  }
  return {
    categories: Array.isArray(stored.categories) ? stored.categories : [...DEFAULT_CATEGORIES],
    languages:  Array.isArray(stored.languages)  ? stored.languages  : [...DEFAULT_LANGUAGES],
    offerTypes: Array.isArray(stored.offerTypes) ? stored.offerTypes : [...DEFAULT_OFFER_TYPES],
  };
}

// Public — every visitor's browser needs this to render category/language
// filters and admin needs it to populate the book form dropdowns.
export async function GET(req) {
  try {
    const stored = await redis.get(TAXONOMY_KEY);
    const taxonomy = normalizeTaxonomy(stored);

    if (!stored) {
      await redis.set(TAXONOMY_KEY, taxonomy);
    }

    const url = new URL(req?.url || 'http://localhost');
    const isFresh = url.searchParams.has('t') || url.searchParams.has('fresh');
    const cacheHeader = isFresh
      ? 'no-store, no-cache, must-revalidate'
      : 'public, s-maxage=10, stale-while-revalidate=30';

    return NextResponse.json(
      { taxonomy },
      {
        headers: {
          'Cache-Control': cacheHeader,
        },
      }
    );
  } catch {
    return NextResponse.json({ taxonomy: seedTaxonomy() });
  }
}

// Admin-only — add a new option to categories / languages / offerTypes.
export async function POST(req) {
  try {
    const { password, field, value } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (!FIELDS.includes(field))
      return NextResponse.json({ error: 'Invalid field.' }, { status: 400 });
    const trimmed = String(value || '').trim();
    if (!trimmed)
      return NextResponse.json({ error: 'Value required.' }, { status: 400 });

    const stored = normalizeTaxonomy(await redis.get(TAXONOMY_KEY));
    const exists = stored[field].some(v => v.toLowerCase() === trimmed.toLowerCase());
    if (!exists) stored[field] = [...stored[field], trimmed];

    await redis.set(TAXONOMY_KEY, stored);
    revalidatePath('/');
    revalidatePath('/books');
    revalidatePath('/admin');
    return NextResponse.json({ success: true, taxonomy: stored });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save.' }, { status: 500 });
  }
}
