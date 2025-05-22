// lib/db-migration-analytics.ts
import { getPool } from './db';

/**
 * Migration function to add Analytics Dashboard tables
 */
export async function migrateAnalyticsTables(): Promise<boolean> {
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
        console.log('Starting Analytics Dashboard migration...');

        // Begin transaction
        await connection.beginTransaction();

        // Create scheduled_reports table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS scheduled_reports (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL,
                frequency ENUM('daily', 'weekly', 'monthly') NOT NULL,
                recipients JSON NOT NULL,
                format ENUM('csv', 'pdf') NOT NULL,
                include_charts BOOLEAN DEFAULT FALSE,
                filters JSON,
                timezone VARCHAR(50) DEFAULT 'UTC',
                next_run TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_next_run (next_run),
                INDEX idx_active (is_active)
            )
        `);

        // Create report_executions table to track report generation history
        await connection.query(`
            CREATE TABLE IF NOT EXISTS report_executions (
                id VARCHAR(36) PRIMARY KEY,
                scheduled_report_id VARCHAR(36) NOT NULL,
                execution_time TIMESTAMP NOT NULL,
                status ENUM('success', 'failed', 'pending') NOT NULL,
                file_path VARCHAR(500),
                error_message TEXT,
                records_count INT DEFAULT 0,
                file_size_bytes INT DEFAULT 0,
                execution_duration_ms INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (scheduled_report_id) REFERENCES scheduled_reports(id) ON DELETE CASCADE,
                INDEX idx_scheduled_report (scheduled_report_id),
                INDEX idx_execution_time (execution_time),
                INDEX idx_status (status)
            )
        `);

        // Add indexes to analytics table for better performance
        try {
            await connection.query(`
                ALTER TABLE analytics 
                ADD INDEX idx_campaign_date (campaign_id, date),
                ADD INDEX idx_platform_date (platform, date),
                ADD INDEX idx_date_range (date)
            `);
        } catch (error: any) {
            // Indexes might already exist, continue
            if (!error.message.includes('Duplicate key name')) {
                console.warn('Warning adding analytics indexes:', error.message);
            }
        }

        // Add indexes to campaigns table for analytics queries
        try {
            await connection.query(`
                ALTER TABLE campaigns 
                ADD INDEX idx_created_by_status (created_by, status),
                ADD INDEX idx_created_by_dates (created_by, start_date, end_date)
            `);
        } catch (error: any) {
            // Indexes might already exist, continue
            if (!error.message.includes('Duplicate key name')) {
                console.warn('Warning adding campaigns indexes:', error.message);
            }
        }

        // Create analytics_cache table for performance optimization
        await connection.query(`
            CREATE TABLE IF NOT EXISTS analytics_cache (
                id VARCHAR(36) PRIMARY KEY,
                cache_key VARCHAR(255) NOT NULL UNIQUE,
                user_id VARCHAR(36) NOT NULL,
                data JSON NOT NULL,
                filters JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_cache_key (cache_key),
                INDEX idx_user_expires (user_id, expires_at),
                INDEX idx_expires (expires_at)
            )
        `);

        // Create analytics_favorites table for saved dashboard configurations
        await connection.query(`
            CREATE TABLE IF NOT EXISTS analytics_favorites (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                filters JSON NOT NULL,
                chart_config JSON,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_user_default (user_id, is_default)
            )
        `);

        // Add sample data for testing (optional)
        await addSampleAnalyticsData(connection);

        // Commit transaction
        await connection.commit();

        console.log('Analytics Dashboard migration completed successfully.');
        return true;
    } catch (error) {
        // Rollback transaction on error
        await connection.rollback();
        console.error('Error during Analytics Dashboard migration:', error);
        return false;
    } finally {
        connection.release();
    }
}

/**
 * Add sample analytics data for testing
 */
async function addSampleAnalyticsData(connection: any) {
    try {
        // Check if we already have analytics data
        const [existingAnalytics] = await connection.query('SELECT COUNT(*) as count FROM analytics');
        const analyticsCount = existingAnalytics[0].count;

        if (analyticsCount > 0) {
            console.log('Analytics data already exists, skipping sample data creation.');
            return;
        }

        // Get existing campaigns and platforms for sample data
        const [campaigns] = await connection.query('SELECT id FROM campaigns LIMIT 3');
        const [platforms] = await connection.query('SELECT name FROM platforms LIMIT 2');

        if (campaigns.length === 0 || platforms.length === 0) {
            console.log('No campaigns or platforms found, skipping sample analytics data.');
            return;
        }

        console.log('Adding sample analytics data...');

        // Generate sample data for the last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const currentDate = new Date(startDate);
        const sampleData: any[] = [];

        while (currentDate <= endDate) {
            for (const campaign of campaigns) {
                for (const platform of platforms) {
                    // Generate realistic random metrics
                    const impressions = Math.floor(Math.random() * 10000) + 1000;
                    const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01)); // 1-6% CTR
                    const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.02)); // 2-12% conversion rate
                    const cost = Math.round((clicks * (Math.random() * 2 + 0.5)) * 100) / 100; // $0.50-$2.50 CPC
                    const roi = cost > 0 ? Math.round(((conversions * 50 - cost) / cost * 100) * 100) / 100 : 0;

                    sampleData.push([
                        `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        campaign.id,
                        platform.name,
                        impressions,
                        clicks,
                        conversions,
                        cost,
                        roi,
                        currentDate.toISOString().split('T')[0]
                    ]);
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Batch insert sample data
        if (sampleData.length > 0) {
            const placeholders = sampleData.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
            const flatData = sampleData.flat();

            await connection.query(
                `INSERT INTO analytics 
                (id, campaign_id, platform, impressions, clicks, conversions, cost, roi, date) 
                VALUES ${placeholders}`,
                flatData
            );

            console.log(`Added ${sampleData.length} sample analytics records.`);
        }
    } catch (error) {
        console.error('Error adding sample analytics data:', error);
        // Don't throw error - sample data is optional
    }
}

