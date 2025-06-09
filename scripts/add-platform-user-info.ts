// scripts/add-platform-user-info.ts
import mysql from 'mysql2/promise';

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_NAME || 'pureflow_db',
};

async function addPlatformUserInfoTable() {
    const connection = await mysql.createConnection(DB_CONFIG);
    
    try {
        console.log('🔄 Adding platform_user_info table...');

        // Create platform_user_info table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS platform_user_info (
                platform_id VARCHAR(36) PRIMARY KEY,
                fb_user_id VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                email VARCHAR(255),
                profile_picture TEXT,
                instagram_username VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
                INDEX idx_fb_user_id (fb_user_id),
                INDEX idx_instagram_username (instagram_username)
            );
        `);

        console.log('✅ Platform user info table created successfully');

        console.log('🔄 Checking if we need to add any missing indexes...');

        // Add indexes to existing tables if they don't exist
        try {
            await connection.execute(`
                CREATE INDEX IF NOT EXISTS idx_user_platforms_user_id ON user_platforms(user_id);
            `);
            await connection.execute(`
                CREATE INDEX IF NOT EXISTS idx_user_platforms_platform_id ON user_platforms(platform_id);
            `);
            await connection.execute(`
                CREATE INDEX IF NOT EXISTS idx_platforms_name ON platforms(name);
            `);
            console.log('✅ Additional indexes added successfully');
        } catch (error) {
            console.log('ℹ️ Some indexes may already exist, continuing...');
        }

        console.log('🎉 Database migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Run the migration if this file is executed directly
if (require.main === module) {
    addPlatformUserInfoTable()
        .then(() => {
            console.log('Migration completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

export default addPlatformUserInfoTable;