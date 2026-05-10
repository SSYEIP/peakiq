import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { leaderboardEntries } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

const SubmitSchema = z.object({
  playerName: z.string().min(1).max(32).trim(),
  totalScore: z.number().int().min(0).max(5000),
  roundScores: z.array(z.number().int().min(0).max(1000)).length(5),
  sessionId: z.string().uuid(),
});

export async function GET(): Promise<NextResponse> {
  try {
    const entries = await db
      .select()
      .from(leaderboardEntries)
      .orderBy(desc(leaderboardEntries.totalScore))
      .limit(100);

    return NextResponse.json(entries, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

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

    const { playerName, totalScore, roundScores, sessionId } = parsed.data;

    // Check for duplicate session
    const existing = await db
      .select()
      .from(leaderboardEntries)
      .where(eq(leaderboardEntries.sessionId, sessionId))
      .get();

    if (existing) {
      return NextResponse.json(
        { error: 'Score already submitted for this session' },
        { status: 409 }
      );
    }

    await db.insert(leaderboardEntries).values({
      playerName,
      totalScore,
      roundScores: JSON.stringify(roundScores),
      sessionId,
    });

    const entry = await db
      .select()
      .from(leaderboardEntries)
      .where(eq(leaderboardEntries.sessionId, sessionId))
      .get();

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error submitting leaderboard entry:', error);
    return NextResponse.json(
      { error: 'Failed to submit score' },
      { status: 500 }
    );
  }
}
