import { z } from 'zod';

export const DifficultySchema = z.enum(['easy', 'medium', 'hard', 'extreme']);

export const LocationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  country: z.string().min(1),
  continent: z.string().min(1),
  difficulty: DifficultySchema,
  elevation: z.number().min(-500).max(9000),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  description: z.string().min(10),
  clueRegion: z.string().min(1),
  mapZoom: z.number().int().min(8).max(14),
});

export const LocationsArraySchema = z.array(LocationSchema).min(55);

export type LocationInput = z.infer<typeof LocationSchema>;
