// app/api/campaigns/route.ts
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Campaign, CampaignStatus, PlatformName } from '@/types/models';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET all campaigns
export async function GET(request: Request) {
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
        
        // Fetch campaigns from database
        const [campaignRows] = await pool.query(
            `SELECT c.* 
             FROM campaigns c
             WHERE c.created_by = ?
             ORDER BY c.created_at DESC`,
            [tokenData.userId]
        );
 
        const campaigns = [];
        
        // For each campaign, get associated platforms and geo zones
        for (const campaign of (campaignRows as any[])) {
            // Get platforms
            const [platformRows] = await pool.query(
                `SELECT p.id, p.name, p.account_id 
                 FROM platforms p
                 JOIN campaign_platforms cp ON p.id = cp.platform_id
                 WHERE cp.campaign_id = ?`,
                [campaign.id]
            );
            
            // Get geo zones
            const [geoZoneRows] = await pool.query(
                `SELECT gz.id, gz.name, gz.type, gz.center_lat, gz.center_lng, gz.radius_km 
                 FROM geo_zones gz
                 JOIN campaign_geo_zones cgz ON gz.id = cgz.geo_zone_id
                 WHERE cgz.campaign_id = ?`,
                [campaign.id]
            );
            
            // Get analytics summary if available
            const [analyticsRows] = await pool.query(
                `SELECT 
                   SUM(impressions) as impressions,
                   SUM(clicks) as clicks,
                   SUM(conversions) as conversions,
                   AVG(roi) as roi
                 FROM analytics
                 WHERE campaign_id = ?
                 GROUP BY campaign_id`,
                [campaign.id]
            );
            
            const analytics = (analyticsRows as any[]).length > 0 ? (analyticsRows as any[])[0] : null;
            
            // Format campaign with relationships
            campaigns.push({
                id: campaign.id,
                name: campaign.name,
                description: campaign.description,
                status: campaign.status,
                budget: parseFloat(campaign.budget),
                startDate: campaign.start_date,
                endDate: campaign.end_date,
                objective: campaign.objective,
                platforms: (platformRows as any[]).map(p => ({
                    id: p.id,
                    name: p.name,
                    accountId: p.account_id
                })),
                geoZones: (geoZoneRows as any[]).map(gz => ({
                    id: gz.id,
                    name: gz.name,
                    type: gz.type,
                    centerLat: gz.center_lat,
                    centerLng: gz.center_lng,
                    radiusKm: gz.radius_km
                })),
                analytics: analytics ? {
                    impressions: analytics.impressions || 0,
                    clicks: analytics.clicks || 0,
                    conversions: analytics.conversions || 0,
                    roi: analytics.roi || 0
                } : undefined,
                createdAt: campaign.created_at,
                updatedAt: campaign.updated_at,
                createdBy: campaign.created_by
            });
        }
        
        return NextResponse.json({
            success: true,
            data: campaigns
        });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch campaigns' },
            { status: 500 }
        );
    }
}

// POST a new campaign
export async function POST(request: Request) {
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
        
        const body = await request.json();
        
        // Validate required fields
        if (!body.name) {
            return NextResponse.json(
                { success: false, message: 'Campaign name is required' },
                { status: 400 }
            );
        }
        
        if (body.budget <= 0) {
            return NextResponse.json(
                { success: false, message: 'Budget must be greater than 0' },
                { status: 400 }
            );
        }
        
        // Generate a new ID
        const campaignId = uuidv4();
        
        // Extract data 
        const { 
            name, 
            description, 
            status = CampaignStatus.DRAFT, 
            budget, 
            startDate, 
            endDate,
            objective = 'CONSIDERATION',
            platforms = [],
            geoZones = [],
            adCreative = null
        } = body;
        
        // Begin transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            // Insert campaign record
            await connection.query(
                `INSERT INTO campaigns 
                (id, name, description, status, budget, start_date, end_date, objective, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    campaignId, 
                    name, 
                    description || null, 
                    status, 
                    budget, 
                    startDate ? new Date(startDate) : null, 
                    endDate ? new Date(endDate) : null,
                    objective,
                    tokenData.userId
                ]
            );
            
            // Insert platform relationships
            if (platforms && platforms.length > 0) {
                for (const platform of platforms) {
                    const platformId = typeof platform === 'string' ? platform : platform.id;
                    await connection.query(
                        `INSERT INTO campaign_platforms (campaign_id, platform_id) VALUES (?, ?)`,
                        [campaignId, platformId]
                    );
                }
            }
            
            // Insert geo zone relationships
            if (geoZones && geoZones.length > 0) {
                for (const geoZone of geoZones) {
                    const geoZoneId = typeof geoZone === 'string' ? geoZone : geoZone.id;
                    await connection.query(
                        `INSERT INTO campaign_geo_zones (campaign_id, geo_zone_id) VALUES (?, ?)`,
                        [campaignId, geoZoneId]
                    );
                }
            }
            
            // Insert ad creative if provided
            if (adCreative) {
                const creativeId = uuidv4();
                await connection.query(
                    `INSERT INTO ad_creatives 
                    (id, campaign_id, title, body, image_url, video_url, call_to_action_type, call_to_action_link) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        creativeId,
                        campaignId,
                        adCreative.title,
                        adCreative.body,
                        adCreative.imageUrl || null,
                        adCreative.videoUrl || null,
                        adCreative.callToAction?.type || null,
                        adCreative.callToAction?.value?.link || null
                    ]
                );
            }
            
            // Commit the transaction
            await connection.commit();
            
            // Return the created campaign with ID
            return NextResponse.json({
                success: true,
                message: 'Campaign created successfully',
                data: {
                    id: campaignId,
                    name,
                    description,
                    status,
                    budget,
                    startDate,
                    endDate,
                    objective,
                    platforms,
                    geoZones,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: tokenData.userId
                }
            }, { status: 201 });
            
        } catch (error) {
            // Rollback on error
            await connection.rollback();
            throw error;
        } finally {
            // Release connection
            connection.release();
        }
    } catch (error) {
        console.error('Error creating campaign:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create campaign' },
            { status: 500 }
        );
    }
}