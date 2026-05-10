import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';

export const dynamic = 'force-dynamic';
import { sessions, sessionRounds } from '@/db/schema';
import { eq, and, isNull, isNotNull, sql } from 'drizzle-orm';
import { calculateScore, getDifficultyMultiplier, getMaxRoundScore } from '@/lib/scoring';
import locationsData from '@/data/locations.json';
import type { Location, RoundResult } from '@/types';
import { z } from 'zod';
import { MIN_ELEVATION, MAX_ELEVATION } from '@/lib/constants';

const locations = locationsData as Location[];

const SubmitSchema = z.object({
  sessionId: z.string().uuid(),
  roundIndex: z.number().int().min(0).max(4),
  guess: z.number().int().min(MIN_ELEVATION).max(MAX_ELEVATION),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = SubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { sessionId, roundIndex, guess } = parsed.data;

    // Verify session exists
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get the round to find the locationId
    const [round] = await db
      .select()
      .from(sessionRounds)
      .where(
        and(
          eq(sessionRounds.sessionId, sessionId),
          eq(sessionRounds.roundIndex, roundIndex)
        )
      );

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    // Find the location (must happen before update to calculate score)
    const location = locations.find((l) => l.id === round.locationId);
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 500 });
    }

    const baseScore = calculateScore(location.elevation, guess);
    const multiplier = getDifficultyMultiplier(location.difficulty);
    const score = Math.round(baseScore * multiplier);
    const maxScore = getMaxRoundScore(location.difficulty);
    const now = Date.now();

    // Atomic conditional UPDATE — only updates if guess IS NULL (prevents double-submission)
    const updateResult = await db
      .update(sessionRounds)
      .set({
        guess,
        score,
        submittedAt: now,
      })
      .where(
        and(
          eq(sessionRounds.id, round.id),
          isNull(sessionRounds.guess)
        )
      );

    if ((updateResult.rowsAffected ?? 0) === 0) {
      return NextResponse.json(
        { error: 'Round already submitted' },
        { status: 409 }
      );
    }

    // Check if ALL 5 rounds are now submitted (server-side, not based on client roundIndex)
    const [submittedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sessionRounds)
      .where(
        and(
          eq(sessionRounds.sessionId, sessionId),
          isNotNull(sessionRounds.guess)
        )
      );

    if (Number(submittedCount?.count) === 5) {
      await db.update(sessions)
        .set({ completedAt: now })
        .where(eq(sessions.id, sessionId));
    }

    const result: RoundResult = {
      roundIndex,
      locationId: location.id,
      locationName: location.name,
      actualElevation: location.elevation,
      guess,
      delta: location.elevation - guess,
      score,
      multiplier,
      maxScore,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error submitting guess:', error);
    return NextResponse.json(
      { error: 'Failed to submit guess. Please try again.' },
      { status: 500 }
    );
  }
}
