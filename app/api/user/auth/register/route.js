import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { hashPassword, sanitizeUser, createSession } from '@/lib/userAuth';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    const cleanUsername = String(username || '').trim();
    const cleanPassword = String(password || '');

    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30) {
      return NextResponse.json({ error: 'Username must be between 3 and 30 characters.' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, underscores, and dots.' }, { status: 400 });
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const lowerUsername = cleanUsername.toLowerCase();
    const existingUserId = await redis.get(`mn_username:${lowerUsername}`);
    if (existingUserId) {
      return NextResponse.json({ error: 'Username is already taken. Please choose another.' }, { status: 409 });
    }

    const userId = 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const { hash, salt } = hashPassword(cleanPassword);

    const newUser = {
      id: userId,
      username: cleanUsername,
      passwordHash: hash,
      salt: salt,
      phone: '',
      whatsapp: '',
      interestedCategories: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await redis.set(`mn_user:${userId}`, newUser);
    await redis.set(`mn_username:${lowerUsername}`, userId);

    const userList = await redis.get('mn_users_index') || [];
    if (!userList.includes(userId)) {
      userList.unshift(userId);
      await redis.set('mn_users_index', userList);
    }

    const sessionToken = await createSession(userId);

    const res = NextResponse.json({
      success: true,
      user: sanitizeUser(newUser),
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
    return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 });
  }
}
