import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { PlatformName } from '@/types/models';

interface FacebookUserInfo {
    id: string;
    name: string;
    email: string;
    picture?: {
        data: {
            url: string;
        };
    };
}

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

        const tokenData = verifyAccessToken(accessToken);

        if (!tokenData) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { accessToken: fbAccessToken, userInfo, platform } = body;

        if (!fbAccessToken || !userInfo || !platform) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields: accessToken, userInfo, and platform' },
                { status: 400 }
            );
        }

        // Validate the Facebook access token by making a test API call
        try {
            const tokenValidationResponse = await fetch(
                `https://graph.facebook.com/me?access_token=${fbAccessToken}&fields=id,name,email`
            );

            if (!tokenValidationResponse.ok) {
                throw new Error('Invalid Facebook access token');
            }

            const tokenValidationData = await tokenValidationResponse.json();
            
            if (tokenValidationData.error) {
                throw new Error(tokenValidationData.error.message || 'Invalid Facebook access token');
            }

            // Ensure the token belongs to the correct user
            if (tokenValidationData.id !== userInfo.id) {
                throw new Error('Access token does not match user information');
            }
        } catch (error) {
            console.error('Facebook token validation error:', error);
            return NextResponse.json(
                { success: false, message: 'Invalid or expired Facebook access token' },
                { status: 400 }
            );
        }

        // Get Facebook Ad Account information
        let adAccountId = null;
        try {
            const adAccountsResponse = await fetch(
                `https://graph.facebook.com/v23.0/me/adaccounts?access_token=${fbAccessToken}&fields=id,name,account_status`
            );

            if (adAccountsResponse.ok) {
                const adAccountsData = await adAccountsResponse.json();
                
                if (adAccountsData.data && adAccountsData.data.length > 0) {
                    // Use the first active ad account
                    const activeAccount = adAccountsData.data.find((account: any) => 
                        account.account_status === 1 // 1 means active
                    );
                    
                    if (activeAccount) {
                        adAccountId = activeAccount.id;
                    } else if (adAccountsData.data.length > 0) {
                        // If no active account, use the first available
                        adAccountId = adAccountsData.data[0].id;
                    }
                }
            }
        } catch (error) {
            console.warn('Could not fetch ad accounts:', error);
            // Continue without ad account ID - we can still save the platform connection
        }

        // Check if platform already exists for this user
        const [existingPlatforms] = await pool.query(
            `SELECT p.id 
             FROM platforms p
             JOIN user_platforms up ON p.id = up.platform_id
             WHERE up.user_id = ? AND p.name = ?`,
            [tokenData.userId, platform]
        );

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            let platformId: string;

            // Calculate token expiry (Facebook tokens typically last 60 days)
            const tokenExpiry = new Date();
            tokenExpiry.setDate(tokenExpiry.getDate() + 60);

            if ((existingPlatforms as any[]).length > 0) {
                // Update existing platform
                platformId = (existingPlatforms as any[])[0].id;

                await connection.query(
                    `UPDATE platforms 
                     SET account_id = ?, access_token = ?, token_expiry = ?, updated_at = NOW()
                     WHERE id = ?`,
                    [adAccountId || userInfo.id, fbAccessToken, tokenExpiry, platformId]
                );
            } else {
                // Insert new platform
                platformId = uuidv4();

                await connection.query(
                    `INSERT INTO platforms 
                     (id, name, account_id, access_token, token_expiry, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                    [platformId, platform, adAccountId || userInfo.id, fbAccessToken, tokenExpiry]
                );

                // Link platform to user
                await connection.query(
                    'INSERT INTO user_platforms (user_id, platform_id) VALUES (?, ?)',
                    [tokenData.userId, platformId]
                );
            }

            // Store additional user information for reference
            await connection.query(
                `INSERT INTO platform_user_info (platform_id, fb_user_id, name, email, profile_picture, updated_at)
                 VALUES (?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE 
                 name = VALUES(name), 
                 email = VALUES(email), 
                 profile_picture = VALUES(profile_picture), 
                 updated_at = VALUES(updated_at)`,
                [
                    platformId,
                    userInfo.id,
                    userInfo.name,
                    userInfo.email,
                    userInfo.picture?.data?.url || null
                ]
            );

            // Commit transaction
            await connection.commit();

            return NextResponse.json({
                success: true,
                message: `Successfully connected ${platform.toLowerCase()}`,
                data: {
                    id: platformId,
                    name: platform,
                    accountId: adAccountId || userInfo.id,
                    userName: userInfo.name,
                    userEmail: userInfo.email,
                    tokenExpiry: tokenExpiry.toISOString()
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
        console.error('Error connecting Facebook platform:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to connect Facebook platform' },
            { status: 500 }
        );
    }
}