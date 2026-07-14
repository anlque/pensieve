(() => {
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

  try {
    const savedWallpaper = window.localStorage.getItem('pensieve.wallpaper.v1');
    const savedCustomWallpaper = window.localStorage.getItem('pensieve.customWallpaper.v1');
    const savedLanguage = window.localStorage.getItem('pensieve.language.v1');
    const wallpaper = wallpapers.has(savedWallpaper) ? savedWallpaper : 'forest';
    document.documentElement.lang = savedLanguage === 'en' ? 'en' : 'ru';
    document.documentElement.dataset.wallpaper = wallpaper === 'custom' && !savedCustomWallpaper ? 'forest' : wallpaper;

    if (savedCustomWallpaper) {
      document.documentElement.style.setProperty('--initial-custom-wallpaper-image', `url("${savedCustomWallpaper}")`);
    }
  } catch {
    document.documentElement.dataset.wallpaper = 'forest';
  }
})();
