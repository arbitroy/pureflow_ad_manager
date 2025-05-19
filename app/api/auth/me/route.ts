import { NextResponse } from 'next/server';
import { verifyAccessToken, getUserById } from '@/lib/auth';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        // Get access token from cookie
        const accessToken = cookieStore.get('auth_token')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Verify access token
        const tokenData = verifyAccessToken(accessToken);

        if (!tokenData) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Get user from database
        const user = await getUserById(tokenData.userId);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Get last login time
        const [lastLoginRows] = await pool.query(
            'SELECT login_time FROM user_logins WHERE user_id = ? ORDER BY login_time DESC LIMIT 1',
            [user.id]
        );

        const lastLoginData = (lastLoginRows as any[])[0] || null;
        const lastLogin = lastLoginData ? lastLoginData.login_time : null;

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            lastLogin
        });
    } catch (error) {
        console.error('Authentication error:', error);
        return NextResponse.json(
            { success: false, message: 'Authentication failed' },
            { status: 500 }
        );
    }
}