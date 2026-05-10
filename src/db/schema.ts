import { bigint, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull().default(sql`(extract(epoch from now()) * 1000)::bigint`),
  completedAt: bigint('completed_at', { mode: 'number' }),
});

export const sessionRounds = pgTable('session_rounds', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  roundIndex: integer('round_index').notNull(),
  locationId: text('location_id').notNull(),
  guess: integer('guess'),
  score: integer('score'),
  submittedAt: bigint('submitted_at', { mode: 'number' }),
});

export const leaderboardEntries = pgTable('leaderboard_entries', {
  id: serial('id').primaryKey(),
  playerName: text('player_name').notNull(),
  totalScore: integer('total_score').notNull(),
  roundScores: text('round_scores').notNull(),
  sessionId: text('session_id').notNull().unique(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull().default(sql`(extract(epoch from now()) * 1000)::bigint`),
});
