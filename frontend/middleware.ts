import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    
    // If no token exists, redirect to home page
    if (!token) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Add the session token to API requests
    if (req.nextUrl.pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-email', `${token?.email}`);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: '/',
    }
  }
);

export const config = {
  matcher: [
    '/api/:path*',
    '/user-groups/:path*',
    '/permissions/:path*',
    '/contacts/:path*',
    '/admin/:path*'
  ]
}; 