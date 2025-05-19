// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import {
    getUserByEmail,
    comparePasswords,
    generateTokens,
    saveRefreshToken
} from '@/lib/auth';
import { ensureDatabaseInitialized } from '@/lib/db-init';


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
        const { email, password } = body;

        // Find user by email
        const user = await getUserByEmail(email);

        // Check if user exists and password is correct
        if (!user || !(await comparePasswords(password, user.password))) {
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Generate tokens
        const { accessToken, refreshToken, refreshExpiry } = generateTokens({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });

        // Save refresh token to database
        await saveRefreshToken(user.id, refreshToken, refreshExpiry);

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
                }
            },
            { status: 200 }
        );

        // Set cookies
        response.cookies.set({
            name: 'auth_token',
            value: accessToken,
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60, // 1 hour
        });

        response.cookies.set({
            name: 'refresh_token',
            value: refreshToken,
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
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