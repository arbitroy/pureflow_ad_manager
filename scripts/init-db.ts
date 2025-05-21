const { initializeDatabase } = require('../lib/db-setup');
const { migrateMetaTablesAndFields } = require('../lib/db-migration-meta');

async function runInit() {
    try {
        console.log('Starting database initialization...');
        const success = await initializeDatabase();
        
        if (success) {
            console.log('Database initialization completed successfully');
            console.log('Running Meta API tables migration...');
            try {
                const metaMigrationSuccess = await migrateMetaTablesAndFields();
                if (metaMigrationSuccess) {
                    console.log('Meta API integration migration completed successfully.');
                } else {
                    console.error('Meta API integration migration failed, but base database setup succeeded.');
                }
            } catch (metaError) {
                console.error('Error during Meta API migration:', metaError);
                // Continue anyway since the base database is initialized
            }
        } else {
            console.error('Database initialization failed');
            process.exit(1);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error running initialization:', error);
        process.exit(1);
    }
}

runInit();