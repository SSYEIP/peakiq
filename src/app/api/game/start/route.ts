import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sessions, sessionRounds } from '@/db/schema';
import { randomUUID } from 'crypto';
import locationsData from '@/data/locations.json';
import type { Location, RoundClue } from '@/types';

const locations = locationsData as Location[];

function selectRandomLocations(count: number): Location[] {
  const shuffled = [...locations].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function POST(): Promise<NextResponse> {
  try {
    const sessionId = randomUUID();
    const selectedLocations = selectRandomLocations(5);

    // Create session
    await db.insert(sessions).values({
      id: sessionId,
    });

    // Create rounds
    await db.insert(sessionRounds).values(
      selectedLocations.map((loc, index) => ({
        sessionId,
        roundIndex: index,
        locationId: loc.id,
      }))
    );

    // Return sanitized clues (NO elevation, NO name)
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

    return NextResponse.json({ sessionId, clues });
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { error: 'Failed to start game. Please try again.' },
      { status: 500 }
    );
  }
}
