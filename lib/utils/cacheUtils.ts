import { getPool } from '../db';

/**
 * Clear all analytics cache for a specific user
 */
export async function clearUserAnalyticsCache(userId: string): Promise<void> {
    const pool = await getPool();
    
    try {
        const [result] = await pool.query(
            'DELETE FROM analytics_cache WHERE user_id = ?',
            [userId]
        );
        
        const deletedCount = (result as any).affectedRows;
        console.log(`Cleared ${deletedCount} cache entries for user ${userId}`);
    } catch (error) {
        console.error('Error clearing user analytics cache:', error);
        throw error;
    }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
    const pool = await getPool();
    
    try {
        const [result] = await pool.query(
            'DELETE FROM analytics_cache WHERE expires_at < NOW()'
        );
        
        const deletedCount = (result as any).affectedRows;
        if (deletedCount > 0) {
            console.log(`Cleared ${deletedCount} expired cache entries`);
        }
        
        return deletedCount;
    } catch (error) {
        console.error('Error clearing expired cache:', error);
        throw error;
    }
}

/**
 * Clear all analytics cache
 */
export async function clearAllAnalyticsCache(): Promise<void> {
    const pool = await getPool();
    
    try {
        const [result] = await pool.query('DELETE FROM analytics_cache');
        
        const deletedCount = (result as any).affectedRows;
        console.log(`Cleared all ${deletedCount} cache entries`);
    } catch (error) {
        console.error('Error clearing all analytics cache:', error);
        throw error;
    }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    activeEntries: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
}> {
    const pool = await getPool();
    
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_entries,
                SUM(CASE WHEN expires_at < NOW() THEN 1 ELSE 0 END) as expired_entries,
                SUM(CASE WHEN expires_at >= NOW() THEN 1 ELSE 0 END) as active_entries,
                MIN(created_at) as oldest_entry,
                MAX(created_at) as newest_entry
            FROM analytics_cache
        `);
        
        const result = (stats as any[])[0];
        
        return {
            totalEntries: result.total_entries || 0,
            expiredEntries: result.expired_entries || 0,
            activeEntries: result.active_entries || 0,
            oldestEntry: result.oldest_entry ? new Date(result.oldest_entry) : null,
            newestEntry: result.newest_entry ? new Date(result.newest_entry) : null
        };
    } catch (error) {
        console.error('Error getting cache stats:', error);
        throw error;
    }
}