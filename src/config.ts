export const RELEASE_DURATION_MS = 2400;
export const CLEAR_THOUGHTS_DURATION_MS = 1980;
export const THREAD_CLEAR_DURATION_MS = 380;
export const THOUGHT_SURFACE_DURATION_MS = 1700;
export const MAX_STORED_THOUGHTS = 60;
export const MAX_THOUGHT_LENGTH = 80;

export const STORAGE_KEYS = {
  thoughts: 'pensieve.thoughts.v1',
  wallpaper: 'pensieve.wallpaper.v1',
  customWallpaper: 'pensieve.customWallpaper.v1',
  language: 'pensieve.language.v1',
} as const;

export const WALLPAPER_NAMES = [
  'forest',
  'moon',
  'deep',
  'embers',
  'office',
  'library',
  'quidditch',
  'custom',
] as const;

export const LANGUAGE_NAMES = ['ru', 'en'] as const;

export type WallpaperName = (typeof WALLPAPER_NAMES)[number];
export type LanguageName = (typeof LANGUAGE_NAMES)[number];

export const THOUGHT_POSITIONS = [
  { x: 50, y: 50 },
  { x: 27, y: 45 },
  { x: 72, y: 44 },
  { x: 38, y: 66 },
  { x: 65, y: 66 },
  { x: 18, y: 58 },
  { x: 82, y: 56 },
  { x: 48, y: 74 },
  { x: 31, y: 72 },
] as const;

export const MIXING_ORBITS = [
  { radiusX: 244, radiusY: 74, speed: 1 },
  { radiusX: 206, radiusY: 92, speed: 0.94 },
  { radiusX: 270, radiusY: 62, speed: 1.07 },
  { radiusX: 178, radiusY: 104, speed: 0.9 },
  { radiusX: 232, radiusY: 86, speed: 1.12 },
  { radiusX: 154, radiusY: 68, speed: 0.86 },
  { radiusX: 260, radiusY: 82, speed: 0.98 },
  { radiusX: 198, radiusY: 58, speed: 1.16 },
  { radiusX: 224, radiusY: 100, speed: 0.92 },
  { radiusX: 136, radiusY: 50, speed: 1.04 },
  { radiusX: 188, radiusY: 78, speed: 1.1 },
  { radiusX: 248, radiusY: 96, speed: 0.88 },
] as const;
