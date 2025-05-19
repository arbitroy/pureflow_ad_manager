import { initializeDatabase } from './db-setup';

let dbInitialized = false;

export async function ensureDatabaseInitialized() {
    if (dbInitialized) {
        return true;
    }

    try {
        const success = await initializeDatabase();
        dbInitialized = success;
        return success;
    } catch (error) {
        console.error('Database initialization failed:', error);
        return false;
    }
}