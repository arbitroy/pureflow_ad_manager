import { NextResponse } from 'next/server';
import { getUserById, comparePasswords, hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('auth_token')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get request body
        const { currentPassword, newPassword } = await request.json();

        // Validate input
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { success: false, message: 'Current password and new password are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { success: false, message: 'New password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Get user ID from token
        const decoded = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
        const userId = decoded.userId;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        // Get user from database
        const [rows] = await pool.query(
            'SELECT id, password FROM users WHERE id = ?',
            [userId]
        );

        const users = rows as any[];
        if (users.length === 0) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        const user = users[0];

        // Verify current password
        const isPasswordValid = await comparePasswords(currentPassword, user.password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, message: 'Current password is incorrect' },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password in database
        await pool.query(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, userId]
        );

        // Record password change in activity log (would be implemented in a real app)
        /*
        await pool.query(
            'INSERT INTO user_activity (user_id, activity_type, details, ip_address) VALUES (?, ?, ?, ?)',
            [userId, 'PASSWORD_CHANGE', 'Password changed successfully', request.headers.get('x-forwarded-for') || 'unknown']
        );
        */

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to change password' },
            { status: 500 }
        );
    }
}