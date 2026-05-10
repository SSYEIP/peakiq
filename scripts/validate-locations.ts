import * as fs from 'fs';
import * as path from 'path';
import { LocationsArraySchema } from '../src/lib/locationSchema';

const locationsPath = path.join(__dirname, '../src/data/locations.json');
const rawData: unknown = JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));

const result = LocationsArraySchema.safeParse(rawData);
if (!result.success) {
  console.error('❌ Locations validation failed:');
  console.error(result.error.format());
  process.exit(1);
}

const locations = result.data;
console.log(`✅ Validated ${locations.length} locations`);

// Check diversity
const continents = new Set(locations.map((l) => l.continent));
console.log(`🌍 Continents covered: ${Array.from(continents).join(', ')}`);

const belowSea = locations.filter((l) => l.elevation < 0);
console.log(`🌊 Below sea level: ${belowSea.length}`);

const alpine = locations.filter((l) => l.elevation > 3000);
console.log(`🏔️ Alpine (>3000m): ${alpine.length}`);

const extreme = locations.filter((l) => l.elevation > 4000);
console.log(`⛰️ Extreme (>4000m): ${extreme.length}`);

console.log(`\n✅ All checks passed!`);
