
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from './lib/auth';

// Define routes for App Router structure
const protectedRoutes = [
    // Dashboard routes
    '/',
    '/campaigns',
    '/geo-fencing',
    '/analytics',
];

// Admin-only routes
const adminRoutes = [
    '/admin',
    '/admin/users',
];

// Define public routes
const publicRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get the token from cookies
    const token = request.cookies.get('auth_token')?.value;

    // Check if the route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    // Check if the route is admin-only
    const isAdminRoute = adminRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    // Check if the route is public
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    // If no token and trying to access protected route, redirect to login
    if (isProtectedRoute && !token) {
        const url = new URL('/login', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // If trying to access admin route, verify role
    if (isAdminRoute && token) {
        const userData = verifyAccessToken(token);

        // If token is invalid or user is not an admin, redirect to dashboard
        if (!userData || userData.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // If has token and trying to access public route, redirect to dashboard
    if (isPublicRoute && token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|images|api/(?!auth)|login).*)',
    ],
    runtime: 'nodejs'
};

