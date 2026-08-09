import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { DEFAULT_CATEGORIES, DEFAULT_LANGUAGES, DEFAULT_OFFER_TYPES } from '@/lib/constants';

const TAXONOMY_KEY = 'mn_taxonomy';
const FIELDS = ['categories', 'languages', 'offerTypes'];

function seedTaxonomy() {
  return {
    categories: [...DEFAULT_CATEGORIES],
    languages:  [...DEFAULT_LANGUAGES],
    offerTypes: [...DEFAULT_OFFER_TYPES],
  };
}

// Merge whatever is stored with the current defaults (so a code deploy that
// adds a new default option shows up even for stores that already have a
// taxonomy record saved), de-duplicated case-insensitively.
function mergeWithDefaults(stored) {
  const seed = seedTaxonomy();
  const out = {};
  for (const field of FIELDS) {
    const combined = [...(stored?.[field] || []), ...seed[field]];
    const seen = new Set();
    out[field] = combined.filter(v => {
      const key = String(v).trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return out;
}

// Public — every visitor's browser needs this to render category/language
// filters and admin needs it to populate the book form dropdowns.
export async function GET() {
  try {
    const stored = await redis.get(TAXONOMY_KEY);
    const taxonomy = mergeWithDefaults(stored);
    return NextResponse.json({ taxonomy });
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

    const stored = mergeWithDefaults(await redis.get(TAXONOMY_KEY));
    const exists = stored[field].some(v => v.toLowerCase() === trimmed.toLowerCase());
    if (!exists) stored[field] = [...stored[field], trimmed];

    await redis.set(TAXONOMY_KEY, stored);
    return NextResponse.json({ success: true, taxonomy: stored });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save.' }, { status: 500 });
  }
}
