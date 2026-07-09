import './styles.css';

const stage = document.querySelector<HTMLElement>('.app-stage');
const wandButton = document.querySelector<HTMLButtonElement>('.wand-button');
const backButton = document.querySelector<HTMLButtonElement>('.back-button');
const letGoButton = document.querySelector<HTMLButtonElement>('.let-go-button');
const mixButton = document.querySelector<HTMLButtonElement>('.mix-button');
const mixCloseButton = document.querySelector<HTMLButtonElement>('.mix-close-button');
const infoButton = document.querySelector<HTMLButtonElement>('.info-button');
const infoDialog = document.querySelector<HTMLElement>('.info-dialog');
const infoCloseButton = document.querySelector<HTMLButtonElement>('.info-close-button');
const tuneButton = document.querySelector<HTMLButtonElement>('.tune-button');
const wallpaperMenu = document.querySelector<HTMLElement>('.wallpaper-menu');
const wallpaperOptions = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-wallpaper-option]'));
const wallpaperUploadInput = document.querySelector<HTMLInputElement>('.wallpaper-upload-input');
const languageOptions = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-language-option]'));
const thoughtForm = document.querySelector<HTMLFormElement>('.thought-form');
const thoughtInput = document.querySelector<HTMLInputElement>('.thought-input');
const thoughtModal = document.querySelector<HTMLElement>('.thought-modal');
const thoughtModalText = document.querySelector<HTMLElement>('.thought-modal-text');
const thoughtModalClose = document.querySelector<HTMLButtonElement>('.thought-modal-close');
const thoughtModalView = document.querySelector<HTMLElement>('.thought-modal-view');
const thoughtEditForm = document.querySelector<HTMLFormElement>('.thought-edit-form');
const thoughtEditInput = document.querySelector<HTMLInputElement>('.thought-edit-input');
const thoughtEditButton = document.querySelector<HTMLButtonElement>('.thought-edit-button');
const thoughtDeleteButton = document.querySelector<HTMLButtonElement>('.thought-delete-button');
const thoughtCancelButton = document.querySelector<HTMLButtonElement>('.thought-cancel-button');
const thoughtCloudText = document.querySelector<HTMLElement>('.thought-cloud-text');
const thoughtCloud = document.querySelector<HTMLElement>('.thought-cloud');
const thoughtStream = document.querySelector<HTMLElement>('.thought-stream');
const releaseTrail = document.querySelector<HTMLElement>('.release-trail');
const wandHand = document.querySelector<HTMLElement>('.wand-hand');
const wandLight = document.querySelector<HTMLElement>('.wand-light');
const pensieveThoughts = document.querySelector<HTMLElement>('.pensieve-thoughts');
const captureScreen = document.querySelector<HTMLElement>('[data-screen="capture"]');
const pensieveScene = document.querySelector<HTMLElement>('.pensieve-scene');
const releaseDurationMs = 3000;
const clearThoughtsDurationMs = 1980;
const storageKey = 'pensieve.thoughts.v1';
const wallpaperStorageKey = 'pensieve.wallpaper.v1';
const customWallpaperStorageKey = 'pensieve.customWallpaper.v1';
const languageStorageKey = 'pensieve.language.v1';
const wallpaperNames = ['forest', 'moon', 'deep', 'embers', 'office', 'library', 'quidditch', 'custom'] as const;
const languageNames = ['ru', 'en'] as const;

type WallpaperName = (typeof wallpaperNames)[number];
type LanguageName = (typeof languageNames)[number];

type TranslationKey =
  | 'app.title'
  | 'app.description'
  | 'info.button'
  | 'settings.button'
  | 'settings.wallpaper'
  | 'settings.language'
  | 'wallpaper.forest'
  | 'wallpaper.moon'
  | 'wallpaper.deep'
  | 'wallpaper.embers'
  | 'wallpaper.office'
  | 'wallpaper.library'
  | 'wallpaper.quidditch'
  | 'wallpaper.custom'
  | 'wallpaper.upload'
  | 'info.close'
  | 'info.title'
  | 'info.summary'
  | 'info.item.add'
  | 'info.item.mix'
  | 'info.item.edit'
  | 'info.item.wallpaper'
  | 'hero.title'
  | 'hero.subtitle'
  | 'back'
  | 'thought.label'
  | 'thought.placeholder'
  | 'thought.submit'
  | 'thought.preview'
  | 'letGo'
  | 'mix'
  | 'mix.close'
  | 'modal.label'
  | 'modal.close'
  | 'modal.actions'
  | 'modal.edit'
  | 'modal.delete'
  | 'modal.editLabel'
  | 'modal.save'
  | 'modal.cancel'
  | 'wand.button'
  | 'home.cta';

