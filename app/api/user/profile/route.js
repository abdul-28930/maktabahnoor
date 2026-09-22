import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { getUserFromSessionToken, sanitizeUser, hashPassword, verifyPassword } from '@/lib/userAuth';

export async function GET(req) {
  try {
    const token = req.cookies.get('mn_user_token')?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const user = await getUserFromSessionToken(token);
    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (e) {
    return NextResponse.json({ user: null });
  }
}

export async function PUT(req) {
  try {
    const token = req.cookies.get('mn_user_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const user = await getUserFromSessionToken(token);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const body = await req.json();
    const { username, phone, whatsapp, interestedCategories, currentPassword, newPassword } = body;

    let updatedUser = { ...user };

    // 1. Update username if changed
    if (username && username.trim() !== user.username) {
      const cleanUsername = username.trim();
      if (cleanUsername.length < 3 || cleanUsername.length > 30) {
        return NextResponse.json({ error: 'Username must be between 3 and 30 characters.' }, { status: 400 });
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
        return NextResponse.json({ error: 'Username can only contain letters, numbers, underscores, and dots.' }, { status: 400 });
      }

      const lowerNew = cleanUsername.toLowerCase();
      const lowerOld = user.username.toLowerCase();

      const existingOwner = await redis.get(`mn_username:${lowerNew}`);
      if (existingOwner && existingOwner !== user.id) {
        return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 });
      }

      await redis.del(`mn_username:${lowerOld}`);
      await redis.set(`mn_username:${lowerNew}`, user.id);
      updatedUser.username = cleanUsername;
    }

    // 2. Change password if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password.' }, { status: 400 });
      }
      const isCurrentValid = verifyPassword(currentPassword, user.passwordHash, user.salt);
      if (!isCurrentValid) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
      }
      const { hash, salt } = hashPassword(newPassword);
      updatedUser.passwordHash = hash;
      updatedUser.salt = salt;
    }

    // 3. Contact details
    if (phone !== undefined) updatedUser.phone = String(phone || '').trim();
    if (whatsapp !== undefined) updatedUser.whatsapp = String(whatsapp || '').trim();

    // 4. Interested categories
    if (Array.isArray(interestedCategories)) {
      updatedUser.interestedCategories = interestedCategories.filter(Boolean);
    }

    updatedUser.updatedAt = new Date().toISOString();

    await redis.set(`mn_user:${user.id}`, updatedUser);

    return NextResponse.json({
      success: true,
      user: sanitizeUser(updatedUser),
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
