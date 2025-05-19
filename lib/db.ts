import mysql from 'mysql2/promise';
import { ensureDatabaseInitialized } from './db-init';

// Lazy-loaded pool creation
let pool: mysql.Pool | null = null;

export async function getPool(): Promise<mysql.Pool> {
    if (!pool) {
        // Ensure database is initialized before creating the pool
        await ensureDatabaseInitialized();

        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'pureflow_db',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }

    return pool;
}

// For backward compatibility
export default {
    query: async (...args: any[]) => {
        const poolInstance = await getPool();
        return poolInstance.query(...args);
    },
    execute: async (...args: any[]) => {
        const poolInstance = await getPool();
        return poolInstance.execute(...args);
    },
    end: async () => {
        if (pool) {
            await pool.end();
            pool = null;
        }
    }
};