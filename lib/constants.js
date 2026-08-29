// These three are just the starting/seed values. The live, editable lists
// (which admins can add new options to from the admin panel) are stored in
// Redis under 'mn_taxonomy' and served via /api/taxonomy. These DEFAULT_
// exports are used only as the initial seed and as an offline/loading
// fallback — the source of truth once the app has loaded is the taxonomy
// fetched from the API.
export const DEFAULT_CATEGORIES = [
  'Aqeedah', 'Fiqh', 'Hadith', 'Tafsir', 'Seerah',
  'Manners & Character', 'History', 'Arabic Language',
  'Dua & Dhikr', 'Quran & Tajweed', 'General',
];
export const DEFAULT_LANGUAGES   = ['Arabic', 'Urdu', 'English', 'Bilingual'];
export const DEFAULT_OFFER_TYPES = ['Sale', 'Limited Edition', 'Limited Deal', 'Limited Time Offer'];

export const BINDINGS = ['Hardcover', 'Paperback'];
export const TAGS     = ['New Arrival', 'Bestseller', 'Featured', 'Recommended'];

// Which book fields are required vs optional — shared by the admin form
// (for validation + the "*" markers) and the API routes (server-side check).
export const MANDATORY_BOOK_FIELDS = ['title', 'author', 'category', 'language', 'price', 'stockCount', 'binding'];
export const OPTIONAL_BOOK_FIELDS  = [
  'translator', 'sku', 'description', 'volumes',
  'pages', 'mrp', 'offerType', 'tags', 'coverUrl', 'gallery',
];

export const IG_HANDLE = '@maktabahannoor';
export const IG_URL    = 'https://www.instagram.com/maktabahannoor';

// Featured Instagram posts are now managed from the admin panel (Homepage
// tab) rather than here — see components/InstagramEmbed.jsx.

// WhatsApp number in international format without + or spaces (e.g. 919876543210)
export const WA_NUMBER = '918825901086';

export const EMAIL         = 'maktabahannoor@gmail.com';
export const PHONE_DISPLAY = '+91 88259 01086';

export function slugify(title, author = '') {
  return `${title}-${author}`.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

// For author/publisher/translator page URLs — turns "Mohammed Thajammul
// Hussain Manna" into "mohammed-thajammul-hussain-manna" instead of the raw
// name with %20s in it. These pages have no stored record of their own
// (they're just books grouped by a shared field value), so matching happens
// by comparing this same slug form on both sides.
export function nameSlug(name = '') {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function fmtPrice(n) {
  return n ? `₹${Number(n).toLocaleString('en-IN')}` : '';
}
