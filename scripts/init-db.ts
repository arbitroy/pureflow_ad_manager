const { initializeDatabase } = require('../lib/db-setup');

async function runInit() {
    try {
        const success = await initializeDatabase();
        if (success) {
            console.log('Database initialized successfully');
            process.exit(0);
        } else {
            console.error('Database initialization failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('Error running initialization:', error);
        process.exit(1);
    }
}

runInit();