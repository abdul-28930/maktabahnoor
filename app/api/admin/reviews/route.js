import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/reviews?password=... → all reviews (approved, auto-approved, pending, rejected)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const password = searchParams.get('password');
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const keys = await redis.keys('mn_reviews:*');
    if (!keys || keys.length === 0) {
      return NextResponse.json({ reviews: [] });
    }

    const results = await redis.mget(...keys);
    const reviews = [];
    for (const list of results) {
      if (Array.isArray(list)) {
        reviews.push(...list);
      }
    }

    // Sort newest first
    reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return NextResponse.json({ reviews });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ reviews: [] });
  }
}

// PUT /api/admin/reviews  → approve, reject, or delete a review
// Body: { password, reviewId, itemId, action: 'approve' | 'reject' | 'delete' }
export async function PUT(req) {
  try {
    const { password, reviewId, itemId, action } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (!reviewId || !itemId || !['approve', 'reject', 'delete'].includes(action))
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

    const key = `mn_reviews:${itemId}`;
    const all = await redis.get(key) || [];
    const idx = all.findIndex(r => r.id === reviewId);
    if (idx === -1) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });

    if (action === 'approve') {
      all[idx].status = 'approved';
    } else if (action === 'reject') {
      all[idx].status = 'rejected';
    } else if (action === 'delete') {
      all.splice(idx, 1);
    }
    await redis.set(key, all);

    // Remove from pending index if it was pending
    const pendingIndex = await redis.get('mn_reviews_pending') || [];
    if (pendingIndex.some(e => e.id === reviewId)) {
      await redis.set('mn_reviews_pending', pendingIndex.filter(e => e.id !== reviewId));
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}

// DELETE /api/admin/reviews → permanently delete a review
// Accepts params via URL searchParams or JSON body
export async function DELETE(req) {
  try {
    let password, reviewId, itemId;
    const { searchParams } = new URL(req.url);
    if (searchParams.get('reviewId')) {
      password = searchParams.get('password');
      reviewId = searchParams.get('reviewId');
      itemId = searchParams.get('itemId');
    } else {
      const body = await req.json().catch(() => ({}));
      password = body.password;
      reviewId = body.reviewId;
      itemId = body.itemId;
    }

    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (!reviewId || !itemId)
      return NextResponse.json({ error: 'Missing reviewId or itemId.' }, { status: 400 });

    const key = `mn_reviews:${itemId}`;
    const all = await redis.get(key) || [];
    const idx = all.findIndex(r => r.id === reviewId);
    if (idx === -1) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });

    all.splice(idx, 1);
    await redis.set(key, all);

    // Remove from pending index if present
    const pendingIndex = await redis.get('mn_reviews_pending') || [];
    if (pendingIndex.some(e => e.id === reviewId)) {
      await redis.set('mn_reviews_pending', pendingIndex.filter(e => e.id !== reviewId));
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete review.' }, { status: 500 });
  }
}
