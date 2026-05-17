import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';

export const dynamic = 'force-dynamic';
import { sessions, sessionRounds } from '@/db/schema';
import { randomUUID } from 'crypto';
import locationsData from '@/data/locations.json';
import type { GameMode, Location, RoundClue } from '@/types';
import { z } from 'zod';

const locations = locationsData as Location[];

const COASTAL_CITY_IDS = new Set([
  'new-york', 'tokyo', 'sydney', 'miami', 'lagos', 'vancouver', 'mumbai',
  'cape-town', 'auckland', 'havana', 'oslo', 'helsinki', 'buenos-aires',
  'los-angeles', 'houston', 'new-orleans', 'boston', 'chicago', 'toronto',
  'lima', 'santiago-chile', 'rio-de-janeiro', 'caracas', 'bangkok', 'taipei',
  'manila', 'dhaka', 'colombo', 'karachi', 'jakarta', 'ho-chi-minh-city',
  'casablanca', 'tunis', 'accra', 'dar-es-salaam', 'mombasa', 'alexandria',
  'melbourne', 'brisbane', 'perth', 'adelaide', 'barcelona', 'lisbon',
  'dublin', 'hamburg', 'rotterdam', 'marseille', 'amsterdam',
]);

const LAUNCH_DATE = new Date('2025-01-01T00:00:00Z');

const StartSchema = z.object({
  mode: z.enum(['normal', 'hard']).optional(),
});

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayIndex(): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((today.getTime() - LAUNCH_DATE.getTime()) / msPerDay);
}

function isCoastalCity(loc: Location): boolean {
  return COASTAL_CITY_IDS.has(loc.id);
}

/**
 * Index-based pool cycling — guarantees no repeats within each difficulty pool.
 * Sorts each pool alphabetically by id (consistent across deploys).
 * Uses dayIndex to pick deterministically.
 */
function getDailyLocations(): { locations: Location[]; date: string } {
  const date = getTodayString();
  const dayIndex = getDayIndex();

  const pools: Record<string, Location[]> = { easy: [], medium: [], hard: [], extreme: [] };
  for (const loc of locations) {
    pools[loc.difficulty]?.push(loc);
  }
  // Sort each pool alphabetically for consistency
  for (const pool of Object.values(pools)) {
    pool.sort((a, b) => a.id.localeCompare(b.id));
  }

  const pick = (diff: string, offset: number): Location => {
    const pool = pools[diff] ?? [];
    if (pool.length === 0) throw new Error(`No locations for difficulty: ${diff}`);
    return pool[((offset % pool.length) + pool.length) % pool.length] as Location;
  };

  // Pick one per slot: [easy, medium, medium, hard, extreme]
  const selected = [
    pick('easy',    dayIndex),
    pick('medium',  2 * dayIndex),
    pick('medium',  2 * dayIndex + 1),
    pick('hard',    dayIndex),
    pick('extreme', dayIndex),
  ];

  // Coastal city rule: max 2 coastal per day
  // If more than 2, swap extras with next non-coastal in same pool
  let coastalCount = selected.filter(isCoastalCity).length;
  if (coastalCount > 2) {
    for (let i = 0; i < selected.length && coastalCount > 2; i++) {
      if (!isCoastalCity(selected[i]!)) continue;
      const diff = selected[i]!.difficulty;
      const pool = pools[diff] ?? [];
      const usedIds = new Set(selected.map((l) => l.id));
      // Find next non-coastal in same pool not already selected
      const replacement = pool.find((l) => !isCoastalCity(l) && !usedIds.has(l.id));
      if (replacement) {
        selected[i] = replacement;
        coastalCount--;
      }
    }
  }

  return { locations: selected, date };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.text();
    let body: unknown = {};
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }
    }
    const parsed = StartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const mode: GameMode = parsed.data.mode ?? 'normal';
    const { locations: selectedLocations, date } = getDailyLocations();
    const sessionId = randomUUID();
    const db = getDb();

    await db.insert(sessions).values({ id: sessionId });

    await db.insert(sessionRounds).values(
      selectedLocations.map((loc, index) => ({
        sessionId,
        roundIndex: index,
        locationId: loc.id,
      }))
    );

    const clues: RoundClue[] = selectedLocations.map((loc, index) => ({
      roundIndex: index,
      locationId: loc.id,
      name: loc.name,
      clueRegion: loc.clueRegion,
      country: loc.country,
      continent: loc.continent,
      difficulty: loc.difficulty,
      description: loc.description,
      lat: loc.lat,
      lng: loc.lng,
      mapZoom: loc.mapZoom,
    }));

    return NextResponse.json({ sessionId, clues, date, mode });
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { error: 'Failed to start game. Please try again.' },
      { status: 500 }
    );
  }
}
