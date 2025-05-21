import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { GeoZoneType } from '@/types/models';

// GET all geo zones
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

        const tokenData = verifyAccessToken(accessToken);

        if (!tokenData) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Get geo zones
        const [rows] = await pool.query(
            `SELECT gz.*, 
       COUNT(DISTINCT cgz.campaign_id) as campaigns
       FROM geo_zones gz
       LEFT JOIN campaign_geo_zones cgz ON gz.id = cgz.geo_zone_id
       WHERE gz.created_by = ?
       GROUP BY gz.id
       ORDER BY gz.created_at DESC`,
            [tokenData.userId]
        );

        // Process the results and include the point data for polygon zones
        const geoZones = await Promise.all((rows as any[]).map(async (zone) => {
            const geoZone = {
                id: zone.id,
                name: zone.name,
                type: zone.type,
                centerLat: zone.center_lat,
                centerLng: zone.center_lng,
                radiusKm: zone.radius_km,
                points: [],
                createdAt: zone.created_at,
                updatedAt: zone.updated_at,
                createdBy: zone.created_by,
                campaigns: zone.campaigns
            };

            // If it's a polygon, fetch the points
            if (zone.type === GeoZoneType.POLYGON) {
                const [pointRows] = await pool.query(
                    'SELECT lat, lng FROM geo_points WHERE geo_zone_id = ? ORDER BY point_order',
                    [zone.id]
                );

                geoZone.points = (pointRows as any[]).map(p => ({
                    lat: p.lat,
                    lng: p.lng
                }));
            }

            return geoZone;
        }));

        return NextResponse.json({
            success: true,
            data: geoZones
        });
    } catch (error) {
        console.error('Error fetching geo zones:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch geo zones' },
            { status: 500 }
        );
    }
}

// POST a new geo zone
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
        const { name, type, centerLat, centerLng, radiusKm, points } = body;

        // Validate required fields
        if (!name || !type) {
            return NextResponse.json(
                { success: false, message: 'Name and type are required' },
                { status: 400 }
            );
        }

        // Validate type-specific fields
        if (type === GeoZoneType.CIRCLE) {
            if (!centerLat || !centerLng || !radiusKm) {
                return NextResponse.json(
                    { success: false, message: 'Center coordinates and radius are required for circle zones' },
                    { status: 400 }
                );
            }
        } else if (type === GeoZoneType.POLYGON) {
            if (!points || !Array.isArray(points) || points.length < 3) {
                return NextResponse.json(
                    { success: false, message: 'At least 3 points are required for polygon zones' },
                    { status: 400 }
                );
            }
        } else {
            return NextResponse.json(
                { success: false, message: 'Invalid zone type' },
                { status: 400 }
            );
        }

        // Begin transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Generate a new UUID for the zone
            const zoneId = uuidv4();

            // Insert geo zone
            await connection.query(
                `INSERT INTO geo_zones 
         (id, name, type, center_lat, center_lng, radius_km, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    zoneId,
                    name,
                    type,
                    type === GeoZoneType.CIRCLE ? centerLat : null,
                    type === GeoZoneType.CIRCLE ? centerLng : null,
                    type === GeoZoneType.CIRCLE ? radiusKm : null,
                    tokenData.userId
                ]
            );

            // If polygon, insert points
            if (type === GeoZoneType.POLYGON && points && points.length > 0) {
                for (let i = 0; i < points.length; i++) {
                    const point = points[i];
                    await connection.query(
                        `INSERT INTO geo_points 
             (id, geo_zone_id, lat, lng, point_order)
             VALUES (?, ?, ?, ?, ?)`,
                        [uuidv4(), zoneId, point.lat, point.lng, i]
                    );
                }
            }

            // Commit transaction
            await connection.commit();

            // Return the created zone
            return NextResponse.json({
                success: true,
                message: 'Geo zone created successfully',
                data: {
                    id: zoneId,
                    name,
                    type,
                    centerLat: type === GeoZoneType.CIRCLE ? centerLat : null,
                    centerLng: type === GeoZoneType.CIRCLE ? centerLng : null,
                    radiusKm: type === GeoZoneType.CIRCLE ? radiusKm : null,
                    points: type === GeoZoneType.POLYGON ? points : [],
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
            connection.release();
        }
    } catch (error) {
        console.error('Error creating geo zone:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create geo zone' },
            { status: 500 }
        );
    }
}