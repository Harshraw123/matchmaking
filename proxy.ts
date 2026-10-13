import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('tdc_session')?.value;

  // Static assets and internal routes are allowed
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === '/') {
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Login & Sign-up page access
  if (pathname === '/sign-in') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/login' || pathname === '/sign-up') {
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected application routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/customers')) {
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
