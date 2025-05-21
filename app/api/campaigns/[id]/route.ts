// app/api/campaigns/[id]/route.ts
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { CampaignStatus } from '@/types/models';

// GET a specific campaign
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const campaignId = params.id;

        // Verify authentication
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

        // Get campaign data
        const [campaignRows] = await pool.query(
            'SELECT * FROM campaigns WHERE id = ? AND created_by = ?',
            [campaignId, tokenData.userId]
        );

        if ((campaignRows as any[]).length === 0) {
            return NextResponse.json(
                { success: false, message: 'Campaign not found' },
                { status: 404 }
            );
        }

        const campaignData = (campaignRows as any[])[0];

        // Get platforms for this campaign
        const [platformRows] = await pool.query(
            `SELECT p.*, cp.platform_status, cp.platform_error, cp.last_synced 
       FROM platforms p
       JOIN campaign_platforms cp ON p.id = cp.platform_id
       WHERE cp.campaign_id = ?`,
            [campaignId]
        );

        const platforms = (platformRows as any[]).map(p => ({
            id: p.id,
            name: p.name,
            accountId: p.account_id,
            // Don't include access token in response for security
            tokenExpiry: p.token_expiry,
            platformStatus: p.platform_status,
            platformError: p.platform_error,
            lastSynced: p.last_synced,
            createdAt: p.created_at,
            updatedAt: p.updated_at
        }));

        // Create platform status object
        const platformStatus: Record<string, string> = {};
        platforms.forEach(p => {
            platformStatus[p.id] = p.platformStatus || 'UNKNOWN';
        });

        // Get ad creative for this campaign
        const [creativeRows] = await pool.query(
            'SELECT * FROM ad_creatives WHERE campaign_id = ?',
            [campaignId]
        );

        let adCreative = null;
        if ((creativeRows as any[]).length > 0) {
            const creativeData = (creativeRows as any[])[0];
            adCreative = {
                id: creativeData.id,
                title: creativeData.title,
                body: creativeData.body,
                imageUrl: creativeData.image_url,
                videoUrl: creativeData.video_url,
                callToActionType: creativeData.call_to_action_type,
                callToActionLink: creativeData.call_to_action_link,
                createdAt: creativeData.created_at,
                updatedAt: creativeData.updated_at
            };
        }

        // Get geo zones for this campaign
        const [geoZoneRows] = await pool.query(
            `SELECT gz.* FROM geo_zones gz
       JOIN campaign_geo_zones cgz ON gz.id = cgz.geo_zone_id
       WHERE cgz.campaign_id = ?`,
            [campaignId]
        );

        const geoZones = await Promise.all((geoZoneRows as any[]).map(async gz => {
            const zone = {
                id: gz.id,
                name: gz.name,
                type: gz.type,
                centerLat: gz.center_lat,
                centerLng: gz.center_lng,
                radiusKm: gz.radius_km,
                points: [],
                createdAt: gz.created_at,
                updatedAt: gz.updated_at,
                createdBy: gz.created_by
            };

            // If polygon type, fetch points
            if (zone.type === 'POLYGON') {
                const [pointRows] = await pool.query(
                    'SELECT lat, lng, point_order FROM geo_points WHERE geo_zone_id = ? ORDER BY point_order',
                    [zone.id]
                );

                zone.points = (pointRows as any[]).map(p => ({
                    lat: p.lat,
                    lng: p.lng,
                    order: p.point_order
                }));
            }

            return zone;
        }));

        // Get analytics data for this campaign
        const [analyticsRows] = await pool.query(
            `SELECT * FROM analytics 
       WHERE campaign_id = ? 
       ORDER BY date DESC 
       LIMIT 30`,
            [campaignId]
        );

        const analytics = (analyticsRows as any[]).map(a => ({
            id: a.id,
            platform: a.platform,
            impressions: a.impressions,
            clicks: a.clicks,
            conversions: a.conversions,
            cost: a.cost,
            ctr: a.ctr,
            conversionRate: a.conversion_rate,
            cpc: a.cpc,
            cpa: a.cpa,
            roi: a.roi,
            date: a.date
        }));

        // Format campaign data
        const campaign = {
            id: campaignData.id,
            name: campaignData.name,
            description: campaignData.description,
            status: campaignData.status,
            budget: parseFloat(campaignData.budget),
            startDate: campaignData.start_date,
            endDate: campaignData.end_date,
            objective: campaignData.objective,
            createdAt: campaignData.created_at,
            updatedAt: campaignData.updated_at,
            createdBy: campaignData.created_by
        };

        // Return success response
        return NextResponse.json({
            success: true,
            data: {
                campaign,
                platforms,
                platformStatus,
                adCreative,
                geoZones,
                analytics
            }
        });
    } catch (error) {
        console.error('Error fetching campaign details:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch campaign details' },
            { status: 500 }
        );
    }
}

