import { initializeDatabase } from './db-setup';
import { migrateMetaTablesAndFields } from './db-migration-meta';

let dbInitialized = false;

export async function ensureDatabaseInitialized() {
    if (dbInitialized) {
        return true;
    }

    try {
        // Initialize base database
        const success = await initializeDatabase();
        
        // Run Meta API migration
        if (success) {
            await migrateMetaTablesAndFields();
        }
        
        dbInitialized = success;
        return success;
    } catch (error) {
        console.error('Database initialization failed:', error);
        return false;
    }
}