import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from './auth';
import { UserRole, PlatformName, CampaignStatus } from '../types/models';

// Database connection parameters
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'pureflow';
const DB_PASSWORD = process.env.DB_PASSWORD || '12345';
const DB_NAME = process.env.DB_NAME || 'pureflow_db';

// Create root connection (without database)
async function getRootConnection() {
    return mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD
    });
}

// Create database if it doesn't exist
async function createDatabaseIfNotExists() {
    const connection = await getRootConnection();
    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
        console.log(`Database ${DB_NAME} created or already exists`);
    } catch (error) {
        console.error('Error creating database:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Get DB connection
async function getDbConnection() {
    return mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME
    });
}

// Create tables if they don't exist
async function createTablesIfNotExist() {
    const connection = await getDbConnection();

    try {
        // Define all table creation SQL statements
        const createTablesSQL = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'MARKETING') NOT NULL DEFAULT 'MARKETING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

            // Platforms table
            `CREATE TABLE IF NOT EXISTS platforms (
        id VARCHAR(36) PRIMARY KEY,
        name ENUM('FACEBOOK', 'INSTAGRAM') NOT NULL,
        account_id VARCHAR(255) NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_expiry TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

            // Geo zones table
            `CREATE TABLE IF NOT EXISTS geo_zones (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type ENUM('CIRCLE', 'POLYGON') NOT NULL,
        center_lat DECIMAL(10, 8),
        center_lng DECIMAL(11, 8),
        radius_km DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by VARCHAR(36) NOT NULL
      )`,

            // Geo points table
            `CREATE TABLE IF NOT EXISTS geo_points (
        id VARCHAR(36) PRIMARY KEY,
        geo_zone_id VARCHAR(36) NOT NULL,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        point_order INT NOT NULL,
        FOREIGN KEY (geo_zone_id) REFERENCES geo_zones(id) ON DELETE CASCADE
      )`,

            // Campaigns table
            `CREATE TABLE IF NOT EXISTS campaigns (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
        budget DECIMAL(10, 2) NOT NULL,
        start_date TIMESTAMP NULL,
        end_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by VARCHAR(36) NOT NULL
      )`,

            // Campaign platforms join table
            `CREATE TABLE IF NOT EXISTS campaign_platforms (
        campaign_id VARCHAR(36) NOT NULL,
        platform_id VARCHAR(36) NOT NULL,
        PRIMARY KEY (campaign_id, platform_id),
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
      )`,

            // Campaign geo zones join table
            `CREATE TABLE IF NOT EXISTS campaign_geo_zones (
        campaign_id VARCHAR(36) NOT NULL,
        geo_zone_id VARCHAR(36) NOT NULL,
        PRIMARY KEY (campaign_id, geo_zone_id),
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (geo_zone_id) REFERENCES geo_zones(id) ON DELETE CASCADE
      )`,

            // Analytics table
            `CREATE TABLE IF NOT EXISTS analytics (
        id VARCHAR(36) PRIMARY KEY,
        campaign_id VARCHAR(36) NOT NULL,
        platform ENUM('FACEBOOK', 'INSTAGRAM') NOT NULL,
        impressions INT UNSIGNED NOT NULL DEFAULT 0,
        clicks INT UNSIGNED NOT NULL DEFAULT 0,
        conversions INT UNSIGNED NOT NULL DEFAULT 0,
        cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        ctr DECIMAL(5, 4) GENERATED ALWAYS AS (CASE WHEN impressions > 0 THEN clicks / impressions ELSE 0 END) STORED,
        conversion_rate DECIMAL(5, 4) GENERATED ALWAYS AS (CASE WHEN clicks > 0 THEN conversions / clicks ELSE 0 END) STORED,
        cpc DECIMAL(10, 2) GENERATED ALWAYS AS (CASE WHEN clicks > 0 THEN cost / clicks ELSE 0 END) STORED,
        cpa DECIMAL(10, 2) GENERATED ALWAYS AS (CASE WHEN conversions > 0 THEN cost / conversions ELSE 0 END) STORED,
        roi DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        UNIQUE KEY (campaign_id, platform, date)
      )`,

            // Refresh tokens table
            `CREATE TABLE IF NOT EXISTS refresh_tokens (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
        ];

        // Execute all SQL statements
        for (const sql of createTablesSQL) {
            await connection.query(sql);
        }

        // Add foreign key constraints after all tables are created
        const foreignKeyConstraints = [
            `ALTER TABLE geo_zones ADD CONSTRAINT fk_geo_zones_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE`,
            `ALTER TABLE campaigns ADD CONSTRAINT fk_campaigns_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE`
        ];

        for (const sql of foreignKeyConstraints) {
            try {
                await connection.query(sql);
            } catch (error) {
                // More comprehensive error handling
                if (
                    error instanceof Error &&
                    typeof error.message === 'string' &&
                    (error.message.includes('Duplicate key name') ||
                        error.message.includes('already exists') ||
                        (error as any).code === 'ER_FK_DUP_NAME')
                ) {
                    console.log(`Foreign key constraint already exists, skipping: ${sql}`);
                } else {
                    throw error;
                }
            }
        }

        console.log('Tables and constraints created or updated successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Check if seed data is needed
async function needsSeedData() {
    const connection = await getDbConnection();
    try {
        // Check if users table is empty
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        const userCount = (users as any)[0].count;

        return userCount === 0;
    } catch (error) {
        console.error('Error checking if seed data is needed:', error);
        return true; // Assume seeding is needed on error
    } finally {
        await connection.end();
    }
}

// Seed initial data
async function seedInitialData() {
    if (!(await needsSeedData())) {
        console.log('Database already has data, skipping seed');
        return;
    }

    const connection = await getDbConnection();

    try {
        console.log('Seeding initial data...');

        // Create admin user
        const adminId = uuidv4();
        const adminEmail = 'admin@pureflow.com';
        const adminPassword = await hashPassword('admin123'); // Change this in production
        const adminName = 'Admin User';

        await connection.query(
            'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
            [adminId, adminEmail, adminPassword, adminName, UserRole.ADMIN]
        );

        // Create marketing user
        const marketingId = uuidv4();
        const marketingEmail = 'marketing@pureflow.com';
        const marketingPassword = await hashPassword('marketing123'); // Change this in production
        const marketingName = 'Marketing User';

        await connection.query(
            'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
            [marketingId, marketingEmail, marketingPassword, marketingName, UserRole.MARKETING]
        );

        // Create platforms
        const facebookId = uuidv4();
        const instagramId = uuidv4();

        await connection.query(
            'INSERT INTO platforms (id, name, account_id, access_token) VALUES (?, ?, ?, ?)',
            [facebookId, PlatformName.FACEBOOK, 'fb123', 'token123']
        );

        await connection.query(
            'INSERT INTO platforms (id, name, account_id, access_token) VALUES (?, ?, ?, ?)',
            [instagramId, PlatformName.INSTAGRAM, 'ig123', 'token456']
        );

        // Create geo zones
        const downtownId = uuidv4();
        const universityId = uuidv4();

        await connection.query(
            'INSERT INTO geo_zones (id, name, type, center_lat, center_lng, radius_km, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [downtownId, 'Downtown', 'CIRCLE', 40.7128, -74.0060, 2.5, marketingId]
        );

        await connection.query(
            'INSERT INTO geo_zones (id, name, type, center_lat, center_lng, radius_km, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [universityId, 'University Area', 'CIRCLE', 40.7282, -73.9942, 1.8, marketingId]
        );

        // Create campaigns
        const campaignId1 = uuidv4();
        const campaignId2 = uuidv4();

        const now = new Date();
        const oneMonthLater = new Date();
        oneMonthLater.setMonth(now.getMonth() + 1);

        await connection.query(
            'INSERT INTO campaigns (id, name, description, status, budget, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                campaignId1,
                'Summer Collection Launch',
                'Promote our new summer collection',
                CampaignStatus.ACTIVE,
                1200.00,
                now,
                oneMonthLater,
                marketingId
            ]
        );

        await connection.query(
            'INSERT INTO campaigns (id, name, description, status, budget, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [
                campaignId2,
                'Flash Sale Promotion',
                'Flash sale for weekend customers',
                CampaignStatus.DRAFT,
                800.00,
                marketingId
            ]
        );

        // Link campaigns to platforms
        await connection.query(
            'INSERT INTO campaign_platforms (campaign_id, platform_id) VALUES (?, ?)',
            [campaignId1, facebookId]
        );

        await connection.query(
            'INSERT INTO campaign_platforms (campaign_id, platform_id) VALUES (?, ?)',
            [campaignId1, instagramId]
        );

        await connection.query(
            'INSERT INTO campaign_platforms (campaign_id, platform_id) VALUES (?, ?)',
            [campaignId2, instagramId]
        );

        // Link campaigns to geo zones
        await connection.query(
            'INSERT INTO campaign_geo_zones (campaign_id, geo_zone_id) VALUES (?, ?)',
            [campaignId1, downtownId]
        );

        await connection.query(
            'INSERT INTO campaign_geo_zones (campaign_id, geo_zone_id) VALUES (?, ?)',
            [campaignId2, universityId]
        );

        // Create analytics data
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const analyticsId1 = uuidv4();
        const analyticsId2 = uuidv4();

        await connection.query(
            'INSERT INTO analytics (id, campaign_id, platform, impressions, clicks, conversions, cost, roi, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                analyticsId1,
                campaignId1,
                PlatformName.FACEBOOK,
                25000,
                1200,
                85,
                450.00,
                215.00,
                yesterday.toISOString().split('T')[0]
            ]
        );

        await connection.query(
            'INSERT INTO analytics (id, campaign_id, platform, impressions, clicks, conversions, cost, roi, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                analyticsId2,
                campaignId1,
                PlatformName.INSTAGRAM,
                18000,
                950,
                62,
                380.00,
                190.00,
                yesterday.toISOString().split('T')[0]
            ]
        );

        console.log('Initial data seeded successfully');
    } catch (error) {
        console.error('Error seeding initial data:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Main initialization function
export async function initializeDatabase() {
    try {
        // Step 1: Create database if it doesn't exist
        await createDatabaseIfNotExists();

        // Step 2: Create tables if they don't exist
        await createTablesIfNotExist();

        // Step 3: Seed initial data if needed
        await seedInitialData();

        console.log('Database initialization completed successfully');
        return true;
    } catch (error) {
        console.error('Database initialization failed:', error);
        return false;
    }
}