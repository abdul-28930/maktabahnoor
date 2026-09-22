import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { verifyPassword, sanitizeUser, createSession } from '@/lib/userAuth';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    const cleanUsername = String(username || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const userId = await redis.get(`mn_username:${cleanUsername}`);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const user = await redis.get(`mn_user:${userId}`);
    if (!user || !user.passwordHash || !user.salt) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const isValid = verifyPassword(cleanPassword, user.passwordHash, user.salt);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const sessionToken = await createSession(userId);

    const res = NextResponse.json({
      success: true,
      user: sanitizeUser(user),
    });

    res.cookies.set('mn_user_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return res;
  } catch (e) {
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
