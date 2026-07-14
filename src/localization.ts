import { languageOptions, thoughtCloudText, thoughtInput } from './dom';
import { STORAGE_KEYS, type LanguageName } from './config';
import { isLanguageName } from './guards';
import { translations, type TranslationKey } from './i18n';
import { appStorage } from './storageAdapter';

let currentLanguage: LanguageName = isLanguageName(document.documentElement.lang) ? document.documentElement.lang : 'en';

export const t = (key: TranslationKey) => translations[currentLanguage][key];

const setText = (selector: string, key: TranslationKey) => {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) {
    element.textContent = t(key);
  }
};

const setHtml = (selector: string, key: TranslationKey) => {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    return;
  }

  const parts = t(key).split(/<br\s*\/?>/i);
  element.replaceChildren(
    ...parts.flatMap((part, index) =>
      index === 0 ? [document.createTextNode(part)] : [document.createElement('br'), document.createTextNode(part)],
    ),
  );
};

const setAttribute = (selector: string, attribute: string, key: TranslationKey) => {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) {
    element.setAttribute(attribute, t(key));
  }
};

export const applyLanguage = (language: LanguageName) => {
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
  setAttribute('.wallpaper-reset-custom', 'aria-label', 'wallpaper.resetCustom');
  setAttribute('.wallpaper-reset-custom', 'title', 'wallpaper.resetCustom');
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
  setText('.completion-title', 'completion.title');
  setText('.completion-text', 'completion.text');
  setAttribute('.wand-button', 'aria-label', 'wand.button');
  setHtml('.primary-action p', 'home.cta');

  languageOptions.forEach((option) => {
    const isActive = option.dataset.languageOption === language;
    option.classList.toggle('is-active', isActive);
    option.setAttribute('aria-pressed', String(isActive));
  });
};

export const saveLanguage = (language: LanguageName) => {
  applyLanguage(language);

  void appStorage.setItem(STORAGE_KEYS.language, language).catch(() => {
    // Language preference is optional; the default copy remains usable.
  });
};

export const loadLanguage = async () => {
  let savedLanguage: string | null = null;

  try {
    savedLanguage = await appStorage.getItem(STORAGE_KEYS.language);
  } catch {
    savedLanguage = null;
  }

  applyLanguage(isLanguageName(savedLanguage) ? savedLanguage : currentLanguage);
};
