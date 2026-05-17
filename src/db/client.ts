import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql/web';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (db) return db;

  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;

  if (!url) {
    throw new Error('Missing TURSO_DATABASE_URL');
  }

  db = drizzle(createClient({ url, authToken }), { schema });
  return db;
}
