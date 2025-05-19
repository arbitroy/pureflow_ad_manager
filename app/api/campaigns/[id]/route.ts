import { NextResponse } from 'next/server';

// GET a specific campaign
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        // In a real app, you would fetch from database
        // For demo, we'll return a mock response
        return NextResponse.json({
            success: true,
            data: {
                id,
                name: `Campaign ${id}`,
                description: 'Campaign details here',
                // ... other fields
            }
        });
    } catch (error) {
        console.error(`Error fetching campaign ${params.id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch campaign' },
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
        const id = params.id;
        const body = await request.json();

        // In a real app, you would update in database
        return NextResponse.json({
            success: true,
            message: 'Campaign updated successfully',
            data: {
                id,
                ...body,
                updatedAt: new Date()
            }
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
        const id = params.id;

        // In a real app, you would delete from database
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