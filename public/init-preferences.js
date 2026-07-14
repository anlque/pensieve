(async () => {
  const wallpapers = new Set([
    'forest',
    'moon',
    'deep',
    'embers',
    'office',
    'library',
    'quidditch',
    'custom',
  ]);
  const keys = {
    wallpaper: 'pensieve.wallpaper.v1',
    customWallpaper: 'pensieve.customWallpaper.v1',
    language: 'pensieve.language.v1',
  };

  const getStoredPreferences = async () => {
    if (globalThis.chrome?.runtime?.id && globalThis.chrome?.storage?.local) {
      return globalThis.chrome.storage.local.get(Object.values(keys));
    }

    return {
      [keys.wallpaper]: window.localStorage.getItem(keys.wallpaper),
      [keys.customWallpaper]: window.localStorage.getItem(keys.customWallpaper),
      [keys.language]: window.localStorage.getItem(keys.language),
    };
  };

  try {
    const preferences = await getStoredPreferences();
    const savedWallpaper = preferences[keys.wallpaper];
    const savedCustomWallpaper = preferences[keys.customWallpaper];
    const savedLanguage = preferences[keys.language];
    const wallpaper = wallpapers.has(savedWallpaper) ? savedWallpaper : 'forest';
    document.documentElement.lang = savedLanguage === 'en' ? 'en' : 'ru';
    document.documentElement.dataset.wallpaper = wallpaper === 'custom' && !savedCustomWallpaper ? 'forest' : wallpaper;

    if (typeof savedCustomWallpaper === 'string' && savedCustomWallpaper) {
      document.documentElement.style.setProperty('--initial-custom-wallpaper-image', `url("${savedCustomWallpaper}")`);
    }
  } catch {
    document.documentElement.dataset.wallpaper = 'forest';
  }
})();