const translations: Record<LanguageName, Record<TranslationKey, string>> = {
  ru: {
    'app.title': 'Омут памяти',
    'app.description': 'Омут памяти — спокойное приложение для выгрузки мыслей, их перемешивания, редактирования и отпускания.',
    'info.button': 'Информация',
    'settings.button': 'Настройки фона',
    'settings.wallpaper': 'Обои',
    'settings.language': 'Язык',
    'wallpaper.forest': 'Лес',
    'wallpaper.moon': 'Луна',
    'wallpaper.deep': 'Глубина',
    'wallpaper.embers': 'Искры',
    'wallpaper.office': 'Кабинет',
    'wallpaper.library': 'Библиотека',
    'wallpaper.quidditch': 'Игровое поле',
    'wallpaper.custom': 'Своя картинка',
    'wallpaper.upload': 'Загрузить свою картинку для обоев',
    'info.close': 'Закрыть информацию',
    'info.title': 'Омут памяти',
    'info.summary': 'Место, куда можно выгрузить мысли, чтобы стало легче.',
    'info.item.add': 'Введи мысль и отпусти её в омут палочкой.',
    'info.item.mix': 'Перемешай омут, чтобы рассмотреть мысли ближе.',
    'info.item.edit': 'Открой мысль, измени её или удали.',
    'info.item.wallpaper': 'Смени обои через настройки справа.',
    'hero.title': 'Омут<br />памяти',
    'hero.subtitle': 'Твои мысли важны.<br />Выгрузи их. Отпусти.',
    back: 'Назад',
    'thought.label': 'Мысль',
    'thought.placeholder': 'Вытащи мысль...',
    'thought.submit': 'Поймать мысль',
    'thought.preview': 'Нужно позвонить маме',
    letGo: 'Отпустить мысли',
    mix: 'Перемешать',
    'mix.close': 'Закрыть омут',
    'modal.label': 'Мысль',
    'modal.close': 'Закрыть мысль',
    'modal.actions': 'Действия с мыслью',
    'modal.edit': 'Изменить',
    'modal.delete': 'Удалить',
    'modal.editLabel': 'Редактировать мысль',
    'modal.save': 'Сохранить',
    'modal.cancel': 'Отмена',
    'wand.button': 'Взять мысль палочкой',
    'home.cta': 'Коснись и начни<br />выгружать мысли',
  },
  en: {
    'app.title': 'Memory Bowl',
    'app.description': 'Memory Bowl is a calm app for unloading, mixing, editing, and releasing thoughts.',
    'info.button': 'Information',
    'settings.button': 'Background settings',
    'settings.wallpaper': 'Wallpaper',
    'settings.language': 'Language',
    'wallpaper.forest': 'Forest',
    'wallpaper.moon': 'Moon',
    'wallpaper.deep': 'Depth',
    'wallpaper.embers': 'Embers',
    'wallpaper.office': 'Study',
    'wallpaper.library': 'Library',
    'wallpaper.quidditch': 'Playing field',
    'wallpaper.custom': 'Custom image',
    'wallpaper.upload': 'Upload your own wallpaper image',
    'info.close': 'Close information',
    'info.title': 'Memory Bowl',
    'info.summary': 'A quiet place to unload thoughts when your mind feels crowded.',
    'info.item.add': 'Write a thought and release it into the bowl with the wand.',
    'info.item.mix': 'Mix the bowl to look at your thoughts up close.',
    'info.item.edit': 'Open a thought to edit it or delete it.',
    'info.item.wallpaper': 'Change the wallpaper from the settings on the right.',
    'hero.title': 'Memory<br />Bowl',
    'hero.subtitle': 'Your thoughts matter.<br />Unload them. Let go.',
    back: 'Back',
    'thought.label': 'Thought',
    'thought.placeholder': 'Pull out a thought...',
    'thought.submit': 'Catch thought',
    'thought.preview': 'Need to call mom',
    letGo: 'Release thoughts',
    mix: 'Mix',
    'mix.close': 'Close bowl',
    'modal.label': 'Thought',
    'modal.close': 'Close thought',
    'modal.actions': 'Thought actions',
    'modal.edit': 'Edit',
    'modal.delete': 'Delete',
    'modal.editLabel': 'Edit thought',
    'modal.save': 'Save',
    'modal.cancel': 'Cancel',
    'wand.button': 'Take a thought with the wand',
    'home.cta': 'Touch to start<br />unloading thoughts',
  },
};

type PensieveThought = {
  id: number;
  text: string;
  x: number;
  y: number;
  scale: number;
  delay: number;
  duration: number;
  depth: number;
  orbitAngle: number;
  orbitRadiusX: number;
  orbitRadiusY: number;
  orbitDuration: number;
};

type DragState = {
  thoughtId: number;
  element: HTMLElement;
  ghost: HTMLElement | null;
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  hasMoved: boolean;
};

let releaseTimer = 0;
let thoughtId = 0;
let releasedThought = '';
let thoughts: PensieveThought[] = [];
let surfacingThoughtId: number | null = null;
let surfacingTimer = 0;
let releaseFrame = 0;
let clearTimer = 0;
let selectedThoughtId: number | null = null;
let dragState: DragState | null = null;
let suppressThoughtClick = false;

const thoughtPositions = [
  { x: 50, y: 50 },
  { x: 27, y: 45 },
  { x: 72, y: 44 },
  { x: 38, y: 66 },
  { x: 65, y: 66 },
  { x: 18, y: 58 },
  { x: 82, y: 56 },
  { x: 48, y: 74 },
  { x: 31, y: 72 },
];

const isWallpaperName = (value: string | null): value is WallpaperName =>
  Boolean(value && wallpaperNames.includes(value as WallpaperName));

const isLanguageName = (value: string | null): value is LanguageName =>
  Boolean(value && languageNames.includes(value as LanguageName));

let currentLanguage: LanguageName = isLanguageName(document.documentElement.lang) ? document.documentElement.lang : 'ru';

const t = (key: TranslationKey) => translations[currentLanguage][key];

const setText = (selector: string, key: TranslationKey) => {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) {
    element.textContent = t(key);
  }
};

const setHtml = (selector: string, key: TranslationKey) => {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) {
    element.innerHTML = t(key);
  }
};

const setAttribute = (selector: string, attribute: string, key: TranslationKey) => {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) {
    element.setAttribute(attribute, t(key));
  }
};

