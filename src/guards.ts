import {
  LANGUAGE_NAMES,
  WALLPAPER_NAMES,
  type LanguageName,
  type WallpaperName,
} from './config';

export const isWallpaperName = (value: string | null): value is WallpaperName =>
  Boolean(value && WALLPAPER_NAMES.includes(value as WallpaperName));

export const isLanguageName = (value: string | null): value is LanguageName =>
  Boolean(value && LANGUAGE_NAMES.includes(value as LanguageName));
