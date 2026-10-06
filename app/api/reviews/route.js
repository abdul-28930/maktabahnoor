import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { getUserFromSessionToken } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

// GET /api/reviews?itemId=book:sahih-al-bukhari  → approved reviews for that item
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');
    if (!itemId) return NextResponse.json({ reviews: [] });

    const key = `mn_reviews:${itemId}`;
    const all = await redis.get(key) || [];
    // Only return approved reviews publicly
    const approved = all.filter(r => r.status === 'approved');
    return NextResponse.json({ reviews: approved });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ reviews: [] });
  }
}

// POST /api/reviews  → submit a review
// Body: { itemId, itemType, rating, review, name?, purchaseDate? }
// itemId format: "book:{slug}" | "accessory:{id}" | "clothing:{id}"
export async function POST(req) {
  try {
    const body = await req.json();
    const { itemId, itemType, rating, review, name: guestName, purchaseDate } = body;

    if (!itemId || !itemType) return NextResponse.json({ error: 'Missing itemId or itemType.' }, { status: 400 });
    if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be 1–5.' }, { status: 400 });
    const trimmedReview = String(review || '').trim();
    if (!trimmedReview) return NextResponse.json({ error: 'Review text is required.' }, { status: 400 });
    const wordCount = trimmedReview.split(/\s+/).filter(Boolean).length;
    if (wordCount > 300) return NextResponse.json({ error: 'Review must be 300 words or fewer.' }, { status: 400 });

    // Determine if user is logged in
    const token = req.cookies.get('mn_user_token')?.value;
    const user = token ? await getUserFromSessionToken(token) : null;

    let reviewerName, reviewStatus, userId;

    if (user) {
      // Logged-in: use their username, auto-approve, verify purchase
      reviewerName = user.name || user.username;
      userId = user.id;

      // Check if user has actually purchased this item
      const index = await redis.get('mn_orders_index') || [];
      const map = await redis.hgetall('mn_orders') || {};
      const userOrders = index.map(ref => map[ref]).filter(o => o && o.userId === user.id);

      const hasPurchased = userOrders.some(order => {
        if (!Array.isArray(order.items)) return false;
        return order.items.some(item => {
          if (itemType === 'book') return item.slug === itemId.replace('book:', '');
          if (itemType === 'accessory') {
            const slug = itemId.replace('accessory:', '');
            return item.slug && (item.slug === `accessory:${slug}` || item.slug?.startsWith(`accessory:${slug}:`));
          }
          if (itemType === 'clothing') {
            const slug = itemId.replace('clothing:', '');
            return item.slug && (item.slug === `clothing:${slug}` || item.slug?.startsWith(`clothing:${slug}:`));
          }
          return false;
        });
      });

      if (!hasPurchased) {
        return NextResponse.json({ error: 'Only customers who have purchased this item can leave a review.' }, { status: 403 });
      }

      reviewStatus = 'approved'; // logged-in users are auto-approved
    } else {
      // Guest: require name and purchase date, goes to pending
      const cleanName = String(guestName || '').trim();
      if (!cleanName) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
      if (!purchaseDate) return NextResponse.json({ error: 'Date of purchase is required.' }, { status: 400 });
      reviewerName = cleanName;
      userId = null;
      reviewStatus = 'pending';
    }

    const now = new Date().toISOString();
    const reviewRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      itemId,
      itemType,
      userId: userId || null,
      reviewerName,
      rating: Number(rating),
      review: trimmedReview,
      purchaseDate: user ? null : purchaseDate,
      status: reviewStatus,
      createdAt: now,
    };

    // Store review under item key
    const key = `mn_reviews:${itemId}`;
    const existing = await redis.get(key) || [];
    existing.push(reviewRecord);
    await redis.set(key, existing);

    // Also add to global pending index if not auto-approved
    if (reviewStatus === 'pending') {
      const pendingIndex = await redis.get('mn_reviews_pending') || [];
      pendingIndex.unshift({ id: reviewRecord.id, itemId, itemType, reviewerName, rating: reviewRecord.rating, createdAt: now });
      await redis.set('mn_reviews_pending', pendingIndex);
    }

    return NextResponse.json({
      success: true,
      status: reviewStatus,
      message: reviewStatus === 'approved'
        ? 'Review submitted successfully!'
        : 'Thank you! Your review has been submitted and will appear after verification.',
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to submit review.' }, { status: 500 });
  }
}
