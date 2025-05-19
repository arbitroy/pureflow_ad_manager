
import { NextResponse } from 'next/server';
import { syncAllActiveCampaigns } from '@/lib/api/metaSync';

// This is a scheduled API route that will be called by a cron job or similar mechanism
export async function GET(request: Request) {
    // Check for a secret key to ensure this endpoint is only called by authorized sources
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get('key');

    // Verify the secret key
    if (secretKey !== process.env.SYNC_JOB_SECRET_KEY) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        // Run the synchronization
        await syncAllActiveCampaigns();

        return NextResponse.json({
            success: true,
            message: 'Campaign metrics sync completed'
        });
    } catch (error) {
        console.error('Error syncing campaign metrics:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to sync campaign metrics' },
            { status: 500 }
        );
    }
}