// PUT/UPDATE a campaign
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        const tokenData = verifyAccessToken(token);

        if (!tokenData) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        const id = params.id;
        const body = await request.json();

        // First, check if the campaign exists and belongs to the user
        const [existingCampaigns] = await pool.query(
            'SELECT * FROM campaigns WHERE id = ? AND created_by = ?',
            [id, tokenData.userId]
        );

        if ((existingCampaigns as any[]).length === 0) {
            return NextResponse.json(
                { success: false, message: 'Campaign not found or you do not have permission to update it' },
                { status: 404 }
            );
        }

        // Validate the update
        if (Object.keys(body).length === 1 && body.status) {
            // Status-only update
            const validStatuses = Object.values(CampaignStatus);
            if (!validStatuses.includes(body.status)) {
                return NextResponse.json(
                    { success: false, message: 'Invalid status value' },
                    { status: 400 }
                );
            }

            // Update just the status
            await pool.query(
                'UPDATE campaigns SET status = ?, updated_at = NOW() WHERE id = ?',
                [body.status, id]
            );

            return NextResponse.json({
                success: true,
                message: 'Campaign status updated successfully'
            });
        } else {
            // Full campaign update
            // Start a transaction since we might update multiple tables
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // Update the campaign basic info
                const updateFields = [];
                const updateValues = [];

                // Add fields to update
                if (body.name !== undefined) {
                    updateFields.push('name = ?');
                    updateValues.push(body.name);
                }

                if (body.description !== undefined) {
                    updateFields.push('description = ?');
                    updateValues.push(body.description);
                }

                if (body.status !== undefined) {
                    updateFields.push('status = ?');
                    updateValues.push(body.status);
                }

                if (body.budget !== undefined) {
                    updateFields.push('budget = ?');
                    updateValues.push(body.budget);
                }

                if (body.startDate !== undefined) {
                    updateFields.push('start_date = ?');
                    updateValues.push(body.startDate ? new Date(body.startDate) : null);
                }

                if (body.endDate !== undefined) {
                    updateFields.push('end_date = ?');
                    updateValues.push(body.endDate ? new Date(body.endDate) : null);
                }

                if (body.objective !== undefined) {
                    updateFields.push('objective = ?');
                    updateValues.push(body.objective);
                }

                // Add updated_at field
                updateFields.push('updated_at = NOW()');

                // Add campaign ID to values for WHERE clause
                updateValues.push(id);

                // Update the campaign
                if (updateFields.length > 0) {
                    await connection.query(
                        `UPDATE campaigns SET ${updateFields.join(', ')} WHERE id = ?`,
                        updateValues
                    );
                }

                // Update platforms if included in the request
                if (body.platforms !== undefined) {
                    // Remove existing platform associations
                    await connection.query(
                        'DELETE FROM campaign_platforms WHERE campaign_id = ?',
                        [id]
                    );

                    // Add new platform associations
                    if (body.platforms.length > 0) {
                        for (const platform of body.platforms) {
                            const platformId = typeof platform === 'string' ? platform : platform.id;
                            await connection.query(
                                'INSERT INTO campaign_platforms (campaign_id, platform_id) VALUES (?, ?)',
                                [id, platformId]
                            );
                        }
                    }
                }

                // Update geo zones if included in the request
                if (body.geoZones !== undefined) {
                    // Remove existing geo zone associations
                    await connection.query(
                        'DELETE FROM campaign_geo_zones WHERE campaign_id = ?',
                        [id]
                    );

                    // Add new geo zone associations
                    if (body.geoZones.length > 0) {
                        for (const geoZone of body.geoZones) {
                            const geoZoneId = typeof geoZone === 'string' ? geoZone : geoZone.id;
                            await connection.query(
                                'INSERT INTO campaign_geo_zones (campaign_id, geo_zone_id) VALUES (?, ?)',
                                [id, geoZoneId]
                            );
                        }
                    }
                }

                // Update ad creative if included in the request
                if (body.adCreative !== undefined) {
                    // Check if ad creative exists
                    const [existingCreatives] = await connection.query(
                        'SELECT id FROM ad_creatives WHERE campaign_id = ?',
                        [id]
                    );

                    if ((existingCreatives as any[]).length > 0) {
                        // Update existing creative
                        const creativeId = (existingCreatives as any[])[0].id;
                        await connection.query(
                            `UPDATE ad_creatives 
                            SET title = ?, body = ?, image_url = ?, video_url = ?, 
                                call_to_action_type = ?, call_to_action_link = ?, 
                                updated_at = NOW() 
                            WHERE id = ?`,
                            [
                                body.adCreative.title,
                                body.adCreative.body,
                                body.adCreative.imageUrl || null,
                                body.adCreative.videoUrl || null,
                                body.adCreative.callToAction?.type || null,
                                body.adCreative.callToAction?.value?.link || null,
                                creativeId
                            ]
                        );
                    } else {
                        // Create new creative
                        const creativeId = uuidv4();
                        await connection.query(
                            `INSERT INTO ad_creatives 
                            (id, campaign_id, title, body, image_url, video_url, call_to_action_type, call_to_action_link) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                creativeId,
                                id,
                                body.adCreative.title,
                                body.adCreative.body,
                                body.adCreative.imageUrl || null,
                                body.adCreative.videoUrl || null,
                                body.adCreative.callToAction?.type || null,
                                body.adCreative.callToAction?.value?.link || null
                            ]
                        );
                    }
                }

                // Commit the transaction
                await connection.commit();

                return NextResponse.json({
                    success: true,
                    message: 'Campaign updated successfully'
                });
            } catch (error) {
                // Rollback on error
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        }
    } catch (error) {
        console.error(`Error updating campaign ${params.id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to update campaign' },
            { status: 500 }
        );
    }
}

// DELETE a campaign
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        const tokenData = verifyAccessToken(token);

        if (!tokenData) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        const id = params.id;

        // Check if campaign exists and belongs to user
        const [campaigns] = await pool.query(
            'SELECT id FROM campaigns WHERE id = ? AND created_by = ?',
            [id, tokenData.userId]
        );

        if ((campaigns as any[]).length === 0) {
            return NextResponse.json(
                { success: false, message: 'Campaign not found or you do not have permission to delete it' },
                { status: 404 }
            );
        }

        // Delete the campaign
        // Note: Foreign key constraints will automatically delete related records in other tables
        await pool.query('DELETE FROM campaigns WHERE id = ?', [id]);

        return NextResponse.json({
            success: true,
            message: 'Campaign deleted successfully'
        });
    } catch (error) {
        console.error(`Error deleting campaign ${params.id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete campaign' },
            { status: 500 }
        );
    }
}