import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { metaSafeCoverUrl } from '@/lib/constants';

// One-time fix: mn_books_meta had oversized base64 cover images accumulated
// from past saves, which could push the whole shared record past Redis's
// request-size limit and make ALL book saves fail with a 500. This strips
// any oversized cover from the shared list (each book's own record/page is
// untouched — this only affects listing-page thumbnails for the affected
// books, which will look normal again next time that book's cover is
// re-uploaded, since uploads are now auto-compressed).
export async function POST(req) {
  try {
    const { password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const meta = await redis.get('mn_books_meta') || [];
    let trimmed = 0;
    const cleaned = meta.map(b => {
      const safe = metaSafeCoverUrl(b.coverUrl);
      if (safe !== b.coverUrl) trimmed++;
      return { ...b, coverUrl: safe };
    });
    await redis.set('mn_books_meta', cleaned);
    revalidatePath('/');
    return NextResponse.json({ success: true, trimmed, total: meta.length });
  } catch (e) {
    console.error('cleanup-meta:', e);
    return NextResponse.json({ error: e?.message || 'Failed.' }, { status: 500 });
  }
}
