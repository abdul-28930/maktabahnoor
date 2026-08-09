import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

const KEY = 'mn_homepage_picks';

// Public — the admin panel loads the current picks to edit, and there's
// nothing sensitive in a list of slugs (the homepage itself reads straight
// from Redis server-side, this route exists for the admin UI only).
export async function GET() {
  try {
    const picks = await redis.get(KEY) || { featured: [], newArrivals: [] };
    return NextResponse.json({ picks });
  } catch { return NextResponse.json({ picks: { featured: [], newArrivals: [] } }); }
}

export async function POST(req) {
  try {
    const { password, featured, newArrivals } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const picks = {
      featured:    Array.isArray(featured) ? featured.filter(Boolean) : [],
      newArrivals: Array.isArray(newArrivals) ? newArrivals.filter(Boolean) : [],
    };
    await redis.set(KEY, picks);
    return NextResponse.json({ success: true, picks });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save.' }, { status: 500 });
  }
}
