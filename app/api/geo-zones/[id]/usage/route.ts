import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

// GET campaigns using a specific geo zone
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const zoneId = params.id;

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

        // Check if geo zone exists and belongs to user
        const [zoneRows] = await pool.query(
            'SELECT * FROM geo_zones WHERE id = ? AND created_by = ?',
            [zoneId, tokenData.userId]
        );

        if ((zoneRows as any[]).length === 0) {
            return NextResponse.json(
                { success: false, message: 'Geo zone not found or you do not have permission to access it' },
                { status: 404 }
            );
        }

        // Get campaigns using this zone
        const [campaignRows] = await pool.query(
            `SELECT c.id, c.name, c.status 
       FROM campaigns c
       JOIN campaign_geo_zones cgz ON c.id = cgz.campaign_id
       WHERE cgz.geo_zone_id = ? AND c.created_by = ?
       ORDER BY c.created_at DESC`,
            [zoneId, tokenData.userId]
        );

        const campaigns = (campaignRows as any[]).map(campaign => ({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status
        }));

        return NextResponse.json({
            success: true,
            data: campaigns
        });
    } catch (error) {
        console.error('Error fetching zone usage:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch zone usage' },
            { status: 500 }
        );
    }
}