const applyLanguage = (language: LanguageName) => {
  currentLanguage = language;
  document.documentElement.lang = language;
  document.title = t('app.title');
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', t('app.description'));

  setAttribute('.info-button', 'aria-label', 'info.button');
  setAttribute('.tune-button', 'aria-label', 'settings.button');
  setText('.wallpaper-menu-title', 'settings.wallpaper');
  setText('.language-switch-title', 'settings.language');
  setAttribute('.language-switch', 'aria-label', 'settings.language');
  setText('[data-wallpaper-option="forest"] span:last-child', 'wallpaper.forest');
  setText('[data-wallpaper-option="moon"] span:last-child', 'wallpaper.moon');
  setText('[data-wallpaper-option="deep"] span:last-child', 'wallpaper.deep');
  setText('[data-wallpaper-option="embers"] span:last-child', 'wallpaper.embers');
  setText('[data-wallpaper-option="office"] span:last-child', 'wallpaper.office');
  setText('[data-wallpaper-option="library"] span:last-child', 'wallpaper.library');
  setText('[data-wallpaper-option="quidditch"] span:last-child', 'wallpaper.quidditch');
  setText('[data-wallpaper-option="custom"] span:last-child', 'wallpaper.custom');
  setAttribute('.wallpaper-upload-input', 'aria-label', 'wallpaper.upload');
  setAttribute('.info-close-button', 'aria-label', 'info.close');
  setText('#info-dialog-title', 'info.title');
  setText('.info-dialog-content p', 'info.summary');
  setText('.info-dialog-content li:nth-child(1)', 'info.item.add');
  setText('.info-dialog-content li:nth-child(2)', 'info.item.mix');
  setText('.info-dialog-content li:nth-child(3)', 'info.item.edit');
  setText('.info-dialog-content li:nth-child(4)', 'info.item.wallpaper');
  setHtml('#app-title', 'hero.title');
  setHtml('.hero-copy p', 'hero.subtitle');
  setAttribute('.back-button', 'aria-label', 'back');
  setText('label[for="thought-input"]', 'thought.label');
  setAttribute('.thought-input', 'placeholder', 'thought.placeholder');
  setAttribute('.thought-submit', 'aria-label', 'thought.submit');
  if (thoughtCloudText && !thoughtInput?.value.trim()) {
    thoughtCloudText.textContent = t('thought.preview');
  }
  setText('.let-go-button', 'letGo');
  setText('.mix-button', 'mix');
  setAttribute('.mix-close-button', 'aria-label', 'mix.close');
  setAttribute('.thought-modal', 'aria-label', 'modal.label');
  setAttribute('.thought-modal-close', 'aria-label', 'modal.close');
  setAttribute('.thought-modal-actions', 'aria-label', 'modal.actions');
  setText('.thought-edit-button', 'modal.edit');
  setText('.thought-delete-button', 'modal.delete');
  setText('label[for="thought-edit-input"]', 'modal.editLabel');
  setText('.thought-save-button', 'modal.save');
  setText('.thought-cancel-button', 'modal.cancel');
  setAttribute('.wand-button', 'aria-label', 'wand.button');
  setHtml('.primary-action p', 'home.cta');

  languageOptions.forEach((option) => {
    const isActive = option.dataset.languageOption === language;
    option.classList.toggle('is-active', isActive);
    option.setAttribute('aria-pressed', String(isActive));
  });
};

const saveLanguage = (language: LanguageName) => {
  applyLanguage(language);

  try {
    window.localStorage.setItem(languageStorageKey, language);
  } catch {
    // Language preference is optional; the default copy remains usable.
  }
};

const loadLanguage = () => {
  let savedLanguage: string | null = null;

  try {
    savedLanguage = window.localStorage.getItem(languageStorageKey);
  } catch {
    savedLanguage = null;
  }

  applyLanguage(isLanguageName(savedLanguage) ? savedLanguage : currentLanguage);
};

const closeWallpaperMenu = () => {
  stage?.classList.remove('has-open-wallpaper-menu');
  wallpaperMenu?.setAttribute('aria-hidden', 'true');
  tuneButton?.setAttribute('aria-expanded', 'false');
};

const closeInfoDialog = () => {
  stage?.classList.remove('has-open-info');
  infoDialog?.setAttribute('aria-hidden', 'true');
  infoButton?.setAttribute('aria-expanded', 'false');
};

const openInfoDialog = () => {
  closeWallpaperMenu();
  closeThoughtModal();
  stage?.classList.add('has-open-info');
  infoDialog?.setAttribute('aria-hidden', 'false');
  infoButton?.setAttribute('aria-expanded', 'true');
  window.setTimeout(() => infoCloseButton?.focus(), 120);
};

const openWallpaperMenu = () => {
  if (stage?.classList.contains('is-mixing')) {
    return;
  }

  stage?.classList.add('has-open-wallpaper-menu');
  wallpaperMenu?.setAttribute('aria-hidden', 'false');
  tuneButton?.setAttribute('aria-expanded', 'true');
};

const toggleWallpaperMenu = () => {
  if (stage?.classList.contains('has-open-wallpaper-menu')) {
    closeWallpaperMenu();
    return;
  }

  openWallpaperMenu();
};

const applyWallpaper = (wallpaper: WallpaperName) => {
  stage?.setAttribute('data-wallpaper', wallpaper);
  document.documentElement.dataset.wallpaper = wallpaper;

  wallpaperOptions.forEach((option) => {
    const isActive = option.dataset.wallpaperOption === wallpaper;
    option.classList.toggle('is-active', isActive);
    option.setAttribute('aria-pressed', String(isActive));
  });

  try {
    window.localStorage.setItem(wallpaperStorageKey, wallpaper);
  } catch {
    // The selected wallpaper is optional polish; keep the app usable without storage.
  }
};

const loadCustomWallpaperImage = () => {
  try {
    const savedImage = window.localStorage.getItem(customWallpaperStorageKey);

    if (savedImage) {
      stage?.style.setProperty('--custom-wallpaper-image', `url("${savedImage}")`);
      document.documentElement.style.setProperty('--initial-custom-wallpaper-image', `url("${savedImage}")`);
      return true;
    }
  } catch {
    // The custom image is optional; fall back to built-in wallpapers.
  }

  stage?.style.removeProperty('--custom-wallpaper-image');
  document.documentElement.style.removeProperty('--initial-custom-wallpaper-image');
  return false;
};

