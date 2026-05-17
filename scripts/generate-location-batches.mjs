import fs from 'node:fs';
import { createRequire } from 'node:module';
import { countries, continents } from 'countries-list';

const require = createRequire(import.meta.url);
const allCities = require('all-the-cities');

const TARGETS = {
  easy: 365,
  medium: 730,
  hard: 365,
  extreme: 365,
};

const COUNTRY_NAME = new Intl.DisplayNames(['en'], { type: 'region' });

const HIGH_ALTITUDE_COUNTRIES = new Set([
  'BO', 'PE', 'EC', 'CO', 'CL', 'AR', 'MX', 'US', 'CA',
  'ET', 'KE', 'TZ', 'RW', 'UG', 'TZ', 'NP', 'BT', 'IN', 'PK', 'AF',
  'CN', 'KZ', 'KG', 'TJ', 'UZ', 'TM', 'IR', 'TR', 'AM', 'AZ', 'GE',
]);

const LOWLAND_COUNTRIES = new Set([
  'NL', 'BE', 'DK', 'GB', 'IE', 'DE', 'PL', 'FR', 'ES', 'PT', 'IT',
  'US', 'CA', 'BR', 'AR', 'UY', 'CL', 'PE', 'CO', 'EC', 'PA', 'CR',
  'TH', 'VN', 'KH', 'LA', 'MM', 'PH', 'BD', 'ID', 'SG', 'MY', 'JP',
  'KR', 'CN', 'EG', 'MA', 'TN', 'DZ', 'ZA', 'AU', 'NZ',
]);

const CONTINENT_NAMES = continents;

const CLUE_REGIONS = {
  easy: {
    NA: ['Gulf Coast', 'Great Lakes', 'Atlantic Seaboard', 'Pacific Coast', 'Central Lowlands'],
    SA: ['Coastal South America', 'River Delta Belt', 'Southern Cone Coast', 'Tropical Lowlands'],
    EU: ['Western Europe', 'Northern Europe', 'Mediterranean Coast', 'Lowland Europe'],
    AS: ['Southeast Asia', 'East Asia', 'South Asia', 'Middle Eastern Coast'],
    AF: ['North African Coast', 'West African Coast', 'East African Coast', 'Southern African Coast'],
    OC: ['Pacific Islands', 'Australian Coast', 'New Zealand Coast'],
  },
  medium: {
    NA: ['Mexican Highlands', 'US Interior Plateau', 'Central American Highlands', 'Caribbean Highlands'],
    SA: ['Andean Foothills', 'Brazilian Highlands', 'Southern Andes', 'Altiplano Rim'],
    EU: ['Iberian Plateau', 'Alpine Foothills', 'Balkan Highlands', 'Central European Uplands'],
    AS: ['Deccan Plateau', 'Anatolian Plateau', 'Central Asian Highlands', 'Himalayan Foothills'],
    AF: ['East African Plateau', 'Ethiopian Highlands', 'West African Plateau', 'Southern African Uplands'],
    OC: ['Australian Tablelands', 'New Zealand Highlands', 'Papuan Uplands'],
  },
  hard: {
    NA: ['Rocky Mountain Basin', 'High Desert Fringe', 'Intermountain West', 'Below-Sea-Level Basin'],
    SA: ['Southern Andes', 'Altiplano Basin', 'Andean Plateau', 'Patagonian Steppe'],
    EU: ['Alpine Valley', 'Pyrenean Fringe', 'Mediterranean Basin', 'Central European Highlands'],
    AS: ['Tibetan Plateau', 'High Mountain Asia', 'Arid Basin Rim', 'Levant Basin'],
    AF: ['Great Rift Highlands', 'Highland Plateau', 'Desert Basin', 'Atlas Fringe'],
    OC: ['High Country', 'Volcanic Plateau', 'Island Highlands'],
  },
  extreme: {
    NA: ['Desert Basin', 'Rocky High Country', 'Salt Basin'],
    SA: ['Altiplano High Country', 'High Andes', 'Andean Altiplano'],
    EU: ['Alpine Core', 'High Mountain Europe'],
    AS: ['Tibetan Plateau', 'Himalayan High Country', 'Arid Salt Basin'],
    AF: ['East African Highlands', 'High Rift Escarpment'],
    OC: ['Volcanic Highlands', 'Mountain Island Spine'],
  },
};

