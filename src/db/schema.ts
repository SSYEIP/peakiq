import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
  completedAt: integer('completed_at'),
});

export const sessionRounds = sqliteTable('session_rounds', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  roundIndex: integer('round_index').notNull(),
  locationId: text('location_id').notNull(),
  guess: integer('guess'),
  score: integer('score'),
  submittedAt: integer('submitted_at'),
});

export const leaderboardEntries = sqliteTable('leaderboard_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playerName: text('player_name').notNull(),
  totalScore: integer('total_score').notNull(),
  roundScores: text('round_scores').notNull(),
  sessionId: text('session_id').notNull().unique(),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
});
