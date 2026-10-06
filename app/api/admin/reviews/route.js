import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/reviews?password=... → all pending reviews
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const password = searchParams.get('password');
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const pendingIndex = await redis.get('mn_reviews_pending') || [];
    // Fetch full review records for each pending entry
    const reviews = [];
    for (const entry of pendingIndex) {
      const key = `mn_reviews:${entry.itemId}`;
      const all = await redis.get(key) || [];
      const full = all.find(r => r.id === entry.id);
      if (full && full.status === 'pending') reviews.push(full);
    }
    return NextResponse.json({ reviews });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ reviews: [] });
  }
}

// PUT /api/admin/reviews  → approve or reject a review
// Body: { password, reviewId, itemId, action: 'approve' | 'reject' }
export async function PUT(req) {
  try {
    const { password, reviewId, itemId, action } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (!reviewId || !itemId || !['approve', 'reject'].includes(action))
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

    const key = `mn_reviews:${itemId}`;
    const all = await redis.get(key) || [];
    const idx = all.findIndex(r => r.id === reviewId);
    if (idx === -1) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });

    if (action === 'approve') {
      all[idx].status = 'approved';
    } else {
      // Remove the review entirely on reject
      all.splice(idx, 1);
    }
    await redis.set(key, all);

    // Remove from pending index
    const pendingIndex = await redis.get('mn_reviews_pending') || [];
    await redis.set('mn_reviews_pending', pendingIndex.filter(e => e.id !== reviewId));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
