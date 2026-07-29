import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

// Record a page view for a book. Fire-and-forget from the client — never
// blocks page rendering, and failures here should never surface to the user.
export async function POST(req) {
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ success: false }, { status: 400 });
    await redis.hincrby('mn_book_views', slug, 1);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

// Admin-only: fetch view counts for all books (password passed as query param,
// consistent with this project's existing lightweight auth pattern).
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const password = searchParams.get('password');
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const views = await redis.hgetall('mn_book_views') || {};
    return NextResponse.json({ views });
  } catch (e) {
    return NextResponse.json({ views: {} });
  }
}
