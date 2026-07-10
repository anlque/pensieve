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
  RELEASE_DURATION_MS,
  STORAGE_KEYS,
  THREAD_CLEAR_DURATION_MS,
  THOUGHT_SURFACE_DURATION_MS,
  type LanguageName,
  type WallpaperName,
} from './config';
import { isLanguageName, isWallpaperName } from './guards';
import { loadLanguage, saveLanguage, t } from './localization';
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
import {
  clamp,
  easeInOut,
  easeOut,
  fadeBetween,
  mix,
} from './utils/math';

const state = createAppState();
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

const setThoughtThreadErase = (amount: number, direction: 'release' | 'clear' = 'release') => {
  thoughtThreadPaths.forEach((path) => {
    const length = state.thoughtThreadLength || path.getTotalLength();
    const offset = direction === 'release' ? -amount * length : amount * length;
    path.style.strokeDasharray = `${length.toFixed(2)} ${length.toFixed(2)}`;
    path.style.strokeDashoffset = `${offset.toFixed(2)}`;
  });
};

const clearThoughtThreadErase = () => {
  thoughtThreadPaths.forEach((path) => {
    path.style.strokeDasharray = '';
    path.style.strokeDashoffset = '';
  });
};

const resetReleaseStyles = ({ keepThreadErased = false } = {}) => {
  window.cancelAnimationFrame(state.thoughtThreadClearFrame);
  stage?.classList.remove('is-clearing-thread');

  [thoughtCloud, thoughtStream, releaseTrail, wandHand, wandLight].forEach((element) => {
    element?.removeAttribute('style');
  });

  if (keepThreadErased) {
    setThoughtThreadErase(1);
    return;
  }

  clearThoughtThreadErase();
};

const animateThoughtThreadClear = () => {
  window.cancelAnimationFrame(state.thoughtThreadClearFrame);
  updateWandLightAnchor();
  stage?.classList.add('is-clearing-thread');

  const startedAt = window.performance.now();
  const durationMs = THREAD_CLEAR_DURATION_MS;

  const step = (now: number) => {
    const progress = clamp((now - startedAt) / durationMs, 0, 1);
    const erase = easeInOut(progress);
    const fade = fadeBetween(progress, 0.62, 1);

    if (thoughtStream) {
      thoughtStream.style.opacity = String(0.72 * (1 - fade));
      thoughtStream.style.transform = 'scaleY(1)';
      thoughtStream.style.filter = `blur(${mix(0.2, 1.05, erase).toFixed(2)}px) brightness(${mix(1.08, 0.92, fade).toFixed(2)})`;
    }

    setThoughtThreadErase(erase, 'clear');

    if (progress < 1) {
      state.thoughtThreadClearFrame = window.requestAnimationFrame(step);
      return;
    }

    stage?.classList.remove('is-clearing-thread');
    thoughtStream?.removeAttribute('style');
    setThoughtThreadErase(1, 'clear');
  };

  state.thoughtThreadClearFrame = window.requestAnimationFrame(step);
};