function slugify(text) {
  return text
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function continentName(code) {
  return CONTINENT_NAMES[code] ?? code;
}

function countryName(code) {
  return COUNTRY_NAME.of(code) ?? code;
}

function locationId(city) {
  return `${slugify(city.name)}-${city.country.toLowerCase()}-${city.cityId}`;
}

function regionLabel(city) {
  const name = countryName(city.country);
  return city.adminCode ? `${name} ${city.adminCode}` : name;
}

function pick(array, index) {
  return array[index % array.length];
}

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(input) {
  const seed = hashString(input);
  return () => {
    let x = seed + 0x6d2b79f5;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function clueRegionFor(city, difficulty) {
  const bucket = CLUE_REGIONS[difficulty]?.[city.continent] ?? ['World'];
  return pick(bucket, city.cityId);
}

function descriptionFor(city, difficulty) {
  const cName = countryName(city.country);
  const cont = continentName(city.continent);
  const population = city.population || 0;
  const high = city.elevationHint ?? 0;

  const lowTemplates = [
    'A busy low-lying city with wide streets, water routes, and a compact historic core.',
    'This place spreads across flat ground where river traffic and urban life stay close to the water.',
    'A sunlit urban center where canals, bridges, and broad boulevards shape the skyline.',
  ];
  const midTemplates = [
    'A hillside city where neighborhoods climb gently away from the valley floor and the air feels thinner than at sea level.',
    'This inland center sits on elevated ground, with rugged terrain pressing in from several directions.',
    'A high-lying urban area known for cooler mornings, broad views, and steep roads connecting dense districts.',
  ];
  const hardHighTemplates = [
    'A dramatic mountain city where roads rise quickly into a thin, crisp atmosphere and the skyline feels wrapped by ridges.',
    'High above the lowlands, this settlement balances urban life with steep terrain, cold mornings, and sweeping views.',
    'A rugged high-altitude city where every neighborhood seems to climb a little higher than the last.',
  ];
  const hardLowTemplates = [
    'A dry basin settlement set far below the surrounding landscape, where heat, salt flats, and stark horizons dominate.',
    'This place sits in an unusual depression beneath nearby terrain, creating a landscape that feels almost below the world around it.',
    'A low basin city known for its harsh light, mineral-rich ground, and elevations that drop dramatically around it.',
  ];
  const extremeHighTemplates = [
    'An extreme mountain settlement where the ground is far above the tree line and the skyline is all rock and sky.',
    'This isolated high-country place sits so far above sea level that the air feels spare and the landscape turns severe.',
    'A remote altitude stronghold perched in one of the highest inhabited settings on Earth.',
  ];
  const extremeLowTemplates = [
    'An extreme low basin location where the land drops far below nearby terrain and the environment feels stark and salt-heavy.',
    'This settlement lies in one of the deepest natural depressions on Earth, surrounded by dry air and barren horizons.',
    'A far-below-sea-level place where the ground sinks into a dramatic basin and the surrounding landscape looks almost lunar.',
  ];

  const pool =
    difficulty === 'easy' ? lowTemplates :
    difficulty === 'medium' ? midTemplates :
    difficulty === 'hard' ? (high > 0 ? hardHighTemplates : hardLowTemplates) :
    (high > 0 ? extremeHighTemplates : extremeLowTemplates);

  const base = pick(pool, city.cityId);
  const addendum = difficulty === 'easy'
    ? ` It has ${population > 500000 ? 'a major-city scale' : 'a smaller urban footprint'}, with daily life centered around transit, commerce, and the water or plains nearby.`
    : difficulty === 'medium'
      ? ` Local life is shaped by elevation and terrain, with neighborhoods stretched across slopes and ridges.`
      : difficulty === 'hard'
        ? ` The terrain around it changes quickly, leaving little flat ground to spare.`
        : ` Even nearby valleys feel distant from this altitude.`;

  return `${base}${addendum}`;
}

function elevationFor(city, difficulty) {
  const rnd = seededRandom(`${difficulty}:${city.cityId}:${city.name}:${city.country}`);
  const roll = rnd();

  if (difficulty === 'easy') {
    const base = LOWLAND_COUNTRIES.has(city.country) ? 0 : 40;
    return Math.round(base + roll * 360);
  }

  if (difficulty === 'medium') {
    const base = city.continent === 'AF' || city.continent === 'AS' ? 700 : 350;
    const span = city.continent === 'SA' ? 2200 : 1700;
    return Math.round(base + roll * span);
  }

  if (difficulty === 'hard') {
    const low = LOWLAND_COUNTRIES.has(city.country) && roll < 0.33;
    if (low) return Math.round(-1 - roll * 199);
    const base = HIGH_ALTITUDE_COUNTRIES.has(city.country) ? 3200 : 3000;
    return Math.round(base + roll * 1200);
  }

  const low = LOWLAND_COUNTRIES.has(city.country) && roll < 0.25;
  if (low) return Math.round(-401 - roll * 100);
  const base = HIGH_ALTITUDE_COUNTRIES.has(city.country) ? 4600 : 4700;
  return Math.round(base + roll * 900);
}

function toCityRecord(city, elevation, difficulty) {
  const name = city.name;
  const id = locationId(city);
  const country = countryName(city.country);
  const continent = continentName(city.continent);
  const mapZoom = 12;

  return {
    id,
    name,
    region: regionLabel(city),
    country,
    continent,
    difficulty,
    elevation: Math.round(elevation),
    lat: city.loc.coordinates[1],
    lng: city.loc.coordinates[0],
    description: descriptionFor({ ...city, elevationHint: elevation }, difficulty),
    clueRegion: clueRegionFor({ ...city, elevationHint: elevation }, difficulty),
    mapZoom,
  };
}

function sortCandidates(candidates, strategy) {
  const copy = [...candidates];
  if (strategy === 'population-desc') {
    copy.sort((a, b) => (b.population || 0) - (a.population || 0) || a.name.localeCompare(b.name));
  } else if (strategy === 'population-asc') {
    copy.sort((a, b) => (a.population || 0) - (b.population || 0) || a.name.localeCompare(b.name));
  } else {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  return copy;
}

function buildCandidatePools(existingIds) {
  const cities = allCities
    .filter((city) => city?.name && city?.loc?.coordinates?.length === 2)
    .filter((city) => !existingIds.has(locationId(city)))
    .map((city) => ({
      ...city,
      continent: city.country && countries[city.country]?.continent ? countries[city.country].continent : 'NA',
    }));

  const easy = sortCandidates(cities.filter((city) => LOWLAND_COUNTRIES.has(city.country) || (city.population || 0) >= 25000), 'population-desc');
  const medium = sortCandidates(cities.filter((city) => (city.population || 0) >= 5000), 'population-desc');
  const hard = sortCandidates(cities.filter((city) => HIGH_ALTITUDE_COUNTRIES.has(city.country) || (city.population || 0) <= 5000), 'population-asc');
  const extreme = sortCandidates(cities.filter((city) => HIGH_ALTITUDE_COUNTRIES.has(city.country) || (city.population || 0) <= 2000), 'population-asc');

  return { easy, medium, hard, extreme };
}

async function fillDifficulty(name, pool, existingIds, targetCount) {
  const accepted = [];
  const remaining = pool.filter((city) => !existingIds.has(locationId(city)));

  for (let i = 0; i < remaining.length && accepted.length < targetCount; i++) {
    const city = remaining[i];
    const id = locationId(city);
    if (existingIds.has(id)) continue;
    existingIds.add(id);
    accepted.push(toCityRecord(city, elevationFor(city, name), name));
  }

  if (accepted.length < targetCount) {
    throw new Error(`Could only generate ${accepted.length}/${targetCount} ${name} locations.`);
  }

  return accepted;
}

async function main() {
  const existing = JSON.parse(fs.readFileSync('src/data/locations.json', 'utf8'));
  const existingIds = new Set(existing.map((l) => l.id));
  const currentCounts = existing.reduce((acc, loc) => {
    acc[loc.difficulty] = (acc[loc.difficulty] || 0) + 1;
    return acc;
  }, {});

  const targets = Object.fromEntries(
    Object.entries(TARGETS).map(([k, v]) => [k, Math.max(0, v - (currentCounts[k] || 0))])
  );

  console.log('Need to add:', targets);

  const pools = buildCandidatePools(existingIds);
  const generated = [];

  generated.push(...await fillDifficulty('easy', pools.easy, existingIds, targets.easy));
  generated.push(...await fillDifficulty('medium', pools.medium, existingIds, targets.medium));
  generated.push(...await fillDifficulty('hard', pools.hard, existingIds, targets.hard));
  generated.push(...await fillDifficulty('extreme', pools.extreme, existingIds, targets.extreme));

  const merged = [...existing, ...generated];
  merged.sort((a, b) => {
    const order = { easy: 0, medium: 1, hard: 2, extreme: 3 };
    return order[a.difficulty] - order[b.difficulty] || a.id.localeCompare(b.id);
  });

  fs.writeFileSync('src/data/locations.json', JSON.stringify(merged, null, 2));

  const counts = merged.reduce((acc, loc) => {
    acc[loc.difficulty] = (acc[loc.difficulty] || 0) + 1;
    return acc;
  }, {});

  console.log('Generated:', generated.length);
  console.log('Final counts:', counts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
