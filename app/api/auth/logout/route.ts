import { NextResponse } from 'next/server';
import { revokeRefreshToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        // Get refresh token from cookies
        const refreshToken = cookieStore.get('refresh_token')?.value;

        // Revoke refresh token if it exists
        if (refreshToken) {
            await revokeRefreshToken(refreshToken);
        }

        // Create response and clear cookies
        const response = NextResponse.json(
            { success: true, message: 'Logged out successfully' },
            { status: 200 }
        );

        // Clear cookies
        response.cookies.delete('auth_token');
        response.cookies.delete('refresh_token');

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { success: false, message: 'Logout failed' },
            { status: 500 }
        );
    }
}