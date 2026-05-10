import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './client';
import path from 'path';

async function runMigrations() {
  console.log('Running migrations...');
  migrate(db, { migrationsFolder: path.join(process.cwd(), 'src/db/migrations') });
  console.log('Migrations complete!');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
