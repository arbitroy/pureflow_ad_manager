import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
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

        // Validate the Facebook access token (Instagram uses Facebook's Graph API)
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
        } catch (error) {
            console.error('Facebook token validation error:', error);
            return NextResponse.json(
                { success: false, message: 'Invalid or expired Facebook access token' },
                { status: 400 }
            );
        }

        // Get Instagram Business Account information
        let instagramAccountId = null;
        let instagramUsername = null;
        
        try {
            // First, get Facebook pages managed by the user
            const pagesResponse = await fetch(
                `https://graph.facebook.com/v23.0/me/accounts?access_token=${fbAccessToken}&fields=id,name,access_token`
            );

            if (pagesResponse.ok) {
                const pagesData = await pagesResponse.json();
                
                if (pagesData.data && pagesData.data.length > 0) {
                    // For each page, check if it has a connected Instagram account
                    for (const page of pagesData.data) {
                        try {
                            const instagramResponse = await fetch(
                                `https://graph.facebook.com/v23.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
                            );

                            if (instagramResponse.ok) {
                                const instagramData = await instagramResponse.json();
                                
                                if (instagramData.instagram_business_account) {
                                    // Get Instagram account details
                                    const instagramDetailsResponse = await fetch(
                                        `https://graph.facebook.com/v23.0/${instagramData.instagram_business_account.id}?fields=id,username,name&access_token=${page.access_token}`
                                    );

                                    if (instagramDetailsResponse.ok) {
                                        const instagramDetails = await instagramDetailsResponse.json();
                                        instagramAccountId = instagramDetails.id;
                                        instagramUsername = instagramDetails.username;
                                        break; // Use the first Instagram business account found
                                    }
                                }
                            }
                        } catch (error) {
                            console.warn('Error checking Instagram account for page:', page.id, error);
                            continue;
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Could not fetch Instagram business accounts:', error);
        }

        // If no Instagram business account found, we can still proceed with the Facebook account ID
        if (!instagramAccountId) {
            console.warn('No Instagram Business Account found. Using Facebook account ID.');
            instagramAccountId = userInfo.id;
            instagramUsername = userInfo.name;
        }

        // Check if Instagram platform already exists for this user
        const [existingPlatforms] = await pool.query(
            `SELECT p.id 
             FROM platforms p
             JOIN user_platforms up ON p.id = up.platform_id
             WHERE up.user_id = ? AND p.name = ?`,
            [tokenData.userId, PlatformName.INSTAGRAM]
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
                    [instagramAccountId, fbAccessToken, tokenExpiry, platformId]
                );
            } else {
                // Insert new platform
                platformId = uuidv4();

                await connection.query(
                    `INSERT INTO platforms 
                     (id, name, account_id, access_token, token_expiry, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                    [platformId, PlatformName.INSTAGRAM, instagramAccountId, fbAccessToken, tokenExpiry]
                );

                // Link platform to user
                await connection.query(
                    'INSERT INTO user_platforms (user_id, platform_id) VALUES (?, ?)',
                    [tokenData.userId, platformId]
                );
            }

            // Store additional user information for reference
            await connection.query(
                `INSERT INTO platform_user_info (platform_id, fb_user_id, name, email, profile_picture, instagram_username, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE 
                 name = VALUES(name), 
                 email = VALUES(email), 
                 profile_picture = VALUES(profile_picture),
                 instagram_username = VALUES(instagram_username),
                 updated_at = VALUES(updated_at)`,
                [
                    platformId,
                    userInfo.id,
                    userInfo.name,
                    userInfo.email,
                    userInfo.picture?.data?.url || null,
                    instagramUsername
                ]
            );

            // Commit transaction
            await connection.commit();

            return NextResponse.json({
                success: true,
                message: 'Successfully connected Instagram',
                data: {
                    id: platformId,
                    name: PlatformName.INSTAGRAM,
                    accountId: instagramAccountId,
                    userName: userInfo.name,
                    userEmail: userInfo.email,
                    instagramUsername: instagramUsername,
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
        console.error('Error connecting Instagram platform:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to connect Instagram platform' },
            { status: 500 }
        );
    }
}