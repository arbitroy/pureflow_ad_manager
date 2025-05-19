// app/api/auth/refresh/route.ts
import { NextResponse } from 'next/server';
import {
    verifyRefreshToken,
    getUserById,
    generateTokens,
    saveRefreshToken,
    revokeRefreshToken
} from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        // Get refresh token from cookies
        const refreshToken = cookieStore.get('refresh_token')?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { success: false, message: 'Refresh token required' },
                { status: 401 }
            );
        }

        // Verify refresh token and get user ID
        const userId = await verifyRefreshToken(refreshToken);

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired refresh token' },
                { status: 401 }
            );
        }

        // Get user from database
        const user = await getUserById(userId);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Revoke old refresh token
        await revokeRefreshToken(refreshToken);

        // Generate new tokens
        const {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            refreshExpiry
        } = generateTokens(user);

        // Save new refresh token to database
        await saveRefreshToken(user.id, newRefreshToken, refreshExpiry);

        // Create response with new cookies
        const response = NextResponse.json(
            {
                success: true,
                message: 'Tokens refreshed successfully',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            },
            { status: 200 }
        );

        // Set new cookies
        response.cookies.set({
            name: 'auth_token',
            value: newAccessToken,
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60, // 1 hour
        });

        response.cookies.set({
            name: 'refresh_token',
            value: newRefreshToken,
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json(
            { success: false, message: 'Token refresh failed' },
            { status: 500 }
        );
    }
}