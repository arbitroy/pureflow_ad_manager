// app/api/analytics/cache/route.ts
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { 
    clearUserAnalyticsCache, 
    clearExpiredCache, 
    clearAllAnalyticsCache,
    getCacheStats 
} from '@/lib/utils/cacheUtils';

// GET cache statistics
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

        // Only allow admin users to view cache stats
        if (tokenData.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Admin access required' },
                { status: 403 }
            );
        }

        const stats = await getCacheStats();

        return NextResponse.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error getting cache stats:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to get cache statistics' },
            { status: 500 }
        );
    }
}

// DELETE cache entries
export async function DELETE(request: Request) {
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

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'user';

        switch (action) {
            case 'user':
                // Clear cache for current user
                await clearUserAnalyticsCache(tokenData.userId);
                return NextResponse.json({
                    success: true,
                    message: 'User cache cleared successfully'
                });

            case 'expired':
                // Clear expired cache entries (available to all users)
                const expiredCount = await clearExpiredCache();
                return NextResponse.json({
                    success: true,
                    message: `Cleared ${expiredCount} expired cache entries`
                });

            case 'all':
                // Clear all cache (admin only)
                if (tokenData.role !== 'ADMIN') {
                    return NextResponse.json(
                        { success: false, message: 'Admin access required' },
                        { status: 403 }
                    );
                }
                await clearAllAnalyticsCache();
                return NextResponse.json({
                    success: true,
                    message: 'All cache cleared successfully'
                });

            default:
                return NextResponse.json(
                    { success: false, message: 'Invalid action. Use: user, expired, or all' },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('Error clearing cache:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to clear cache' },
            { status: 500 }
        );
    }
}