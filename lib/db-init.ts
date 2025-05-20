import { initializeDatabase } from './db-setup';
import { migrateMetaTablesAndFields } from './db-migration-meta';

let initializationPromise: Promise<boolean> | null = null;

export async function ensureDatabaseInitialized() {
    if (!initializationPromise) {
        initializationPromise = initializeDatabase().catch(err => {
            initializationPromise = null; // Reset on error
            throw err;
        });
    }
    return initializationPromise;
}