import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
const dbPath = dbUrl.replace(/^file:/, '');
const absolutePath = path.isAbsolute(dbPath)
  ? dbPath
  : path.join(process.cwd(), dbPath);

const sqlite = new Database(absolutePath);
export const db = drizzle(sqlite, { schema });
