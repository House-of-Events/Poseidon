import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Config from '../config/index.js';
import Knex from 'knex';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database connection
const db = Knex({
    client: 'postgresql',
    connection: {
        host: Config.DB_HOST,
        user: Config.DB_USER,
        password: Config.DB_PASSWORD,
        database: Config.DB_NAME,
        port: Config.DB_PORT,
        ssl: {
            rejectUnauthorized: false,
        },
    }
});

async function runMigrations() {
    try {
        // Read and execute each migration file
        const migrationsDir = path.join(__dirname, '..', 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Ensure migrations run in order

        console.log('Running migrations...');
        
        for (const file of migrationFiles) {
            console.log(`Running migration: ${file}`);
            const migrationPath = path.join(migrationsDir, file);
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
            
            // Execute the migration
            await db.raw(migrationSQL);
            console.log(`Completed migration: ${file}`);
        }

        console.log('All migrations completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await db.destroy();
    }
}

// Run migrations
runMigrations(); 