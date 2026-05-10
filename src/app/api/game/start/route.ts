import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';

export const dynamic = 'force-dynamic';
import { sessions, sessionRounds } from '@/db/schema';
import { randomUUID } from 'crypto';
import locationsData from '@/data/locations.json';
import type { GameMode, Location, RoundClue } from '@/types';
import { z } from 'zod';

const locations = locationsData as Location[];
const DIFFICULTY_SEQUENCE: Location['difficulty'][] = ['easy', 'medium', 'medium', 'hard', 'extreme'];
const COASTAL_CITY_IDS = new Set([
  'new-york',
  'tokyo',
  'sydney',
  'miami',
  'lagos',
  'vancouver',
  'mumbai',
  'cape-town',
  'auckland',
  'havana',
  'oslo',
  'helsinki',
  'buenos-aires',
]);

const StartSchema = z.object({
  mode: z.enum(['normal', 'hard']).optional(),
});

/** Returns today's date string in local server time: "2026-05-10" */
function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Simple LCG seeded shuffle — same seed always produces same order */
function seededShuffle(arr: Location[], seed: number): Location[] {
  const shuffled = [...arr];
  let s = seed >>> 0;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j] as Location, shuffled[i] as Location];
  }
  return shuffled;
}

function isCoastalCity(loc: Location): boolean {
  return COASTAL_CITY_IDS.has(loc.id);
}

function pickLocation(
  pool: Location[],
  used: Set<string>,
  predicate: (loc: Location) => boolean
): Location | undefined {
  const picked = pool.find((loc) => !used.has(loc.id) && predicate(loc));
  if (!picked) return undefined;
  used.add(picked.id);
  return picked;
}

function getDailyLocations(): { locations: Location[]; date: string } {
  const date = getTodayString();
  const seed = parseInt(date.replace(/-/g, ''), 10);
  const shuffled = seededShuffle(locations, seed);
  const used = new Set<string>();
  const selected: Location[] = [];

  for (let i = 0; i < DIFFICULTY_SEQUENCE.length; i++) {
    const targetDifficulty = DIFFICULTY_SEQUENCE[i];
    const isCoastalSlot = i < 2;

    const exactTarget = pickLocation(
      shuffled,
      used,
      (loc) => loc.difficulty === targetDifficulty && (isCoastalSlot ? isCoastalCity(loc) : !isCoastalCity(loc))
    );

    const fallbackTarget = exactTarget ?? pickLocation(
      shuffled,
      used,
      (loc) => loc.difficulty === targetDifficulty
    );

    if (fallbackTarget) {
      selected.push(fallbackTarget);
      continue;
    }

    const anyBySlot = pickLocation(shuffled, used, (loc) => (isCoastalSlot ? isCoastalCity(loc) : !isCoastalCity(loc)))
      ?? pickLocation(shuffled, used, () => true);

    if (anyBySlot) selected.push(anyBySlot);
  }

  return { locations: selected.slice(0, 5), date };
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
