import './styles.css';

import {
  captureScreen,
  completionScreen,
  infoButton,
  infoCloseButton,
  infoDialog,
  languageOptions,
  letGoButton,
  mixButton,
  mixCloseButton,
  pensieveScene,
  pensieveThoughts,
  releaseTrail,
  stage,
  thoughtCancelButton,
  thoughtCloud,
  thoughtCloudText,
  thoughtDeleteButton,
  thoughtEditButton,
  thoughtEditForm,
  thoughtEditInput,
  thoughtForm,
  thoughtInput,
  thoughtModal,
  thoughtModalClose,
  thoughtModalText,
  thoughtModalView,
  thoughtStream,
  thoughtStreamSvg,
  thoughtThreadPaths,
  tuneButton,
  wallpaperMenu,
  wallpaperOptions,
  wallpaperUploadInput,
  wandButton,
  wandHand,
  wandLight,
  backButton,
} from './dom';
import {
  CLEAR_THOUGHTS_DURATION_MS,
  STORAGE_KEYS,
  THOUGHT_SURFACE_DURATION_MS,
  type LanguageName,
  type WallpaperName,
} from './config';
import { isLanguageName, isWallpaperName } from './guards';
import { loadLanguage, saveLanguage, t } from './localization';
import { createReleaseAnimationController } from './releaseAnimationController';
import { createScreenController, type ScreenController } from './screenController';
import { createAppState } from './state';
import { createPensieveThought } from './thoughts';
import { createThoughtModalController } from './thoughtModalController';
import { createThoughtDragController } from './thoughtDragController';
import { createThoughtRenderer } from './thoughtRenderer';
import {
  clearSavedThoughts as clearStoredThoughts,
  loadSavedThoughts as loadStoredThoughts,
  saveThoughts as saveStoredThoughts,
} from './thoughtStorage';
import { compressWallpaperImage } from './wallpaper';

const state = createAppState();
let screenController: ScreenController;
const closeMixingView = () => screenController.closeMixingView();

const thoughtRenderer = createThoughtRenderer({
  state,
  stage,
  thoughtsContainer: pensieveThoughts,
  letGoButton,
  mixButton,
  t,
});
const renderPensieveThoughts = thoughtRenderer.render;
const updateLetGoButton = thoughtRenderer.updateActions;
const updateThoughtInteractivity = thoughtRenderer.updateInteractivity;
const saveCurrentThoughts = () => saveStoredThoughts(state.thoughts);
const thoughtModalController = createThoughtModalController({
  state,
  stage,
  modal: thoughtModal,
  modalText: thoughtModalText,
  editInput: thoughtEditInput,
  editButton: thoughtEditButton,
  renderThoughts: renderPensieveThoughts,
  saveThoughts: saveCurrentThoughts,
  onEmpty: () => closeMixingView(),
});
const thoughtDragController = createThoughtDragController({
  state,
  stage,
  pensieveScene,
  saveThoughts: saveCurrentThoughts,
  closeThoughtModal: thoughtModalController.close,
  renderThoughts: renderPensieveThoughts,
  updateActions: updateLetGoButton,
  closeMixingView: () => closeMixingView(),
});
const releaseAnimationController = createReleaseAnimationController({
  state,
  stage,
  thoughtInput,
  thoughtForm,
  thoughtCloud,
  thoughtStream,
  thoughtStreamSvg,
  thoughtThreadPaths,
  releaseTrail,
  wandHand,
  wandLight,
  pensieveScene,
  onReleaseFinish: () => finishRelease(),
});

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

const hideCompletionScreen = () => {
  window.clearTimeout(state.completionTimer);
  stage?.classList.remove('has-completion');
  completionScreen?.setAttribute('aria-hidden', 'true');
};

const showCompletionScreen = () => {
  window.clearTimeout(state.completionTimer);
  stage?.classList.add('has-completion');
  completionScreen?.setAttribute('aria-hidden', 'false');

  state.completionTimer = window.setTimeout(() => {
    stage?.classList.remove('has-completion');
    completionScreen?.setAttribute('aria-hidden', 'true');
  }, 4200);
};

const openInfoDialog = () => {
  closeWallpaperMenu();
  thoughtModalController.close();
  hideCompletionScreen();
  stage?.classList.add('has-open-info');
  infoDialog?.setAttribute('aria-hidden', 'false');
  infoButton?.setAttribute('aria-expanded', 'true');
  window.setTimeout(() => infoCloseButton?.focus(), 120);
};

