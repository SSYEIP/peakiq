import { migrate } from 'drizzle-orm/libsql/migrator';
import { getDb } from './client';
import path from 'path';

async function runMigrations() {
  console.log('Running migrations...');
  const db = getDb();
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'src/db/migrations') });
  console.log('Migrations complete!');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
