import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ensureThumbnail } from '@/lib/thumbnails';
import { META_COVER_MAX_CHARS } from '@/lib/constants';

// One-time fix: mn_books_meta had oversized base64 cover images accumulated
// from past saves, which pushed the shared record to Redis's 10MB limit.
// This compresses any oversized cover in the shared list down to a small
// thumbnail (<40KB), keeping the images visible on listing pages while keeping
// the total shared list well under 1-2 MB.
export async function POST(req) {
  try {
    const { password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const meta = await redis.get('mn_books_meta') || [];
    let trimmed = 0;
    const cleaned = [];
    for (const b of meta) {
      if (b.coverUrl && b.coverUrl.startsWith('data:') && b.coverUrl.length > META_COVER_MAX_CHARS) {
        trimmed++;
        const thumb = await ensureThumbnail('', b.coverUrl);
        cleaned.push({ ...b, coverUrl: thumb });
      } else {
        cleaned.push(b);
      }
    }
    await redis.set('mn_books_meta', cleaned);
    revalidatePath('/');
    return NextResponse.json({ success: true, trimmed, total: meta.length });
  } catch (e) {
    console.error('cleanup-meta:', e);
    return NextResponse.json({ error: e?.message || 'Failed.' }, { status: 500 });
  }
}
