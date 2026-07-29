import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60; // 15 minutes

export async function POST(req) {
  try {
    const { password } = await req.json();
    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'ADMIN_PASSWORD not set.' }, { status: 500 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const failKey = `mn_auth_fail:${ip}`;
    const fails = Number(await redis.get(failKey)) || 0;

    if (fails >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many attempts. Please try again in a few minutes.' }, { status: 429 });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      const next = fails + 1;
      await redis.set(failKey, next, { ex: LOCKOUT_SECONDS });
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    await redis.del(failKey);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Auth failed.' }, { status: 500 });
  }
}