/**
 * Clean up expired cache entries
 */
export async function cleanupAnalyticsCache(): Promise<void> {
    const pool = await getPool();
    
    try {
        const [result] = await pool.query(
            'DELETE FROM analytics_cache WHERE expires_at < NOW()'
        );
        
        const deletedCount = (result as any).affectedRows;
        if (deletedCount > 0) {
            console.log(`Cleaned up ${deletedCount} expired analytics cache entries.`);
        }
    } catch (error) {
        console.error('Error cleaning up analytics cache:', error);
    }
}

/**
 * Get analytics cache
 */
export async function getAnalyticsCache(cacheKey: string, userId: string): Promise<any | null> {
    const pool = await getPool();
    
    try {
        const [rows] = await pool.query(
            'SELECT data FROM analytics_cache WHERE cache_key = ? AND user_id = ? AND expires_at > NOW()',
            [cacheKey, userId]
        );
        
        if ((rows as any[]).length > 0) {
            const cachedData = (rows as any[])[0].data;
            
            // Handle different data types
            if (typeof cachedData === 'string') {
                try {
                    return JSON.parse(cachedData);
                } catch (parseError) {
                    console.error('Error parsing cached data:', parseError);
                    // Delete invalid cache entry
                    await pool.query(
                        'DELETE FROM analytics_cache WHERE cache_key = ? AND user_id = ?',
                        [cacheKey, userId]
                    );
                    return null;
                }
            } else if (typeof cachedData === 'object' && cachedData !== null) {
                // Data is already an object (MySQL JSON type)
                return cachedData;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error getting analytics cache:', error);
        return null;
    }
}

/**
 * Set analytics cache
 */
export async function setAnalyticsCache(
    cacheKey: string, 
    userId: string, 
    data: any, 
    filters: any = null, 
    expiryMinutes: number = 15
): Promise<void> {
    const pool = await getPool();
    
    try {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
        
        // Ensure data can be serialized properly
        let serializedData: string;
        let serializedFilters: string;
        
        try {
            // Create a safe copy of the data without circular references
            serializedData = JSON.stringify(data, (key, value) => {
                // Handle potential circular references and functions
                if (typeof value === 'function') {
                    return undefined;
                }
                if (typeof value === 'object' && value !== null) {
                    // Check for circular reference by stringifying
                    try {
                        JSON.stringify(value);
                        return value;
                    } catch {
                        return '[Circular Reference]';
                    }
                }
                return value;
            });
            
            serializedFilters = JSON.stringify(filters || {});
        } catch (serializationError) {
            console.error('Error serializing cache data:', serializationError);
            return; // Don't cache if we can't serialize
        }
        
        await pool.query(
            `INSERT INTO analytics_cache (id, cache_key, user_id, data, filters, expires_at)
             VALUES (UUID(), ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             data = VALUES(data),
             filters = VALUES(filters),
             expires_at = VALUES(expires_at)`,
            [cacheKey, userId, serializedData, serializedFilters, expiresAt]
        );
        
        console.log(`Analytics cache set for key: ${cacheKey.substring(0, 50)}...`);
    } catch (error) {
        console.error('Error setting analytics cache:', error);
        // Don't throw error - caching failure shouldn't break the API
    }
}