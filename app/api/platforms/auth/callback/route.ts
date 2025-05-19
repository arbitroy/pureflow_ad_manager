import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { authenticateWithMeta, MetaAuthResult } from '@/lib/api/meta';
import { v4 as uuidv4 } from 'uuid';
import { PlatformName } from '@/types/models';

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
        const { code, state, redirectUri } = body;

        // Validate input
        if (!code || !state || !redirectUri) {
            return NextResponse.json(
                { success: false, message: 'Code, state, and redirectUri are required' },
                { status: 400 }
            );
        }

        // Determine platform type from state
        const platformName = state === 'facebook' ? PlatformName.FACEBOOK : PlatformName.INSTAGRAM;

        // Exchange code for token
        const authResult: MetaAuthResult = await authenticateWithMeta(code, redirectUri);

        // Calculate token expiry date (typically 60 days for Meta long-lived tokens)
        const tokenExpiry = new Date();
        tokenExpiry.setSeconds(tokenExpiry.getSeconds() + authResult.expiresIn);

        // Check if platform already exists for this user
        const [existingPlatforms] = await pool.query(
            `SELECT p.id 
       FROM platforms p
       JOIN user_platforms up ON p.id = up.platform_id
       WHERE up.user_id = ? AND p.name = ?`,
            [tokenData.userId, platformName]
        );

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            let platformId: string;

            if ((existingPlatforms as any[]).length > 0) {
                // Update existing platform
                platformId = (existingPlatforms as any[])[0].id;

                await connection.query(
                    `UPDATE platforms 
           SET account_id = ?, access_token = ?, token_expiry = ?, updated_at = NOW()
           WHERE id = ?`,
                    [authResult.platformAccountId, authResult.accessToken, tokenExpiry, platformId]
                );
            } else {
                // Insert new platform
                platformId = uuidv4();

                await connection.query(
                    `INSERT INTO platforms 
           (id, name, account_id, access_token, token_expiry, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                    [platformId, platformName, authResult.platformAccountId, authResult.accessToken, tokenExpiry]
                );

                // Link platform to user
                await connection.query(
                    'INSERT INTO user_platforms (user_id, platform_id) VALUES (?, ?)',
                    [tokenData.userId, platformId]
                );
            }

            // Commit transaction
            await connection.commit();

            return NextResponse.json({
                success: true,
                message: `Successfully connected ${platformName.toLowerCase()}`,
                data: {
                    id: platformId,
                    name: platformName,
                    accountId: authResult.platformAccountId,
                    tokenExpiry
                }
            });
        } catch (error) {
            // Rollback on error
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error processing auth callback:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to process authentication' },
            { status: 500 }
        );
    }
}