const loadWallpaper = () => {
  let savedWallpaper: string | null = null;

  try {
    savedWallpaper = window.localStorage.getItem(wallpaperStorageKey);
  } catch {
    savedWallpaper = null;
  }

  const hasCustomWallpaper = loadCustomWallpaperImage();
  const wallpaper = isWallpaperName(savedWallpaper) ? savedWallpaper : 'forest';

  applyWallpaper(wallpaper === 'custom' && !hasCustomWallpaper ? 'forest' : wallpaper);
};

const readImageFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Unable to read image file.'));
    });
    reader.addEventListener('error', () => reject(reader.error ?? new Error('Unable to read image file.')));
    reader.readAsDataURL(file);
  });

const loadImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Unable to load image.')));
    image.src = source;
  });

const compressWallpaperImage = async (file: File) => {
  const source = await readImageFile(file);
  const image = await loadImage(source);
  const maxSide = 1600;
  const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return source;
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.82);
};

const saveCustomWallpaper = async (file: File) => {
  try {
    const imageUrl = await compressWallpaperImage(file);
    window.localStorage.setItem(customWallpaperStorageKey, imageUrl);
    stage?.style.setProperty('--custom-wallpaper-image', `url("${imageUrl}")`);
    document.documentElement.style.setProperty('--initial-custom-wallpaper-image', `url("${imageUrl}")`);
    applyWallpaper('custom');
    closeWallpaperMenu();
  } catch {
    wallpaperUploadInput?.focus();
  }
};

const updateLetGoButton = () => {
  const isBusy =
    stage?.classList.contains('is-releasing') ||
    stage?.classList.contains('is-clearing-thoughts') ||
    stage?.classList.contains('is-mixing');

  if (letGoButton) {
    letGoButton.hidden = thoughts.length === 0;
    letGoButton.disabled = thoughts.length === 0 || Boolean(isBusy);
  }

  if (mixButton) {
    mixButton.hidden = thoughts.length === 0;
    mixButton.disabled = thoughts.length === 0 || Boolean(isBusy);
  }
};

const createThoughtElement = (thought: PensieveThought) => {
  const item = document.createElement('button');
  item.className = 'pensieve-thought';
  item.type = 'button';
  item.tabIndex = -1;
  item.dataset.thoughtId = String(thought.id);
  return item;
};

const updateThoughtInteractivity = () => {
  const isMixing = Boolean(stage?.classList.contains('is-mixing'));
  const isCapturing = Boolean(stage?.classList.contains('is-capturing'));
  pensieveThoughts?.querySelectorAll<HTMLButtonElement>('.pensieve-thought').forEach((item) => {
    item.tabIndex = isMixing ? 0 : -1;
    item.toggleAttribute('draggable', false);
    item.setAttribute('aria-disabled', String(!isMixing && !isCapturing));
  });
};

const syncThoughtElement = (item: HTMLElement, thought: PensieveThought) => {
  item.classList.toggle('is-surfacing', thought.id === surfacingThoughtId);
  item.textContent = thought.text;
  item.setAttribute('aria-label', `${t('modal.label')}: ${thought.text}`);
  item.style.setProperty('--thought-x', `${thought.x}%`);
  item.style.setProperty('--thought-y', `${thought.y}%`);
  item.style.setProperty('--thought-scale', String(thought.scale));
  item.style.setProperty('--thought-delay', `${thought.delay}s`);
  item.style.setProperty('--thought-duration', `${thought.duration}s`);
  item.style.setProperty('--thought-depth', String(thought.depth));
  item.style.setProperty('--orbit-angle', `${thought.orbitAngle}deg`);
  item.style.setProperty('--orbit-angle-end', `${thought.orbitAngle + 360}deg`);
  item.style.setProperty('--orbit-angle-inverse', `${-thought.orbitAngle}deg`);
  item.style.setProperty('--orbit-angle-end-inverse', `${-(thought.orbitAngle + 360)}deg`);
  item.style.setProperty('--orbit-radius-x', `${thought.orbitRadiusX}px`);
  item.style.setProperty('--orbit-radius-y', `${thought.orbitRadiusY}px`);
  item.style.setProperty('--orbit-duration', `${thought.orbitDuration}s`);
};

const renderPensieveThoughts = () => {
  if (!pensieveThoughts) {
    return;
  }

  const currentItems = new Map(
    Array.from(pensieveThoughts.querySelectorAll<HTMLElement>('.pensieve-thought')).map((item) => [
      item.dataset.thoughtId,
      item,
    ]),
  );

  thoughts.forEach((thought) => {
    const key = String(thought.id);
    const item = currentItems.get(key) ?? createThoughtElement(thought);
    syncThoughtElement(item, thought);

    if (!item.isConnected) {
      pensieveThoughts.append(item);
    }

    currentItems.delete(key);
  });

  currentItems.forEach((item) => item.remove());

  stage?.classList.toggle('has-pensieve-thoughts', thoughts.length > 0);
  stage?.classList.toggle('has-many-thoughts', thoughts.length > 5);
  updateThoughtInteractivity();
  updateLetGoButton();
};

const saveThoughts = () => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(thoughts.map((thought) => thought.text)));
  } catch {
    // Storage is a convenience; the app should still work without it.
  }
};

const getSelectedThought = () => thoughts.find((thought) => thought.id === selectedThoughtId);

const isPointOutsidePensieve = (x: number, y: number) => {
  const rect = pensieveScene?.getBoundingClientRect();

  if (!rect) {
    return false;
  }

  const releasePadding = 14;
  return (
    x < rect.left - releasePadding ||
    x > rect.right + releasePadding ||
    y < rect.top - releasePadding ||
    y > rect.bottom + releasePadding
  );
};

