import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sessions, sessionRounds } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { calculateScore } from '@/lib/scoring';
import locationsData from '@/data/locations.json';
import type { Location, RoundResult } from '@/types';
import { z } from 'zod';

const locations = locationsData as Location[];

const SubmitSchema = z.object({
  sessionId: z.string().uuid(),
  roundIndex: z.number().int().min(0).max(4),
  guess: z.number().int().min(-500).max(9000),
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
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .get();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get the round
    const round = await db
      .select()
      .from(sessionRounds)
      .where(
        and(
          eq(sessionRounds.sessionId, sessionId),
          eq(sessionRounds.roundIndex, roundIndex)
        )
      )
      .get();

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.guess !== null) {
      return NextResponse.json(
        { error: 'Round already submitted' },
        { status: 409 }
      );
    }

    // Find the location
    const location = locations.find((l) => l.id === round.locationId);
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 500 });
    }

    const score = calculateScore(location.elevation, guess);
    const now = Date.now();

    // Update the round
    await db
      .update(sessionRounds)
      .set({
        guess,
        score,
        submittedAt: now,
      })
      .where(eq(sessionRounds.id, round.id));

    // If last round, mark session complete
    if (roundIndex === 4) {
      await db
        .update(sessions)
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
