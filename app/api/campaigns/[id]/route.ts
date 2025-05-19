import { NextResponse } from 'next/server';
import { Campaign } from '@/types/models';
import { verifyAccessToken } from '@/lib/auth';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

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
            'SELECT * FROM campaigns WHERE id = ?',
            [campaignId]
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

        // Validate the update - this will depend on what fields you're allowing to be updated
        // For a status-only update, we need to validate the status value
        if (Object.keys(body).length === 1 && body.status) {
            const validStatuses = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED'];
            if (!validStatuses.includes(body.status)) {
                return NextResponse.json(
                    { success: false, message: 'Invalid status value' },
                    { status: 400 }
                );
            }
        } else {
            // For a full campaign update, validate required fields
            if (body.name === '') {
                return NextResponse.json(
                    { success: false, message: 'Campaign name cannot be empty' },
                    { status: 400 }
                );
            }

            if (body.budget !== undefined && body.budget <= 0) {
                return NextResponse.json(
                    { success: false, message: 'Budget must be greater than 0' },
                    { status: 400 }
                );
            }

            if (body.platforms && body.platforms.length === 0) {
                return NextResponse.json(
                    { success: false, message: 'At least one platform must be selected' },
                    { status: 400 }
                );
            }

            // Validate date range if both dates are provided
            if (body.startDate && body.endDate) {
                const startDate = new Date(body.startDate);
                const endDate = new Date(body.endDate);

                if (startDate > endDate) {
                    return NextResponse.json(
                        { success: false, message: 'End date must be after start date' },
                        { status: 400 }
                    );
                }
            }
        }

        // In a real app, update the campaign in the database
        // For now, we'll simulate a successful update

        // Simulate database delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Construct the updated campaign object
        // In a real app, you would fetch the existing campaign first, then apply updates
        const updatedCampaign = {
            id,
            ...body,
            updatedAt: new Date()
        };

        return NextResponse.json({
            success: true,
            message: 'Campaign updated successfully',
            data: updatedCampaign
        });
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

        // In a real app, you would delete from database
        // Simulate database interaction
        await new Promise(resolve => setTimeout(resolve, 300));

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