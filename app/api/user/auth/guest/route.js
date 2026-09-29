import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const redirectTarget = searchParams.get('redirect') || '/';
  const target = redirectTarget.startsWith('/') && redirectTarget !== '/login'
    ? redirectTarget
    : '/';

  const res = NextResponse.redirect(new URL(target, request.url));
  res.cookies.set('mn_guest', '1', {
    path: '/',
    maxAge: 86400, // 24 hours
    sameSite: 'lax',
    httpOnly: false,
  });
  return res;
}

export async function POST(request) {
  const res = NextResponse.json({ success: true, guest: true });
  res.cookies.set('mn_guest', '1', {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
    httpOnly: false,
  });
  return res;
}
