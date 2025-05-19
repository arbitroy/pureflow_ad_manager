import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import pool from '@/lib/db';
import { Platform, PlatformName } from '@/types/models';
import { cookies } from 'next/headers';

// GET all platforms for the current user
export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
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

        // Get platforms for the user
        const [rows] = await pool.query(
            `SELECT p.* 
       FROM platforms p
       JOIN user_platforms up ON p.id = up.platform_id
       WHERE up.user_id = ?`,
            [tokenData.userId]
        );

        const platforms = (rows as any[]).map(platform => ({
            id: platform.id,
            name: platform.name,
            accountId: platform.account_id,
            accessToken: platform.access_token, // In production, you might not want to expose this
            refreshToken: platform.refresh_token,
            tokenExpiry: platform.token_expiry,
            createdAt: platform.created_at,
            updatedAt: platform.updated_at
        }));

        return NextResponse.json({
            success: true,
            data: platforms
        });
    } catch (error) {
        console.error('Error fetching platforms:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch platforms' },
            { status: 500 }
        );
    }
}

// POST a new platform
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

        // Verify access token
        const tokenData = verifyAccessToken(accessToken);

        if (!tokenData) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Get request body
        const body = await request.json();
        const { name, accountId, accessToken: platformToken, refreshToken, tokenExpiry } = body;

        // Validate input
        if (!name || !accountId || !platformToken) {
            return NextResponse.json(
                { success: false, message: 'Name, accountId, and accessToken are required' },
                { status: 400 }
            );
        }

        // Check if platform already exists for this user
        const [existingPlatforms] = await pool.query(
            `SELECT p.id 
       FROM platforms p
       JOIN user_platforms up ON p.id = up.platform_id
       WHERE up.user_id = ? AND p.name = ?`,
            [tokenData.userId, name]
        );

        if ((existingPlatforms as any[]).length > 0) {
            return NextResponse.json(
                { success: false, message: 'Platform already connected for this user' },
                { status: 409 }
            );
        }

        // Begin transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert platform
            const [result] = await connection.query(
                `INSERT INTO platforms 
         (id, name, account_id, access_token, refresh_token, token_expiry) 
         VALUES (UUID(), ?, ?, ?, ?, ?)`,
                [name, accountId, platformToken, refreshToken || null, tokenExpiry || null]
            );

            const platformId = (result as any).insertId;

            // Link platform to user
            await connection.query(
                'INSERT INTO user_platforms (user_id, platform_id) VALUES (?, ?)',
                [tokenData.userId, platformId]
            );

            // Commit transaction
            await connection.commit();

            // Get the created platform
            const [platformRows] = await connection.query(
                'SELECT * FROM platforms WHERE id = ?',
                [platformId]
            );

            const platform = (platformRows as any[])[0];

            return NextResponse.json({
                success: true,
                message: 'Platform connected successfully',
                data: {
                    id: platform.id,
                    name: platform.name,
                    accountId: platform.account_id,
                    accessToken: platform.access_token,
                    refreshToken: platform.refresh_token,
                    tokenExpiry: platform.token_expiry,
                    createdAt: platform.created_at,
                    updatedAt: platform.updated_at
                }
            }, { status: 201 });
        } catch (error) {
            // Rollback on error
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error connecting platform:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to connect platform' },
            { status: 500 }
        );
    }
}