import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import { authConfig } from '@/app/(auth)/auth.config';

export default NextAuth(authConfig).auth((request) => {
  const { pathname } = request.nextUrl;

  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.redirect(new URL('/', request.url));
  }
});

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register'],
};