const openWallpaperMenu = () => {
  if (stage?.classList.contains('is-mixing')) {
    return;
  }

  hideCompletionScreen();
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
    window.localStorage.setItem(STORAGE_KEYS.wallpaper, wallpaper);
  } catch {
    // The selected wallpaper is optional polish; keep the app usable without storage.
  }
};

const loadCustomWallpaperImage = () => {
  try {
    const savedImage = window.localStorage.getItem(STORAGE_KEYS.customWallpaper);

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
    savedWallpaper = window.localStorage.getItem(STORAGE_KEYS.wallpaper);
  } catch {
    savedWallpaper = null;
  }

  const hasCustomWallpaper = loadCustomWallpaperImage();
  const wallpaper = isWallpaperName(savedWallpaper) ? savedWallpaper : 'forest';

  applyWallpaper(wallpaper === 'custom' && !hasCustomWallpaper ? 'forest' : wallpaper);
};

const saveCustomWallpaper = async (file: File) => {
  try {
    const imageUrl = await compressWallpaperImage(file);
    window.localStorage.setItem(STORAGE_KEYS.customWallpaper, imageUrl);
    stage?.style.setProperty('--custom-wallpaper-image', `url("${imageUrl}")`);
    document.documentElement.style.setProperty('--initial-custom-wallpaper-image', `url("${imageUrl}")`);
    applyWallpaper('custom');
    closeWallpaperMenu();
  } catch {
    wallpaperUploadInput?.focus();
  }
};

screenController = createScreenController({
  state,
  stage,
  captureScreen,
  pensieveScene,
  thoughtInput,
  thoughtCloudText,
  thoughtModal,
  infoDialog,
  infoButton,
  releaseAnimation: releaseAnimationController,
  t,
  hideCompletionScreen,
  closeWallpaperMenu,
  closeThoughtModal: thoughtModalController.close,
  updateThoughtInteractivity,
  updateActions: updateLetGoButton,
  getThoughtCount: () => state.thoughts.length,
});

const addThoughtToPensieve = (text: string) => {
  const id = state.thoughtId;

  state.thoughts = [
    ...state.thoughts,
    createPensieveThought(text, id),
  ];

  state.thoughtId += 1;
  state.surfacingThoughtId = id;
  renderPensieveThoughts();
  saveStoredThoughts(state.thoughts);

  window.clearTimeout(state.surfacingTimer);
  state.surfacingTimer = window.setTimeout(() => {
    state.surfacingThoughtId = null;
    renderPensieveThoughts();
  }, THOUGHT_SURFACE_DURATION_MS);
};

const loadSavedThoughtsIntoState = () => {
  const savedState = loadStoredThoughts();
  state.thoughts = savedState.thoughts;
  state.thoughtId = savedState.nextThoughtId;
  renderPensieveThoughts();
};

const syncThoughtPreview = () => {
  const thought = thoughtInput?.value.trim() ?? '';
  const hasThought = thought.length > 0;
  const isReleasing = stage?.classList.contains('is-releasing') ?? false;

  stage?.classList.toggle('has-draft-thought', hasThought);
  releaseAnimationController.updateWandLightAnchor();

  if (hasThought && !isReleasing) {
    releaseAnimationController.prepareDraftThread();
  }

  if (!hasThought && state.hadDraftThought && !isReleasing) {
    releaseAnimationController.animateThoughtThreadClear();
  }

  state.hadDraftThought = hasThought;

  if (thoughtCloudText) {
    thoughtCloudText.textContent = thought || t('thought.preview');
  }
};

const finishRelease = () => {
  releaseAnimationController.cancelReleaseFrame();

  if (state.releasedThought) {
    addThoughtToPensieve(state.releasedThought);
    state.releasedThought = '';
  }

  stage?.classList.remove('is-releasing', 'has-draft-thought');
  stage?.classList.add('just-released');
  releaseAnimationController.resetStyles({ keepThreadErased: true });
  state.hadDraftThought = false;
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
    state.thoughts.length === 0 ||
    stage?.classList.contains('is-releasing') ||
    stage?.classList.contains('is-clearing-thoughts') ||
    stage?.classList.contains('is-mixing')
  ) {
    return;
  }

  window.clearTimeout(state.clearTimer);
  window.clearTimeout(state.surfacingTimer);
  hideCompletionScreen();
  state.surfacingThoughtId = null;
  stage?.classList.remove('just-released', 'is-stirring');
  stage?.classList.add('is-clearing-thoughts');
  updateLetGoButton();

  state.clearTimer = window.setTimeout(() => {
    state.thoughts = [];
    clearStoredThoughts();
    renderPensieveThoughts();
    stage?.classList.remove('is-clearing-thoughts');
    stage?.classList.add('just-cleared');
    showCompletionScreen();
    updateLetGoButton();

    window.setTimeout(() => stage?.classList.remove('just-cleared'), 920);
  }, CLEAR_THOUGHTS_DURATION_MS);
};