const updateWandLightAnchor = () => {
  if (!stage || !wandLight) {
    return null;
  }

  const stageRect = stage.getBoundingClientRect();
  const lightRect = wandLight.getBoundingClientRect();
  const lightX = lightRect.left + lightRect.width / 2 - stageRect.left;
  const lightY = lightRect.top + lightRect.height / 2 - stageRect.top;
  const inputRect = thoughtInput?.getBoundingClientRect() ?? thoughtForm?.getBoundingClientRect();
  const streamStartX = inputRect ? inputRect.left + inputRect.width / 2 - stageRect.left : lightX;
  const streamStartY = inputRect ? inputRect.bottom - stageRect.top + 2 : lightY - 230;
  const streamPad = 28;
  const streamLeft = Math.min(streamStartX, lightX) - streamPad;
  const streamTop = Math.min(streamStartY, lightY) - streamPad;
  const streamWidth = Math.max(Math.abs(lightX - streamStartX) + streamPad * 2, 56);
  const streamHeight = Math.max(Math.abs(lightY - streamStartY) + streamPad * 2, 120);
  const startX = streamStartX - streamLeft;
  const startY = streamStartY - streamTop;
  const endX = lightX - streamLeft;
  const endY = lightY - streamTop;
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const beamPath = [
    `M ${startX.toFixed(2)} ${startY.toFixed(2)}`,
    `C ${(startX + deltaX * 0.1).toFixed(2)} ${(startY + deltaY * 0.36).toFixed(2)}`,
    `${(endX - deltaX * 0.08).toFixed(2)} ${(endY - deltaY * 0.34).toFixed(2)}`,
    `${endX.toFixed(2)} ${endY.toFixed(2)}`,
  ].join(' ');
  const bowlRect = pensieveScene?.getBoundingClientRect();
  const bowlCenterX = bowlRect ? bowlRect.left + bowlRect.width / 2 - stageRect.left : stageRect.width / 2;
  const bowlCenterY = bowlRect ? bowlRect.top + bowlRect.height * 0.48 - stageRect.top : lightY + 190;

  stage.style.setProperty('--measured-wand-light-x', `${lightX.toFixed(2)}px`);
  stage.style.setProperty('--measured-wand-light-y', `${lightY.toFixed(2)}px`);
  stage.style.setProperty('--measured-thought-stream-left', `${streamLeft.toFixed(2)}px`);
  stage.style.setProperty('--measured-thought-stream-top', `${streamTop.toFixed(2)}px`);
  stage.style.setProperty('--measured-thought-stream-width', `${streamWidth.toFixed(2)}px`);
  stage.style.setProperty('--measured-thought-stream-height', `${streamHeight.toFixed(2)}px`);
  stage.style.setProperty('--thought-release-target-x', `${(bowlCenterX - lightX).toFixed(2)}px`);
  stage.style.setProperty('--thought-release-target-y', `${(bowlCenterY - lightY).toFixed(2)}px`);
  thoughtStreamSvg?.setAttribute('viewBox', `0 0 ${streamWidth.toFixed(2)} ${streamHeight.toFixed(2)}`);
  thoughtThreadPaths.forEach((path) => path.setAttribute('d', beamPath));
  state.thoughtThreadLength = thoughtThreadPaths[0]?.getTotalLength() ?? 0;

  return {
    targetX: bowlCenterX - lightX,
    targetY: bowlCenterY - lightY,
  };
};

const scheduleWandLightAnchorUpdate = () => {
  window.requestAnimationFrame(() => {
    updateWandLightAnchor();
  });
};

const animateRelease = () => {
  window.cancelAnimationFrame(state.releaseFrame);

  const startedAt = window.performance.now();
  const releaseTarget = updateWandLightAnchor() ?? {
    targetX: -Math.min(92, window.innerWidth * 0.14),
    targetY: 192,
  };

  const step = (now: number) => {
    const progress = clamp((now - startedAt) / RELEASE_DURATION_MS, 0, 1);
    const travel = easeInOut(progress);
    const dissolve = fadeBetween(progress, 0.7, 1);
    const birth = easeOut(fadeBetween(progress, 0, 0.3));

    const cloudX = mix(-12, releaseTarget.targetX, travel) + Math.sin(progress * Math.PI) * 10;
    const cloudY = mix(10, releaseTarget.targetY, travel) - Math.sin(progress * Math.PI) * 14;
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

    const threadErase = easeInOut(fadeBetween(progress, 0.02, 0.18));
    const threadOpacity = 0.66 * (1 - fadeBetween(progress, 0.2, 0.3)) * Math.pow(1 - dissolve, 0.35);
    const threadBlur = mix(0.2, 1.2, threadErase);

    const trailOpacity = Math.sin(progress * Math.PI) * 0.22;
    const trailY = mix(-8, 58, travel);
    const trailScale = mix(0.56, 0.9, Math.sin(progress * Math.PI));

    const glowScale = 1 + Math.sin(progress * Math.PI) * 0.38;

    if (thoughtCloud) {
      thoughtCloud.style.opacity = String(cloudOpacity);
      thoughtCloud.style.transform = `translate3d(calc(-50% + ${cloudX.toFixed(2)}px), calc(-50% + ${cloudY.toFixed(2)}px), 0) scale(${cloudScale.toFixed(3)})`;
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
      thoughtStream.style.transform = 'scaleY(1)';
      thoughtStream.style.filter = `blur(${threadBlur.toFixed(2)}px) brightness(${mix(1, 1.18, threadErase).toFixed(2)})`;
      setThoughtThreadErase(threadErase);
    }

    if (releaseTrail) {
      releaseTrail.style.opacity = String(trailOpacity);
      releaseTrail.style.transform = `translateX(-50%) translateY(${trailY.toFixed(2)}px) scale(${trailScale.toFixed(3)}) rotate(${mix(-4, 5, travel).toFixed(2)}deg)`;
      releaseTrail.style.filter = `blur(${mix(1.1, 1.6, progress).toFixed(2)}px)`;
    }

    if (progress < 1) {
      state.releaseFrame = window.requestAnimationFrame(step);
      return;
    }

    finishRelease();
  };

  state.releaseFrame = window.requestAnimationFrame(step);
};

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