const createThoughtDragGhost = (source: HTMLElement) => {
  const rect = source.getBoundingClientRect();
  const ghost = source.cloneNode(true) as HTMLElement;
  ghost.removeAttribute('id');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.tabIndex = -1;
  ghost.classList.remove('is-surfacing', 'is-drag-source');
  ghost.classList.add('thought-drag-ghost');
  ghost.style.left = `${rect.left}px`;
  ghost.style.top = `${rect.top}px`;
  ghost.style.width = `${rect.width}px`;
  ghost.style.minHeight = `${rect.height}px`;
  stage?.append(ghost);
  return ghost;
};

const resetDraggedThought = () => {
  if (!dragState) {
    return;
  }

  dragState.element.classList.remove('is-drag-source');
  dragState.ghost?.remove();
  stage?.classList.remove('is-dragging-thought', 'can-release-dragged-thought');
  dragState = null;
};

const removeThoughtByDrag = (thoughtIdToRemove: number, source: HTMLElement, ghost: HTMLElement | null) => {
  thoughts = thoughts.filter((thought) => thought.id !== thoughtIdToRemove);
  saveThoughts();
  closeThoughtModal();
  source.classList.add('is-drag-source');
  ghost?.classList.remove('is-drag-outside');
  ghost?.classList.add('is-drag-releasing');
  stage?.classList.remove('is-dragging-thought', 'can-release-dragged-thought');
  stage?.classList.add('just-released-dragged-thought');
  dragState = null;
  updateLetGoButton();

  window.setTimeout(() => {
    ghost?.remove();
    source.remove();
    renderPensieveThoughts();
    stage?.classList.remove('just-released-dragged-thought');
    suppressThoughtClick = false;

    if (thoughts.length === 0 && stage?.classList.contains('is-mixing')) {
      closeMixingView();
    }
  }, 420);
};

const moveDraggedThought = (event: PointerEvent) => {
  if (!dragState || event.pointerId !== dragState.pointerId) {
    return;
  }

  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;
  const distance = Math.hypot(deltaX, deltaY);

  if (!dragState.hasMoved && distance < 8) {
    return;
  }

  event.preventDefault();
  dragState.hasMoved = true;
  suppressThoughtClick = true;
  stage?.classList.add('is-dragging-thought');
  dragState.element.classList.add('is-drag-source');

  if (!dragState.ghost) {
    dragState.ghost = createThoughtDragGhost(dragState.element);
  }

  dragState.ghost.style.left = `${event.clientX - dragState.offsetX}px`;
  dragState.ghost.style.top = `${event.clientY - dragState.offsetY}px`;

  const isOutside = isPointOutsidePensieve(event.clientX, event.clientY);
  dragState.ghost.classList.toggle('is-drag-outside', isOutside);
  stage?.classList.toggle('can-release-dragged-thought', isOutside);
};

const endDraggedThought = (event: PointerEvent) => {
  if (!dragState || event.pointerId !== dragState.pointerId) {
    return;
  }

  const state = dragState;

  try {
    state.element.releasePointerCapture(state.pointerId);
  } catch {
    // Pointer capture is a progressive enhancement here.
  }

  if (!state.hasMoved) {
    resetDraggedThought();
    return;
  }

  event.preventDefault();

  if (isPointOutsidePensieve(event.clientX, event.clientY)) {
    removeThoughtByDrag(state.thoughtId, state.element, state.ghost);
    return;
  }

  resetDraggedThought();
  window.setTimeout(() => {
    suppressThoughtClick = false;
  }, 0);
};

const cancelDraggedThought = () => {
  resetDraggedThought();
  window.setTimeout(() => {
    suppressThoughtClick = false;
  }, 0);
};

const startThoughtDrag = (event: PointerEvent) => {
  const isInteractive =
    stage?.classList.contains('is-capturing') ||
    stage?.classList.contains('is-mixing');

  if (
    !isInteractive ||
    event.button !== 0 ||
    stage?.classList.contains('is-releasing') ||
    stage?.classList.contains('is-clearing-thoughts')
  ) {
    return;
  }

  const element = (event.target as HTMLElement).closest<HTMLElement>('.pensieve-thought');
  const thoughtIdToDrag = Number(element?.dataset.thoughtId);

  if (!element || !Number.isFinite(thoughtIdToDrag)) {
    return;
  }

  const rect = element.getBoundingClientRect();
  dragState = {
    thoughtId: thoughtIdToDrag,
    element,
    ghost: null,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    hasMoved: false,
  };
  suppressThoughtClick = false;

  try {
    element.setPointerCapture(event.pointerId);
  } catch {
    // Some browsers may not support capture on this element; document listeners still handle the drag.
  }
};

const clearSavedThoughts = () => {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Storage is a convenience; the app should still work without it.
  }
};

const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const easeInOut = (progress: number) =>
  progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

const easeOut = (progress: number) => 1 - Math.pow(1 - progress, 3);

const fadeBetween = (progress: number, start: number, end: number) => {
  const amount = clamp((progress - start) / (end - start), 0, 1);
  return amount * amount * (3 - 2 * amount);
};

const resetReleaseStyles = () => {
  [thoughtCloud, thoughtStream, releaseTrail, wandHand, wandLight].forEach((element) => {
    element?.removeAttribute('style');
  });
};

