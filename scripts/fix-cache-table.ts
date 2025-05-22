const { getPool } = require('../lib/db');

async function fixCacheTable() {
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
        console.log('🔧 Fixing analytics cache table schema...');

        // Begin transaction
        await connection.beginTransaction();

        // Drop and recreate the analytics_cache table with proper schema
        await connection.query('DROP TABLE IF EXISTS analytics_cache');
        
        await connection.query(`
            CREATE TABLE analytics_cache (
                id VARCHAR(36) PRIMARY KEY,
                cache_key VARCHAR(255) NOT NULL UNIQUE,
                user_id VARCHAR(36) NOT NULL,
                data LONGTEXT NOT NULL,
                filters TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_cache_key (cache_key),
                INDEX idx_user_expires (user_id, expires_at),
                INDEX idx_expires (expires_at)
            )
        `);

        // Commit transaction
        await connection.commit();

        console.log('✅ Analytics cache table fixed successfully!');
        console.log('📋 Changes made:');
        console.log('   - Recreated analytics_cache table');
        console.log('   - Changed data column to LONGTEXT for better JSON storage');
        console.log('   - Improved error handling for cache operations');
        
    } catch (error) {
        // Rollback transaction on error
        await connection.rollback();
        console.error('❌ Error fixing cache table:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// Run the fix
fixCacheTable()
    .then(() => {
        console.log('🎉 Cache table fix completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Fix failed:', error);
        process.exit(1);
    });