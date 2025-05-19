import { NextResponse } from 'next/server';
import { Campaign, CampaignStatus, PlatformName } from '@/types/models';

// Mock campaigns data
const campaigns: Partial<Campaign>[] = [
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
    {
        id: '2',
        name: 'Flash Sale Promotion',
        description: 'Flash sale for weekend customers',
        platforms: [
            {
                id: '2',
                name: PlatformName.INSTAGRAM,
                accountId: 'ig123',
                accessToken: 'token456',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ],
        status: CampaignStatus.SCHEDULED,
        budget: 800,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-05'),
        geoZones: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: '1'
    },
    {
        id: '3',
        name: 'New Product Announcement',
        description: 'Launch of our flagship product',
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
        status: CampaignStatus.DRAFT,
        budget: 500,
        geoZones: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: '1'
    }
];

// GET all campaigns
export async function GET(request: Request) {
    try {
        // In a real app, you would fetch this from a database
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
        const body = await request.json();

        // In a real app, you would validate the input and save to database
        const newCampaign: Partial<Campaign> = {
            id: `${campaigns.length + 1}`,
            ...body,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: '1', // Mock user ID
        };

        // Add to mock data
        campaigns.push(newCampaign);

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