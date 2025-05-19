import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';
import { hashPassword, generateTokens, saveRefreshToken } from '@/lib/auth';
import { UserRole } from '@/types/models';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, name, role = UserRole.MARKETING } = body;

        // Check if user already exists
        const [existingUsers] = await pool.query(
            'SELECT email FROM users WHERE email = ?',
            [email]
        );

        if ((existingUsers as any[]).length > 0) {
            return NextResponse.json(
                { success: false, message: 'User already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Generate UUID for user
        const userId = uuidv4();

        // Create user in database
        await pool.query(
            'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
            [userId, email, hashedPassword, name, role]
        );

        // Generate tokens
        const user = {
            id: userId,
            email,
            name,
            role,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const { accessToken, refreshToken, refreshExpiry } = generateTokens(user);

        // Save refresh token to database
        await saveRefreshToken(userId, refreshToken, refreshExpiry);

        // Create response with cookies
        const response = NextResponse.json(
            {
                success: true,
                message: 'User registered successfully',
                user: {
                    id: userId,
                    email,
                    name,
                    role
                }
            },
            { status: 201 }
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
        console.error('Registration error:', error);
        return NextResponse.json(
            { success: false, message: 'Registration failed' },
            { status: 500 }
        );
    }
}