const openCaptureScreen = () => {
  hideCompletionScreen();
  state.hadDraftThought = false;
  stage?.classList.add('is-capturing');
  captureScreen?.removeAttribute('aria-hidden');
  scheduleWandLightAnchorUpdate();
  window.setTimeout(() => thoughtInput?.focus(), 260);
  document.body.dispatchEvent(new CustomEvent('pensieve:start-thought'));
};

const closeCaptureScreen = () => {
  window.clearTimeout(state.releaseTimer);
  window.clearTimeout(state.clearTimer);
  hideCompletionScreen();
  window.cancelAnimationFrame(state.releaseFrame);
  resetReleaseStyles();
  stage?.classList.remove(
    'is-capturing',
    'has-draft-thought',
    'is-releasing',
    'just-released',
    'just-cleared',
    'is-clearing-thread',
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

  state.hadDraftThought = false;

  if (thoughtCloudText) {
    thoughtCloudText.textContent = t('thought.preview');
  }
};

const syncThoughtPreview = () => {
  const thought = thoughtInput?.value.trim() ?? '';
  const hasThought = thought.length > 0;
  const isReleasing = stage?.classList.contains('is-releasing') ?? false;

  stage?.classList.toggle('has-draft-thought', hasThought);
  updateWandLightAnchor();

  if (hasThought && !isReleasing) {
    window.cancelAnimationFrame(state.thoughtThreadClearFrame);
    stage?.classList.remove('is-clearing-thread');
    thoughtStream?.removeAttribute('style');
    clearThoughtThreadErase();
  }

  if (!hasThought && state.hadDraftThought && !isReleasing) {
    animateThoughtThreadClear();
  }

  state.hadDraftThought = hasThought;

  if (thoughtCloudText) {
    thoughtCloudText.textContent = thought || t('thought.preview');
  }
};

const finishRelease = () => {
  window.cancelAnimationFrame(state.releaseFrame);

  if (state.releasedThought) {
    addThoughtToPensieve(state.releasedThought);
    state.releasedThought = '';
  }

  stage?.classList.remove('is-releasing', 'has-draft-thought');
  stage?.classList.add('just-released');
  resetReleaseStyles({ keepThreadErased: true });
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

const openMixingView = () => {
  if (
    state.thoughts.length === 0 ||
    stage?.classList.contains('is-releasing') ||
    stage?.classList.contains('is-clearing-thoughts')
  ) {
    return;
  }

  stage?.classList.remove('has-draft-thought', 'just-released', 'just-cleared', 'is-stirring');
  hideCompletionScreen();
  closeWallpaperMenu();
  stage?.classList.add('is-mixing');
  pensieveScene?.removeAttribute('aria-hidden');
  updateThoughtInteractivity();
  updateLetGoButton();

  if (thoughtInput) {
    thoughtInput.blur();
  }
};

const closeMixingView = () => {
  thoughtModalController.close();
  stage?.classList.remove('is-mixing');
  pensieveScene?.setAttribute('aria-hidden', 'true');
  updateThoughtInteractivity();
  updateLetGoButton();
  window.setTimeout(() => thoughtInput?.focus(), 180);
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
window.addEventListener('resize', scheduleWandLightAnchorUpdate);
window.visualViewport?.addEventListener('resize', scheduleWandLightAnchorUpdate);

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
  animateRelease();
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
