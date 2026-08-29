import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const KEY = 'mn_ig_posts';

export async function GET() {
  try {
    const raw = await redis.get(KEY) || [];
    // Normalize old format (plain URL strings) to {url, image}.
    const posts = raw.map(p => typeof p === 'string' ? { url: p, image: '' } : p);
    return NextResponse.json({ posts });
  } catch { return NextResponse.json({ posts: [] }); }
}

export async function POST(req) {
  try {
    const { password, posts } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const clean = Array.isArray(posts)
      ? posts.map(p => ({ url: (p.url||'').trim(), image: (p.image||'').trim() })).filter(p => p.url).slice(0, 6)
      : [];
    await redis.set(KEY, clean);
    revalidatePath('/');
    return NextResponse.json({ success: true, posts: clean });
  } catch (e) { return NextResponse.json({ error: 'Failed to save.' }, { status: 500 }); }
}
