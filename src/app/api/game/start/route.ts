import { NextResponse } from 'next/server';
import { db } from '@/db/client';

export const dynamic = 'force-dynamic';
import { sessions, sessionRounds } from '@/db/schema';
import { randomUUID } from 'crypto';
import locationsData from '@/data/locations.json';
import type { Location, RoundClue } from '@/types';

const locations = locationsData as Location[];

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

function getDailyLocations(): { locations: Location[]; date: string } {
  const date = getTodayString();
  const seed = parseInt(date.replace(/-/g, ''), 10);
  return { locations: seededShuffle(locations, seed).slice(0, 5), date };
}

export async function POST(): Promise<NextResponse> {
  try {
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

    return NextResponse.json({ sessionId, clues, date });
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { error: 'Failed to start game. Please try again.' },
      { status: 500 }
    );
  }
}
