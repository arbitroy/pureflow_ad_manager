import { NextResponse } from 'next/server';
import {
    getUserByEmail,
    comparePasswords,
    generateTokens,
    saveRefreshToken
} from '@/lib/auth';
import { ensureDatabaseInitialized } from '@/lib/db-init';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        // Ensure database is initialized
        const dbReady = await ensureDatabaseInitialized();
        if (!dbReady) {
            return NextResponse.json(
                { success: false, message: 'Database unavailable, try again later' },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { email, password, rememberMe = false } = body;

        // Find user by email
        const user = await getUserByEmail(email);

        // Check if user exists and password is correct
        if (!user || !(await comparePasswords(password, user.password))) {
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Generate tokens with custom expiry based on remember me
        const accessTokenExpiry = rememberMe ? '7d' : '1h'; // 7 days or 1 hour
        const refreshTokenExpiry = rememberMe ? 30 : 7; // 30 days or 7 days
        
        const refreshExpiryDate = new Date();
        refreshExpiryDate.setDate(refreshExpiryDate.getDate() + refreshTokenExpiry);

        const { accessToken, refreshToken } = generateTokens({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }, accessTokenExpiry);

        // Save refresh token to database
        await saveRefreshToken(user.id, refreshToken, refreshExpiryDate);

        // Record last login time
        await pool.query(
            'INSERT INTO user_logins (user_id, login_time, ip_address, user_agent) VALUES (?, NOW(), ?, ?)',
            [
                user.id, 
                request.headers.get('x-forwarded-for') || 'unknown',
                request.headers.get('user-agent') || 'unknown'
            ]
        );

        // Get last login time
        const [lastLoginRows] = await pool.query(
            'SELECT login_time FROM user_logins WHERE user_id = ? ORDER BY login_time DESC LIMIT 1 OFFSET 1',
            [user.id]
        );

        const lastLoginData = (lastLoginRows as any[])[0] || null;
        const lastLogin = lastLoginData ? lastLoginData.login_time : null;

        // Create response with cookies
        const response = NextResponse.json(
            {
                success: true,
                message: 'Authentication successful',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                lastLogin
            },
            { status: 200 }
        );

        // Calculate cookie expiry in seconds
        const accessTokenMaxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60; // 7 days or 1 hour
        const refreshTokenMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days or 7 days

        // Set cookies
        response.cookies.set({
            name: 'auth_token',
            value: accessToken,
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: accessTokenMaxAge,
        });

        response.cookies.set({
            name: 'refresh_token',
            value: refreshToken,
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: refreshTokenMaxAge,
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Authentication failed' },
            { status: 500 }
        );
    }
}