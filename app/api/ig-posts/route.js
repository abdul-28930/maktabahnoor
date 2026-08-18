import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const KEY = 'mn_ig_posts';

export async function GET() {
  try {
    const posts = await redis.get(KEY) || [];
    return NextResponse.json({ posts });
  } catch { return NextResponse.json({ posts: [] }); }
}

export async function POST(req) {
  try {
    const { password, posts } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const clean = Array.isArray(posts) ? posts.map(u => u.trim()).filter(Boolean).slice(0, 3) : [];
    await redis.set(KEY, clean);
    revalidatePath('/');
    return NextResponse.json({ success: true, posts: clean });
  } catch (e) { return NextResponse.json({ error: 'Failed to save.' }, { status: 500 }); }
}
