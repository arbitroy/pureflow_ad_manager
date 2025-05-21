import { initializeDatabase } from './db-setup';
import { migrateMetaTablesAndFields } from './db-migration-meta';

// Use a Promise to track the initialization state
let initializationPromise: Promise<boolean> | null = null;

export async function ensureDatabaseInitialized() {
    // If an initialization is already in progress, return that promise
    if (!initializationPromise) {
        // Start a new initialization and store the promise
        initializationPromise = (async () => {
            try {
                // Initialize base database
                const success = await initializeDatabase();
                
                // Run Meta API migration
                if (success) {
                    await migrateMetaTablesAndFields();
                }
                
                return success;
            } catch (error) {
                console.error('Database initialization failed:', error);
                // Reset on error so we can try again
                initializationPromise = null;
                return false;
            }
        })();
    }
    
    return initializationPromise;
}