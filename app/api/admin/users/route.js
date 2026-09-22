import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { sanitizeUser } from '@/lib/userAuth';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const password = searchParams.get('password');
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const userIds = await redis.get('mn_users_index') || [];
    const users = [];
    const categoryDemand = {}; // category -> count

    for (const id of userIds) {
      const u = await redis.get(`mn_user:${id}`);
      if (u) {
        users.push(sanitizeUser(u));

        // Count category interests
        if (Array.isArray(u.interestedCategories)) {
          for (const cat of u.interestedCategories) {
            const cleanCat = String(cat).trim();
            if (cleanCat) {
              categoryDemand[cleanCat] = (categoryDemand[cleanCat] || 0) + 1;
            }
          }
        }
      }
    }

    // Sort users newest first
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Sort category demand descending
    const sortedCategories = Object.entries(categoryDemand)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      users,
      categoryDemand: sortedCategories,
    });
  } catch (e) {
    console.error('Admin users fetch error:', e);
    return NextResponse.json({ users: [], categoryDemand: [] });
  }
}