wandButton?.addEventListener('click', screenController.openCaptureScreen);
backButton?.addEventListener('click', screenController.closeCaptureScreen);
letGoButton?.addEventListener('click', clearPensieveThoughts);
mixButton?.addEventListener('click', screenController.openMixingView);
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
wallpaperUploadInput?.addEventListener('change', (event) => {
  const input = event.currentTarget;

  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const file = input.files?.[0];

  if (file) {
    void saveCustomWallpaper(file);
  }

  input.value = '';
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

    if (thoughtModalController.isEditing()) {
      thoughtModalController.stopEditing();
      return;
    }

    if (stage?.classList.contains('has-open-thought')) {
      thoughtModalController.close();
      return;
    }

    closeWallpaperMenu();
  }
});
thoughtModalClose?.addEventListener('click', thoughtModalController.close);
thoughtEditButton?.addEventListener('click', thoughtModalController.startEditing);
thoughtCancelButton?.addEventListener('click', thoughtModalController.stopEditing);
thoughtDeleteButton?.addEventListener('click', thoughtModalController.deleteSelected);
thoughtEditForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  thoughtModalController.saveEdited();
});
thoughtModal?.addEventListener('click', (event) => {
  if (event.target === thoughtModal) {
    thoughtModalController.close();
  }
});
infoDialog?.addEventListener('click', (event) => {
  if (event.target === infoDialog) {
    closeInfoDialog();
  }
});
thoughtInput?.addEventListener('input', syncThoughtPreview);
pensieveThoughts?.addEventListener('click', (event) => {
  if (thoughtDragController.consumeSuppressedClick()) {
    event.preventDefault();
    return;
  }

  if (!stage?.classList.contains('is-mixing')) {
    return;
  }

  const thoughtElement = (event.target as HTMLElement).closest<HTMLElement>('.pensieve-thought');
  const thought = state.thoughts.find((item) => String(item.id) === thoughtElement?.dataset.thoughtId);

  if (thought) {
    thoughtModalController.open(thought);
  }
});
pensieveThoughts?.addEventListener('pointerdown', thoughtDragController.start);
document.addEventListener('pointermove', thoughtDragController.move);
document.addEventListener('pointerup', thoughtDragController.end);
document.addEventListener('pointercancel', thoughtDragController.cancel);
window.addEventListener('resize', releaseAnimationController.scheduleWandLightAnchorUpdate);
window.visualViewport?.addEventListener('resize', releaseAnimationController.scheduleWandLightAnchorUpdate);

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

  state.releasedThought = thoughtInput.value.trim();
  thoughtInput.disabled = true;
  stage?.classList.remove('just-released');
  stage?.classList.add('is-releasing');

  window.clearTimeout(state.releaseTimer);
  releaseAnimationController.animateRelease();
});

stage?.classList.remove(
  'is-capturing',
  'has-draft-thought',
  'is-releasing',
  'just-released',
  'just-cleared',
  'is-stirring',
  'is-clearing-thread',
  'is-clearing-thoughts',
  'is-mixing',
  'has-open-thought',
  'has-open-wallpaper-menu',
  'has-open-info',
  'has-completion',
);
captureScreen?.setAttribute('aria-hidden', 'true');
pensieveScene?.setAttribute('aria-hidden', 'true');
thoughtModal?.setAttribute('aria-hidden', 'true');
wallpaperMenu?.setAttribute('aria-hidden', 'true');
infoDialog?.setAttribute('aria-hidden', 'true');
completionScreen?.setAttribute('aria-hidden', 'true');
infoButton?.setAttribute('aria-expanded', 'false');
loadLanguage();
loadWallpaper();
loadSavedThoughtsIntoState();
