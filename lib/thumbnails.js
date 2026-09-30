/**
 * ensureThumbnail — kept as a no-op stub so existing callers compile without
 * changes. The shared mn_books_meta list now stores /api/books/[slug]/cover
 * (a URL path) instead of an image blob, so thumbnail generation is no longer
 * needed and Jimp has been removed.
 */
export async function ensureThumbnail(_coverThumb, _coverUrl) {
  return '';
}
