import redis from '@/lib/redis';

export async function GET(req, { params }) {
  const { slug } = params;
  try {
    const book = await redis.get(`mn_book:${slug}`);
    if (!book || !book.coverUrl) {
      return new Response('Not found', { status: 404 });
    }

    const cover = book.coverUrl;

    // External URLs can simply be redirected
    if (cover.startsWith('http://') || cover.startsWith('https://')) {
      return Response.redirect(cover, 302);
    }

    // Base64 data URLs
    if (cover.startsWith('data:')) {
      const commaIdx = cover.indexOf(',');
      if (commaIdx === -1) {
        return new Response('Invalid image data', { status: 500 });
      }
      const header = cover.slice(0, commaIdx);
      const b64Data = cover.slice(commaIdx + 1);

      const typeMatch = header.match(/data:([^;]+)/);
      const contentType = typeMatch ? typeMatch[1] : 'image/jpeg';
      const buffer = Buffer.from(b64Data, 'base64');

      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    return new Response('Not found', { status: 404 });
  } catch (err) {
    console.error(`Error serving cover for book ${slug}:`, err);
    return new Response('Internal error', { status: 500 });
  }
}
