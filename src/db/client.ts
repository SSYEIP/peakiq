import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
}

function getAuthToken(): string | undefined {
  return process.env.DATABASE_AUTH_TOKEN;
}

const client = createClient({
  url: getDatabaseUrl(),
  authToken: getAuthToken(),
});

export const db = drizzle(client, { schema });
export { client };
