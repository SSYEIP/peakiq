/**
 * One-off script: clears the leaderboard_entries table in Turso.
 * Run after scoring changes that make old scores incomparable.
 * Uses @libsql/client/web (HTTP-based, works on Windows ARM64).
 *
 * Usage: node scripts/reset-leaderboard.mjs
 */

import { createClient } from '@libsql/client/web';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN env vars.');
  console.error('Run: vercel env pull .env.local first, or set them manually.');
  process.exit(1);
}

const client = createClient({ url, authToken });

const result = await client.execute('DELETE FROM leaderboard_entries');
console.log(`✅ Leaderboard cleared — ${result.rowsAffected} rows deleted.`);
