import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes for App Router structure
const protectedRoutes = [
    // Dashboard routes in the (dashboard) route group
    '/',
    '/campaigns',
    '/geo-fencing',
    '/analytics',
];

// Define public routes
const publicRoutes = ['/login'];

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const { pathname } = request.nextUrl;

    // Check if the route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    // Check if the route is public
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    // Redirect to login if trying to access a protected route without auth
    if (isProtectedRoute && !token) {
        const url = new URL('/login', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // Redirect to dashboard if trying to access login while already authenticated
    if (isPublicRoute && token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images (public files)
         * - api routes
         */
        '/((?!_next/static|_next/image|favicon.ico|images|api).*)',
    ],
};