const animateRelease = () => {
  window.cancelAnimationFrame(releaseFrame);

  const startedAt = window.performance.now();
  const anchorX = Math.min(92, window.innerWidth * 0.14);

  const step = (now: number) => {
    const progress = clamp((now - startedAt) / releaseDurationMs, 0, 1);
    const travel = easeInOut(progress);
    const dissolve = fadeBetween(progress, 0.7, 1);
    const birth = easeOut(fadeBetween(progress, 0, 0.3));

    const cloudX = mix(42, -anchorX, travel) + Math.sin(progress * Math.PI) * 10;
    const cloudY = mix(-8, 192, travel) - Math.sin(progress * Math.PI) * 14;
    const cloudScale = (0.24 + birth * 0.68) * (1 - dissolve * 0.78);
    const cloudOpacity = Math.min(1, birth * 1.12) * (1 - dissolve);
    const cloudBlur = mix(6.5, 0.2, birth) + dissolve * 2.6;
    const cloudBrightness = 1.1 + (1 - birth) * 0.7 + dissolve * 0.62;

    const handY = mix(0, 152, travel);
    const handX = -10 - Math.sin(progress * Math.PI) * 7;
    const handRotate = mix(-0.8, 8.2, travel);
    const handReturn = fadeBetween(progress, 0.86, 1);
    const finalHandX = mix(handX, 0, handReturn);
    const finalHandY = mix(handY, 0, handReturn);
    const finalHandRotate = mix(handRotate, 0, handReturn);

    const threadOpacity = 0.86 * Math.pow(1 - progress, 1.55);
    const threadY = mix(0, 138, easeOut(progress));
    const threadScaleY = mix(1, 0.34, easeOut(progress));
    const threadBlur = mix(0.2, 5.2, progress);

    const trailOpacity = Math.sin(progress * Math.PI) * 0.22;
    const trailY = mix(-8, 58, travel);
    const trailScale = mix(0.56, 0.9, Math.sin(progress * Math.PI));

    const glowScale = 1 + Math.sin(progress * Math.PI) * 0.38;

    if (thoughtCloud) {
      thoughtCloud.style.opacity = String(cloudOpacity);
      thoughtCloud.style.transform = `translate3d(calc(-50% + ${cloudX.toFixed(2)}px), ${cloudY.toFixed(2)}px, 0) scale(${cloudScale.toFixed(3)})`;
      thoughtCloud.style.filter = `brightness(${cloudBrightness.toFixed(3)}) blur(${cloudBlur.toFixed(2)}px)`;
    }

    if (wandHand) {
      wandHand.style.transform = `translate3d(${finalHandX.toFixed(2)}px, ${finalHandY.toFixed(2)}px, 0) rotate(${finalHandRotate.toFixed(2)}deg)`;
    }

    if (wandLight) {
      wandLight.style.transform = `translate(-50%, -50%) scale(${glowScale.toFixed(3)})`;
    }

    if (thoughtStream) {
      thoughtStream.style.opacity = String(threadOpacity);
      thoughtStream.style.transform = `translateX(-50%) translateY(${threadY.toFixed(2)}px) rotate(-24deg) scaleY(${threadScaleY.toFixed(3)})`;
      thoughtStream.style.filter = `blur(${threadBlur.toFixed(2)}px) brightness(${mix(1, 1.5, progress).toFixed(2)})`;
    }

    if (releaseTrail) {
      releaseTrail.style.opacity = String(trailOpacity);
      releaseTrail.style.transform = `translateX(-50%) translateY(${trailY.toFixed(2)}px) scale(${trailScale.toFixed(3)}) rotate(${mix(-4, 5, travel).toFixed(2)}deg)`;
      releaseTrail.style.filter = `blur(${mix(1.1, 1.6, progress).toFixed(2)}px)`;
    }

    if (progress < 1) {
      releaseFrame = window.requestAnimationFrame(step);
      return;
    }

    finishRelease();
  };

  releaseFrame = window.requestAnimationFrame(step);
};

const addThoughtToPensieve = (text: string) => {
  const slot = thoughtPositions[thoughtId % thoughtPositions.length];
  const drift = thoughtId % 5;
  const id = thoughtId;

  thoughts = [
    ...thoughts,
    {
      id,
      text,
      x: slot.x,
      y: slot.y,
      scale: 0.82 + (drift % 3) * 0.08,
      delay: -(thoughtId % 6) * 0.65,
      duration: 8.8 + (thoughtId % 5) * 1.1,
      depth: 0.42 + (thoughtId % 4) * 0.16,
      orbitAngle: (thoughtId * 47) % 360,
      orbitRadiusX: 152 + (thoughtId % 5) * 34,
      orbitRadiusY: 42 + (thoughtId % 5) * 12,
      orbitDuration: 14 + (thoughtId % 5) * 1.8,
    },
  ];

  thoughtId += 1;
  surfacingThoughtId = id;
  renderPensieveThoughts();
  saveThoughts();

  window.clearTimeout(surfacingTimer);
  surfacingTimer = window.setTimeout(() => {
    surfacingThoughtId = null;
    renderPensieveThoughts();
  }, 1700);
};

const loadSavedThoughts = () => {
  try {
    const saved = window.localStorage.getItem(storageKey);

    if (!saved) {
      renderPensieveThoughts();
      return;
    }

    const savedTexts = JSON.parse(saved);

    if (!Array.isArray(savedTexts)) {
      renderPensieveThoughts();
      return;
    }

    savedTexts
      .filter((text): text is string => typeof text === 'string' && text.trim().length > 0)
      .slice(0, 60)
      .forEach((text) => {
        const slot = thoughtPositions[thoughtId % thoughtPositions.length];
        const drift = thoughtId % 5;
        thoughts = [
          ...thoughts,
          {
            id: thoughtId,
            text: text.trim().slice(0, 80),
            x: slot.x,
            y: slot.y,
            scale: 0.82 + (drift % 3) * 0.08,
            delay: -(thoughtId % 6) * 0.65,
            duration: 8.8 + (thoughtId % 5) * 1.1,
            depth: 0.42 + (thoughtId % 4) * 0.16,
            orbitAngle: (thoughtId * 47) % 360,
            orbitRadiusX: 152 + (thoughtId % 5) * 34,
            orbitRadiusY: 42 + (thoughtId % 5) * 12,
            orbitDuration: 14 + (thoughtId % 5) * 1.8,
          },
        ];
        thoughtId += 1;
      });

    renderPensieveThoughts();
  } catch {
    renderPensieveThoughts();
  }
};

