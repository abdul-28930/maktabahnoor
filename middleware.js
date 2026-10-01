import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname, search } = req.nextUrl;

  // Skip API routes, static assets, internal paths, and admin portal
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.png'
  ) {
    return NextResponse.next();
  }

  const userToken = req.cookies.get('mn_user_token')?.value;
  const guestToken = req.cookies.get('mn_guest')?.value;

  const isAuthenticated = Boolean(userToken);
  const isGuest = Boolean(guestToken);

  // If user visits /login while already authenticated, send them to destination or home
  if (pathname === '/login') {
    if (isAuthenticated) {
      const redirectParam = req.nextUrl.searchParams.get('redirect');
      const target = redirectParam && redirectParam.startsWith('/') && redirectParam !== '/login'
        ? redirectParam
        : '/';
      return NextResponse.redirect(new URL(target, req.url));
    }
    return NextResponse.next();
  }

  // Profile page requires authentication
  if (pathname.startsWith('/profile') && !isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
