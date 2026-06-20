import { NextRequest, NextResponse } from 'next/server';

const zasticeneRute = [
  '/dashboard',
  '/organizer',
  '/admin',
  '/join',
  '/events',
  '/feed',
  '/report',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const jeZasticenaRuta = zasticeneRute.some((ruta) =>
    pathname.startsWith(ruta)
  );

  if (!jeZasticenaRuta) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token');

  if (!token) {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/organizer/:path*',
    '/admin/:path*',
    '/join/:path*',
    '/events/:path*',
    '/feed/:path*',
    '/report/:path*',
  ],
};