const openCaptureScreen = () => {
  stage?.classList.add('is-capturing');
  captureScreen?.removeAttribute('aria-hidden');
  window.setTimeout(() => thoughtInput?.focus(), 260);
  document.body.dispatchEvent(new CustomEvent('pensieve:start-thought'));
};

const closeCaptureScreen = () => {
  window.clearTimeout(releaseTimer);
  window.clearTimeout(clearTimer);
  window.cancelAnimationFrame(releaseFrame);
  resetReleaseStyles();
  stage?.classList.remove(
    'is-capturing',
    'has-draft-thought',
    'is-releasing',
    'just-released',
    'just-cleared',
    'is-clearing-thoughts',
    'is-mixing',
    'has-open-thought',
    'has-open-info',
  );
  captureScreen?.setAttribute('aria-hidden', 'true');
  pensieveScene?.setAttribute('aria-hidden', 'true');
  thoughtModal?.setAttribute('aria-hidden', 'true');
  infoDialog?.setAttribute('aria-hidden', 'true');
  infoButton?.setAttribute('aria-expanded', 'false');
  updateThoughtInteractivity();
  updateLetGoButton();

  if (thoughtInput) {
    thoughtInput.value = '';
    thoughtInput.disabled = false;
  }

  if (thoughtCloudText) {
    thoughtCloudText.textContent = t('thought.preview');
  }
};

const syncThoughtPreview = () => {
  const thought = thoughtInput?.value.trim() ?? '';

  stage?.classList.toggle('has-draft-thought', thought.length > 0);

  if (thoughtCloudText) {
    thoughtCloudText.textContent = thought || t('thought.preview');
  }
};

const finishRelease = () => {
  window.cancelAnimationFrame(releaseFrame);

  if (releasedThought) {
    addThoughtToPensieve(releasedThought);
    releasedThought = '';
  }

  stage?.classList.remove('is-releasing', 'has-draft-thought');
  stage?.classList.add('just-released');
  resetReleaseStyles();
  updateLetGoButton();

  if (thoughtInput) {
    thoughtInput.value = '';
    thoughtInput.disabled = false;
    thoughtInput.focus();
  }

  if (thoughtCloudText) {
    thoughtCloudText.textContent = t('thought.preview');
  }

  window.setTimeout(() => stage?.classList.remove('just-released'), 780);
};

const clearPensieveThoughts = () => {
  if (
    thoughts.length === 0 ||
    stage?.classList.contains('is-releasing') ||
    stage?.classList.contains('is-clearing-thoughts') ||
    stage?.classList.contains('is-mixing')
  ) {
    return;
  }

  window.clearTimeout(clearTimer);
  window.clearTimeout(surfacingTimer);
  surfacingThoughtId = null;
  stage?.classList.remove('just-released', 'is-stirring');
  stage?.classList.add('is-clearing-thoughts');
  updateLetGoButton();

  clearTimer = window.setTimeout(() => {
    thoughts = [];
    clearSavedThoughts();
    renderPensieveThoughts();
    stage?.classList.remove('is-clearing-thoughts');
    stage?.classList.add('just-cleared');
    updateLetGoButton();

    window.setTimeout(() => stage?.classList.remove('just-cleared'), 920);
  }, clearThoughtsDurationMs);
};

const openMixingView = () => {
  if (
    thoughts.length === 0 ||
    stage?.classList.contains('is-releasing') ||
    stage?.classList.contains('is-clearing-thoughts')
  ) {
    return;
  }

  stage?.classList.remove('has-draft-thought', 'just-released', 'just-cleared', 'is-stirring');
  closeWallpaperMenu();
  stage?.classList.add('is-mixing');
  pensieveScene?.removeAttribute('aria-hidden');
  updateThoughtInteractivity();
  updateLetGoButton();

  if (thoughtInput) {
    thoughtInput.blur();
  }
};

const closeThoughtModal = () => {
  stage?.classList.remove('has-open-thought');
  thoughtModal?.classList.remove('is-editing');
  thoughtModal?.setAttribute('aria-hidden', 'true');
  selectedThoughtId = null;

  if (thoughtModalText) {
    thoughtModalText.textContent = '';
  }

  if (thoughtEditInput) {
    thoughtEditInput.value = '';
  }
};

const closeMixingView = () => {
  closeThoughtModal();
  stage?.classList.remove('is-mixing');
  pensieveScene?.setAttribute('aria-hidden', 'true');
  updateThoughtInteractivity();
  updateLetGoButton();
  window.setTimeout(() => thoughtInput?.focus(), 180);
};

const openThoughtModal = (thought: PensieveThought) => {
  if (!thoughtModal || !thoughtModalText) {
    return;
  }

  selectedThoughtId = thought.id;
  thoughtModal.classList.remove('is-editing');
  thoughtModalText.textContent = thought.text;
  thoughtModal.removeAttribute('aria-hidden');
  stage?.classList.add('has-open-thought');
  window.setTimeout(() => thoughtEditButton?.focus(), 120);
};

const startEditingThought = () => {
  const thought = getSelectedThought();

  if (!thought || !thoughtModal || !thoughtEditInput) {
    return;
  }

  thoughtEditInput.value = thought.text;
  thoughtModal.classList.add('is-editing');
  window.setTimeout(() => {
    thoughtEditInput.focus();
    thoughtEditInput.select();
  }, 80);
};

const stopEditingThought = () => {
  thoughtModal?.classList.remove('is-editing');
  window.setTimeout(() => thoughtEditButton?.focus(), 80);
};

