export const CATEGORIES = [
  'Aqeedah', 'Fiqh', 'Hadith', 'Tafsir', 'Seerah',
  'Manners & Character', 'History', 'Arabic Language',
  'Dua & Dhikr', 'Quran & Tajweed', 'General',
];

export const LANGUAGES = ['Arabic', 'Urdu', 'English', 'Bilingual'];

export const BINDINGS = ['Hardcover', 'Softcover', 'Paperback'];

export const TAGS = ['New Arrival', 'Bestseller', 'Featured', 'Recommended'];

export const IG_HANDLE = '@maktabah_an_noor'; // update when client provides
export const IG_URL    = 'https://instagram.com/maktabah_an_noor';

export function slugify(title, author = '') {
  const base = `${title}-${author}`.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base.slice(0, 80);
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}
