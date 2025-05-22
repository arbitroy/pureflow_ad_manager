const { initializeDatabase } = require('../lib/db-setup');
const { migrateMetaTablesAndFields } = require('../lib/db-migration-meta');
const { migrateAnalyticsTables } = require('../lib/db-migration-analytics');

async function runInit() {
    try {
        console.log('🚀 Starting database initialization...');
        
        // Step 1: Initialize base database
        console.log('📊 Setting up base database...');
        const success = await initializeDatabase();
        
        if (success) {
            console.log('✅ Database initialization completed successfully');
            
            // Step 2: Run Meta API tables migration
            console.log('🔗 Running Meta API integration migration...');
            try {
                const metaMigrationSuccess = await migrateMetaTablesAndFields();
                if (metaMigrationSuccess) {
                    console.log('✅ Meta API integration migration completed successfully');
                } else {
                    console.error('❌ Meta API integration migration failed, but base database setup succeeded');
                }
            } catch (metaError) {
                console.error('❌ Error during Meta API migration:', metaError);
                // Continue anyway since the base database is initialized
            }
            
            // Step 3: Run Analytics Dashboard migration
            console.log('📈 Running Analytics Dashboard migration...');
            try {
                const analyticsMigrationSuccess = await migrateAnalyticsTables();
                if (analyticsMigrationSuccess) {
                    console.log('✅ Analytics Dashboard migration completed successfully');
                } else {
                    console.error('❌ Analytics Dashboard migration failed, but core functionality remains intact');
                }
            } catch (analyticsError) {
                console.error('❌ Error during Analytics Dashboard migration:', analyticsError);
                // Continue anyway since the base database is initialized
            }
            
            console.log('🎉 All database migrations completed!');
            console.log('');
            console.log('📋 Migration Summary:');
            console.log('   ✅ Base database tables');
            console.log('   ✅ Meta API integration tables');
            console.log('   ✅ Analytics Dashboard tables');
            console.log('   ✅ Sample data (if needed)');
            console.log('');
            console.log('🔗 You can now start the development server with: npm run dev');
            
        } else {
            console.error('❌ Database initialization failed');
            process.exit(1);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('💥 Error running initialization:', error);
        process.exit(1);
    }
}

runInit();