const saveEditedThought = () => {
  const thought = getSelectedThought();
  const nextText = thoughtEditInput?.value.trim() ?? '';

  if (!thought || !nextText) {
    thoughtEditInput?.focus();
    return;
  }

  thoughts = thoughts.map((item) => (item.id === thought.id ? { ...item, text: nextText.slice(0, 80) } : item));
  renderPensieveThoughts();
  saveThoughts();

  if (thoughtModalText) {
    thoughtModalText.textContent = nextText.slice(0, 80);
  }

  stopEditingThought();
};

const deleteSelectedThought = () => {
  const thought = getSelectedThought();

  if (!thought) {
    return;
  }

  thoughts = thoughts.filter((item) => item.id !== thought.id);
  saveThoughts();
  closeThoughtModal();
  renderPensieveThoughts();

  if (thoughts.length === 0) {
    closeMixingView();
  }
};

wandButton?.addEventListener('click', openCaptureScreen);
backButton?.addEventListener('click', closeCaptureScreen);
letGoButton?.addEventListener('click', clearPensieveThoughts);
mixButton?.addEventListener('click', openMixingView);
mixCloseButton?.addEventListener('click', closeMixingView);
infoButton?.addEventListener('click', openInfoDialog);
infoCloseButton?.addEventListener('click', closeInfoDialog);
tuneButton?.addEventListener('click', toggleWallpaperMenu);
wallpaperOptions.forEach((option) => {
  option.addEventListener('click', () => {
    const wallpaperName = option.dataset.wallpaperOption ?? null;

    if (isWallpaperName(wallpaperName)) {
      if (wallpaperName === 'custom' && !loadCustomWallpaperImage()) {
        wallpaperUploadInput?.click();
        return;
      }

      applyWallpaper(wallpaperName);
      closeWallpaperMenu();
    }
  });
});
wallpaperUploadInput?.addEventListener('change', () => {
  const file = wallpaperUploadInput.files?.[0];

  if (file) {
    void saveCustomWallpaper(file);
  }

  wallpaperUploadInput.value = '';
});
languageOptions.forEach((option) => {
  option.addEventListener('click', () => {
    const language = option.dataset.languageOption ?? null;

    if (isLanguageName(language)) {
      saveLanguage(language);
      renderPensieveThoughts();
    }
  });
});
document.addEventListener('click', (event) => {
  if (
    !stage?.classList.contains('has-open-wallpaper-menu') ||
    wallpaperMenu?.contains(event.target as Node) ||
    tuneButton?.contains(event.target as Node)
  ) {
    return;
  }

  closeWallpaperMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (stage?.classList.contains('has-open-info')) {
      closeInfoDialog();
      return;
    }

    if (thoughtModal?.classList.contains('is-editing')) {
      stopEditingThought();
      return;
    }

    if (stage?.classList.contains('has-open-thought')) {
      closeThoughtModal();
      return;
    }

    closeWallpaperMenu();
  }
});
thoughtModalClose?.addEventListener('click', closeThoughtModal);
thoughtEditButton?.addEventListener('click', startEditingThought);
thoughtCancelButton?.addEventListener('click', stopEditingThought);
thoughtDeleteButton?.addEventListener('click', deleteSelectedThought);
thoughtEditForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  saveEditedThought();
});
thoughtModal?.addEventListener('click', (event) => {
  if (event.target === thoughtModal) {
    closeThoughtModal();
  }
});
infoDialog?.addEventListener('click', (event) => {
  if (event.target === infoDialog) {
    closeInfoDialog();
  }
});
thoughtInput?.addEventListener('input', syncThoughtPreview);
pensieveThoughts?.addEventListener('click', (event) => {
  if (suppressThoughtClick) {
    suppressThoughtClick = false;
    event.preventDefault();
    return;
  }

  if (!stage?.classList.contains('is-mixing')) {
    return;
  }

  const thoughtElement = (event.target as HTMLElement).closest<HTMLElement>('.pensieve-thought');
  const thought = thoughts.find((item) => String(item.id) === thoughtElement?.dataset.thoughtId);

  if (thought) {
    openThoughtModal(thought);
  }
});
pensieveThoughts?.addEventListener('pointerdown', startThoughtDrag);
document.addEventListener('pointermove', moveDraggedThought);
document.addEventListener('pointerup', endDraggedThought);
document.addEventListener('pointercancel', cancelDraggedThought);

thoughtForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  syncThoughtPreview();

  if (!thoughtInput?.value.trim()) {
    thoughtInput?.focus();
    return;
  }

  if (
    stage?.classList.contains('is-releasing') ||
    stage?.classList.contains('is-clearing-thoughts') ||
    stage?.classList.contains('is-mixing')
  ) {
    return;
  }

  releasedThought = thoughtInput.value.trim();
  thoughtInput.disabled = true;
  stage?.classList.remove('just-released');
  stage?.classList.add('is-releasing');

  window.clearTimeout(releaseTimer);
  animateRelease();
});

stage?.classList.remove(
  'is-capturing',
  'has-draft-thought',
  'is-releasing',
  'just-released',
  'just-cleared',
  'is-stirring',
  'is-clearing-thoughts',
  'is-mixing',
  'has-open-thought',
  'has-open-wallpaper-menu',
  'has-open-info',
);
captureScreen?.setAttribute('aria-hidden', 'true');
pensieveScene?.setAttribute('aria-hidden', 'true');
thoughtModal?.setAttribute('aria-hidden', 'true');
wallpaperMenu?.setAttribute('aria-hidden', 'true');
infoDialog?.setAttribute('aria-hidden', 'true');
infoButton?.setAttribute('aria-expanded', 'false');
loadLanguage();
loadWallpaper();
loadSavedThoughts();
