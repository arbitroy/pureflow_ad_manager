// app/api/campaigns/[id]/publish/route.ts
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { CampaignStatus } from '@/types/models';
import {
    createMetaCampaign,
    createMetaAdSet,
    createMetaAdCreative,
    createMetaAd,
    MetaAdCreative
} from '@/lib/api/meta';
import { storeMetaCampaignMetadata } from '@/lib/api/metaSync';

export async function POST(
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

        // Begin database transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Get campaign data
            const [campaignRows] = await connection.query(
                'SELECT * FROM campaigns WHERE id = ? AND created_by = ?',
                [campaignId, tokenData.userId]
            );

            if ((campaignRows as any[]).length === 0) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: 'Campaign not found or you do not have permission to publish it' },
                    { status: 404 }
                );
            }

            const campaignData = (campaignRows as any[])[0];

            // Check if campaign is in DRAFT status
            if (campaignData.status !== CampaignStatus.DRAFT) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: 'Only draft campaigns can be published' },
                    { status: 400 }
                );
            }

            // Get platforms for this campaign
            const [platformRows] = await connection.query(
                `SELECT p.* FROM platforms p
                 JOIN campaign_platforms cp ON p.id = cp.platform_id
                 WHERE cp.campaign_id = ?`,
                [campaignId]
            );

            if ((platformRows as any[]).length === 0) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: 'No platforms connected to this campaign' },
                    { status: 400 }
                );
            }

            const platforms = (platformRows as any[]).map(p => ({
                id: p.id,
                name: p.name,
                accountId: p.account_id,
                accessToken: p.access_token,
                refreshToken: p.refresh_token || null,
                tokenExpiry: p.token_expiry || null,
                createdAt: new Date(p.created_at),
                updatedAt: new Date(p.updated_at)
            }));

            // Get ad creative for this campaign
            const [creativeRows] = await connection.query(
                'SELECT * FROM ad_creatives WHERE campaign_id = ?',
                [campaignId]
            );

            if ((creativeRows as any[]).length === 0) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: 'No ad creative found for this campaign' },
                    { status: 400 }
                );
            }

            const adCreativeData = (creativeRows as any[])[0];

            // Convert to MetaAdCreative
            const adCreative: MetaAdCreative = {
                title: adCreativeData.title,
                body: adCreativeData.body,
                imageUrl: adCreativeData.image_url || undefined,
                videoUrl: adCreativeData.video_url || undefined,
                callToAction: adCreativeData.call_to_action_type ? {
                    type: adCreativeData.call_to_action_type,
                    value: {
                        link: adCreativeData.call_to_action_link || 'https://example.com'
                    }
                } : undefined
            };

            // Get geo zones for this campaign
            const [geoZoneRows] = await connection.query(
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
                    centerLat: gz.center_lat || undefined,
                    centerLng: gz.center_lng || undefined,
                    radiusKm: gz.radius_km || undefined,
                    points: [],
                    createdAt: new Date(gz.created_at),
                    updatedAt: new Date(gz.updated_at),
                    createdBy: gz.created_by
                };

                // If polygon type, fetch points
                if (zone.type === 'POLYGON') {
                    const [pointRows] = await connection.query(
                        'SELECT lat, lng FROM geo_points WHERE geo_zone_id = ? ORDER BY point_order',
                        [zone.id]
                    );

                    zone.points = (pointRows as any[]).map(p => ({
                        lat: p.lat,
                        lng: p.lng
                    }));
                }

                return zone;
            }));

            // Create campaign object
            const campaign = {
                id: campaignData.id,
                name: campaignData.name,
                description: campaignData.description || undefined,
                platforms,
                status: campaignData.status,
                budget: parseFloat(campaignData.budget),
                startDate: campaignData.start_date ? new Date(campaignData.start_date) : undefined,
                endDate: campaignData.end_date ? new Date(campaignData.end_date) : undefined,
                geoZones,
                objective: campaignData.objective || 'CONSIDERATION',
                createdAt: new Date(campaignData.created_at),
                updatedAt: new Date(campaignData.updated_at),
                createdBy: campaignData.created_by
            };

            // Update campaign status to ACTIVE or SCHEDULED
            const newStatus = campaign.startDate && campaign.startDate > new Date() 
                ? CampaignStatus.SCHEDULED 
                : CampaignStatus.ACTIVE;
                
            await connection.query(
                'UPDATE campaigns SET status = ?, updated_at = NOW() WHERE id = ?',
                [newStatus, campaignId]
            );

            // Create campaigns on each platform
            let hasErrors = false;
            for (const platform of platforms) {
                try {
                    // Set platform status to PENDING
                    await connection.query(
                        `UPDATE campaign_platforms 
                         SET platform_status = 'PENDING', updated_at = NOW()
                         WHERE campaign_id = ? AND platform_id = ?`,
                        [campaignId, platform.id]
                    );

                    // Create Meta campaign
                    const metaCampaignResult = await createMetaCampaign(
                        platform,
                        campaign,
                        campaign.objective as string
                    );

                    // Create Meta ad set with geo targeting
                    const metaAdSetResult = await createMetaAdSet(
                        platform,
                        metaCampaignResult.id,
                        campaign,
                        geoZones
                    );

                    // Create Meta ad creative
                    const metaAdCreativeResult = await createMetaAdCreative(
                        platform,
                        campaign,
                        adCreative
                    );

                    // Create Meta ad
                    const metaAdResult = await createMetaAd(
                        platform,
                        campaign,
                        metaAdSetResult.id,
                        metaAdCreativeResult.creative_id
                    );

                    // Store Meta campaign metadata
                    await storeMetaCampaignMetadata(campaignId, {
                        metaCampaignId: metaCampaignResult.id,
                        metaAdSetId: metaAdSetResult.id,
                        metaAdId: metaAdResult.id,
                        platform: platform.name
                    });

                    // Update platform status to PUBLISHED
                    await connection.query(
                        `UPDATE campaign_platforms 
                         SET platform_status = 'PUBLISHED', last_synced = NOW(), updated_at = NOW()
                         WHERE campaign_id = ? AND platform_id = ?`,
                        [campaignId, platform.id]
                    );
                } catch (error) {
                    console.error(`Error creating Meta campaign on ${platform.name}:`, error);
                    hasErrors = true;

                    // Update platform status to FAILED with error message
                    await connection.query(
                        `UPDATE campaign_platforms 
                         SET platform_status = 'FAILED', platform_error = ?, updated_at = NOW()
                         WHERE campaign_id = ? AND platform_id = ?`,
                        [
                            error instanceof Error ? error.message : 'Unknown error',
                            campaignId,
                            platform.id
                        ]
                    );
                }
            }

            // Commit transaction
            await connection.commit();

            // If there were errors but some platforms were published successfully, don't return an error
            return NextResponse.json({
                success: true,
                message: hasErrors
                    ? 'Campaign published with some errors. Check platform status for details.'
                    : 'Campaign published successfully',
                newStatus
            });
        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            throw error;
        } finally {
            // Release connection
            connection.release();
        }
    } catch (error) {
        console.error('Error publishing campaign:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to publish campaign' },
            { status: 500 }
        );
    }
}