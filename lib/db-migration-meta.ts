import mysql from 'mysql2/promise';
import { getPool } from './db';

/**
 * Migration function to add Meta-specific tables and fields
 */
export async function migrateMetaTablesAndFields(): Promise<boolean> {
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
        console.log('Starting Meta API integration migration...');

        // Begin transaction
        await connection.beginTransaction();

        // Create meta_campaign_metadata table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS meta_campaign_metadata (
        id VARCHAR(36) PRIMARY KEY,
        campaign_id VARCHAR(36) NOT NULL,
        meta_campaign_id VARCHAR(255) NOT NULL,
        meta_adset_id VARCHAR(255) NOT NULL,
        meta_ad_id VARCHAR(255) NOT NULL,
        platform ENUM('FACEBOOK', 'INSTAGRAM') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        UNIQUE KEY (campaign_id, platform)
      )
    `);

        // Create ad_creatives table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS ad_creatives (
        id VARCHAR(36) PRIMARY KEY,
        campaign_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        image_url VARCHAR(255),
        video_url VARCHAR(255),
        call_to_action_type VARCHAR(50),
        call_to_action_link VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
      )
    `);

        // Check if campaign_platforms table exists
        const [tables] = await connection.query(
            `SELECT * FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'campaign_platforms'`
        );

        if ((tables as any[]).length > 0) {
            // Check if columns exist before adding them
            const [columns] = await connection.query(
                `SELECT * FROM information_schema.COLUMNS 
                 WHERE TABLE_SCHEMA = DATABASE() 
                 AND TABLE_NAME = 'campaign_platforms'
                 AND COLUMN_NAME = 'platform_status'`
            );

            if ((columns as any[]).length === 0) {
                // Add platform_status field to campaign_platforms table
                await connection.query(`
                  ALTER TABLE campaign_platforms
                  ADD COLUMN platform_status ENUM('PENDING', 'PUBLISHED', 'FAILED') DEFAULT 'PENDING',
                  ADD COLUMN platform_error TEXT,
                  ADD COLUMN last_synced TIMESTAMP NULL
                `);
            }
        }

        // Check if objective column exists in campaigns table
        const [campaignColumns] = await connection.query(
            `SELECT * FROM information_schema.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'campaigns'
             AND COLUMN_NAME = 'objective'`
        );

        if ((campaignColumns as any[]).length === 0) {
            // Add objective and platform_data fields to campaigns table
            await connection.query(`
              ALTER TABLE campaigns
              ADD COLUMN objective ENUM('AWARENESS', 'CONSIDERATION', 'CONVERSION') DEFAULT 'CONSIDERATION',
              ADD COLUMN platform_data JSON
            `);
        }

        // Commit transaction
        await connection.commit();

        console.log('Meta API integration migration completed successfully.');
        return true;
    } catch (error) {
        // Rollback transaction on error
        await connection.rollback();
        console.error('Error during Meta API integration migration:', error);
        return false;
    } finally {
        connection.release();
    }
}