import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Campaign, CampaignStatus, PlatformName } from '@/types/models';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// Mock campaigns data (for reference only - will be replaced by database access)
const mockCampaigns: Partial<Campaign>[] = [
    {
        id: '1',
        name: 'Summer Collection Launch',
        description: 'Promote our new summer collection',
        platforms: [
            {
                id: '1',
                name: PlatformName.FACEBOOK,
                accountId: 'fb123',
                accessToken: 'token123',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: '2',
                name: PlatformName.INSTAGRAM,
                accountId: 'ig123',
                accessToken: 'token456',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ],
        status: CampaignStatus.ACTIVE,
        budget: 1200,
        startDate: new Date('2025-05-15'),
        endDate: new Date('2025-06-15'),
        geoZones: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: '1'
    },
    // other mock campaigns...
];

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
        
        // In a real app, you'd fetch this from a database with the user's ID
        // For now, we'll return mock data
        
        // Simulate fetching campaigns from database
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return NextResponse.json({
            success: true,
            data: mockCampaigns
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
        
        if (body.platforms?.length === 0) {
            return NextResponse.json(
                { success: false, message: 'At least one platform must be selected' },
                { status: 400 }
            );
        }
        
        // Generate a new ID
        const campaignId = uuidv4();
        
        // Set up the campaign object
        const newCampaign: Partial<Campaign> = {
            id: campaignId,
            name: body.name,
            description: body.description,
            platforms: body.platforms,
            status: body.status || CampaignStatus.DRAFT,
            budget: body.budget,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            endDate: body.endDate ? new Date(body.endDate) : undefined,
            geoZones: body.geoZones || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: tokenData.userId
        };
        
        // In a real app, save the campaign to the database
        // For now, just add to mock data array
        mockCampaigns.push(newCampaign);
        
        // Simulate database interaction delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return NextResponse.json({
            success: true,
            message: 'Campaign created successfully',
            data: newCampaign
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating campaign:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create campaign' },
            { status: 500 }
        );
    }
}