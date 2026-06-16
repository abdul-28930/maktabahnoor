export const CATEGORIES = [
  'Aqeedah', 'Fiqh', 'Hadith', 'Tafsir', 'Seerah',
  'Manners & Character', 'History', 'Arabic Language',
  'Dua & Dhikr', 'Quran & Tajweed', 'General',
];
export const LANGUAGES    = ['Arabic', 'Urdu', 'English', 'Bilingual'];
export const BINDINGS     = ['Hardcover', 'Softcover', 'Paperback'];
export const TAGS         = ['New Arrival', 'Bestseller', 'Featured', 'Recommended'];
export const OFFER_TYPES  = ['Sale', 'Limited Edition', 'Limited Deal', 'Limited Time Offer'];

export const IG_HANDLE = '@maktabahannoor';
export const IG_URL    = 'https://instagram.com/maktabahannoor';

export function slugify(title, author = '') {
  return `${title}-${author}`.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export function fmtPrice(n) {
  return n ? `₹${Number(n).toLocaleString('en-IN')}` : '';
}
