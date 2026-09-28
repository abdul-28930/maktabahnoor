import { metaSafeCoverUrl, META_COVER_MAX_CHARS } from './constants';

/**
 * Ensures a cover thumbnail is small enough for the shared mn_books_meta list.
 * If coverThumb is already small enough, returns it.
 * If coverUrl is an external link (http/https), returns it.
 * If coverUrl is a base64 data URL and coverThumb is missing, generates a 220px JPEG thumbnail using Jimp.
 */
export async function ensureThumbnail(coverThumb, coverUrl) {
  if (coverThumb && coverThumb.length <= META_COVER_MAX_CHARS) {
    return coverThumb;
  }
  if (!coverUrl) return '';
  if (!coverUrl.startsWith('data:')) {
    return coverUrl;
  }
  if (coverUrl.length <= META_COVER_MAX_CHARS) {
    return coverUrl;
  }

  // Generate thumbnail on server
  try {
    const { Jimp } = await import('jimp');
    const parts = coverUrl.split(',');
    if (parts.length < 2) return '';
    const buf = Buffer.from(parts[1], 'base64');
    const img = await Jimp.read(buf);
    img.resize({ w: 220 });
    const thumbBuf = await img.getBuffer('image/jpeg', { quality: 70 });
    return 'data:image/jpeg;base64,' + thumbBuf.toString('base64');
  } catch (err) {
    console.warn('ensureThumbnail generation fallback:', err?.message);
    return metaSafeCoverUrl(coverThumb || coverUrl);
  }
}
