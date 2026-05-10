import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';

export const dynamic = 'force-dynamic';
import { leaderboardEntries, sessionRounds, sessions } from '@/db/schema';
import { desc, eq, and, isNotNull } from 'drizzle-orm';
import { z } from 'zod';

const SubmitSchema = z.object({
  playerName: z.string().min(1).max(32).trim(),
  sessionId: z.string().uuid(),
  // totalScore and roundScores are ignored from client — server recomputes them
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

    const { playerName, sessionId } = parsed.data;

    // Check session exists and is completed
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .get();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!session.completedAt) {
      return NextResponse.json(
        { error: 'Game session is not yet complete' },
        { status: 400 }
      );
    }

    // Check for duplicate leaderboard entry
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

    // Fetch and verify scores from database — never trust client-submitted scores
    const dbRounds = await db
      .select()
      .from(sessionRounds)
      .where(
        and(
          eq(sessionRounds.sessionId, sessionId),
          isNotNull(sessionRounds.score)
        )
      )
      .all();

    if (dbRounds.length !== 5) {
      return NextResponse.json(
        { error: 'Game session is not complete (missing round scores)' },
        { status: 400 }
      );
    }

    const sortedRounds = [...dbRounds].sort((a, b) => a.roundIndex - b.roundIndex);
    const verifiedRoundScores = sortedRounds.map((r) => r.score as number);
    const verifiedTotalScore = verifiedRoundScores.reduce((sum, s) => sum + s, 0);

    await db.insert(leaderboardEntries).values({
      playerName,
      totalScore: verifiedTotalScore,
      roundScores: JSON.stringify(verifiedRoundScores),
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
