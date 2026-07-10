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
  MAX_STORED_THOUGHTS,
  MAX_THOUGHT_LENGTH,
  MIXING_ORBITS,
  RELEASE_DURATION_MS,
  STORAGE_KEYS,
  THREAD_CLEAR_DURATION_MS,
  THOUGHT_SURFACE_DURATION_MS,
  type LanguageName,
  type WallpaperName,
} from './config';
import { isLanguageName, isWallpaperName } from './guards';
import { loadLanguage, saveLanguage, t } from './localization';
import { createPensieveThought } from './thoughts';
import type { DragState, PensieveThought } from './types';
import { compressWallpaperImage } from './wallpaper';
import {
  clamp,
  easeInOut,
  easeOut,
  fadeBetween,
  mix,
} from './utils/math';

let thoughtThreadLength = 0;
let thoughtThreadClearFrame = 0;
let hadDraftThought = false;

let releaseTimer = 0;
let thoughtId = 0;
let releasedThought = '';
let thoughts: PensieveThought[] = [];
let surfacingThoughtId: number | null = null;
let surfacingTimer = 0;
let releaseFrame = 0;
let clearTimer = 0;
let completionTimer = 0;
let selectedThoughtId: number | null = null;
let dragState: DragState | null = null;
let suppressThoughtClick = false;

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
  window.clearTimeout(completionTimer);
  stage?.classList.remove('has-completion');
  completionScreen?.setAttribute('aria-hidden', 'true');
};

const showCompletionScreen = () => {
  window.clearTimeout(completionTimer);
  stage?.classList.add('has-completion');
  completionScreen?.setAttribute('aria-hidden', 'false');

  completionTimer = window.setTimeout(() => {
    stage?.classList.remove('has-completion');
    completionScreen?.setAttribute('aria-hidden', 'true');
  }, 4200);
};

const openInfoDialog = () => {
  closeWallpaperMenu();
  closeThoughtModal();
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
  const mixingOrbit = MIXING_ORBITS[thought.id % MIXING_ORBITS.length];
  const cycle = Math.floor(thought.id / MIXING_ORBITS.length);
  const cycleOffset = (cycle % 3) - 1;

  item.classList.toggle('is-surfacing', thought.id === surfacingThoughtId);
  item.textContent = thought.text;
  item.setAttribute('aria-label', `${t('modal.label')}: ${thought.text}`);
  item.style.setProperty('--thought-x', `${thought.x}%`);
  item.style.setProperty('--thought-y', `${thought.y}%`);
  item.style.setProperty('--thought-scale', String(thought.scale));
  item.style.setProperty('--thought-delay', `${thought.delay}s`);
  item.style.setProperty('--thought-duration', `${thought.duration}s`);
  item.style.setProperty('--thought-depth', String(thought.depth));
  item.style.setProperty('--orbit-radius-x', `${thought.orbitRadiusX}px`);
  item.style.setProperty('--orbit-duration', `${thought.orbitDuration}s`);
  item.style.setProperty('--mixing-radius-x', `${mixingOrbit.radiusX + cycleOffset * 14}px`);
  item.style.setProperty('--mixing-radius-y', `${mixingOrbit.radiusY + cycleOffset * 6}px`);
  item.style.setProperty('--mixing-orbit-duration', `${thought.orbitDuration * mixingOrbit.speed}s`);
  item.style.setProperty('--mixing-phase-delay', `${-(thought.id % MIXING_ORBITS.length) * 1.42 - cycle * 0.76}s`);
};

const renderPensieveThoughts = () => {
  if (!pensieveThoughts) {
    return;
  }

  const thoughtsContainer = pensieveThoughts;
  const currentItems = new Map(
    Array.from(thoughtsContainer.querySelectorAll<HTMLElement>('.pensieve-thought')).map((item) => [
      item.dataset.thoughtId,
      item,
    ]),
  );

  thoughts.forEach((thought) => {
    const key = String(thought.id);
    const item = currentItems.get(key) ?? createThoughtElement(thought);
    syncThoughtElement(item, thought);

    if (!item.isConnected) {
      thoughtsContainer.append(item);
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
    window.localStorage.setItem(STORAGE_KEYS.thoughts, JSON.stringify(thoughts.map((thought) => thought.text)));
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

  const releaseInset = 18;
  return (
    x < rect.left + releaseInset ||
    x > rect.right - releaseInset ||
    y < rect.top + releaseInset ||
    y > rect.bottom - releaseInset
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

  if (ghost && pensieveScene) {
    const ghostRect = ghost.getBoundingClientRect();
    const bowlRect = pensieveScene.getBoundingClientRect();
    const ghostCenterX = ghostRect.left + ghostRect.width / 2;
    const ghostCenterY = ghostRect.top + ghostRect.height / 2;
    const bowlCenterX = bowlRect.left + bowlRect.width / 2;
    const bowlCenterY = bowlRect.top + bowlRect.height / 2;

    ghost.style.setProperty('--release-drift-x', `${clamp((ghostCenterX - bowlCenterX) * 0.18, -34, 34).toFixed(1)}px`);
    ghost.style.setProperty('--release-drift-y', `${clamp((ghostCenterY - bowlCenterY) * 0.12 - 34, -58, -18).toFixed(1)}px`);
  }

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
  }, 1040);
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
    window.localStorage.removeItem(STORAGE_KEYS.thoughts);
  } catch {
    // Storage is a convenience; the app should still work without it.
  }
};

const setThoughtThreadErase = (amount: number, direction: 'release' | 'clear' = 'release') => {
  thoughtThreadPaths.forEach((path) => {
    const length = thoughtThreadLength || path.getTotalLength();
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
  window.cancelAnimationFrame(thoughtThreadClearFrame);
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
  window.cancelAnimationFrame(thoughtThreadClearFrame);
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
      thoughtThreadClearFrame = window.requestAnimationFrame(step);
      return;
    }

    stage?.classList.remove('is-clearing-thread');
    thoughtStream?.removeAttribute('style');
    setThoughtThreadErase(1, 'clear');
  };

  thoughtThreadClearFrame = window.requestAnimationFrame(step);
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
  thoughtThreadLength = thoughtThreadPaths[0]?.getTotalLength() ?? 0;

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
  window.cancelAnimationFrame(releaseFrame);

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
      releaseFrame = window.requestAnimationFrame(step);
      return;
    }

    finishRelease();
  };

  releaseFrame = window.requestAnimationFrame(step);
};

const addThoughtToPensieve = (text: string) => {
  const id = thoughtId;

  thoughts = [
    ...thoughts,
    createPensieveThought(text, id),
  ];

  thoughtId += 1;
  surfacingThoughtId = id;
  renderPensieveThoughts();
  saveThoughts();

  window.clearTimeout(surfacingTimer);
  surfacingTimer = window.setTimeout(() => {
    surfacingThoughtId = null;
    renderPensieveThoughts();
  }, THOUGHT_SURFACE_DURATION_MS);
};

const loadSavedThoughts = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEYS.thoughts);

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
      .slice(0, MAX_STORED_THOUGHTS)
      .forEach((text) => {
        thoughts = [
          ...thoughts,
          createPensieveThought(text, thoughtId),
        ];
        thoughtId += 1;
      });

    renderPensieveThoughts();
  } catch {
    renderPensieveThoughts();
  }
};

const openCaptureScreen = () => {
  hideCompletionScreen();
  hadDraftThought = false;
  stage?.classList.add('is-capturing');
  captureScreen?.removeAttribute('aria-hidden');
  scheduleWandLightAnchorUpdate();
  window.setTimeout(() => thoughtInput?.focus(), 260);
  document.body.dispatchEvent(new CustomEvent('pensieve:start-thought'));
};

const closeCaptureScreen = () => {
  window.clearTimeout(releaseTimer);
  window.clearTimeout(clearTimer);
  hideCompletionScreen();
  window.cancelAnimationFrame(releaseFrame);
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

  hadDraftThought = false;

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
    window.cancelAnimationFrame(thoughtThreadClearFrame);
    stage?.classList.remove('is-clearing-thread');
    thoughtStream?.removeAttribute('style');
    clearThoughtThreadErase();
  }

  if (!hasThought && hadDraftThought && !isReleasing) {
    animateThoughtThreadClear();
  }

  hadDraftThought = hasThought;

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
  resetReleaseStyles({ keepThreadErased: true });
  hadDraftThought = false;
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
  hideCompletionScreen();
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
    showCompletionScreen();
    updateLetGoButton();

    window.setTimeout(() => stage?.classList.remove('just-cleared'), 920);
  }, CLEAR_THOUGHTS_DURATION_MS);
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
  const editInput = thoughtEditInput;
  window.setTimeout(() => {
    editInput.focus();
    editInput.select();
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

  thoughts = thoughts.map((item) =>
    item.id === thought.id ? { ...item, text: nextText.slice(0, MAX_THOUGHT_LENGTH) } : item,
  );
  renderPensieveThoughts();
  saveThoughts();

  if (thoughtModalText) {
    thoughtModalText.textContent = nextText.slice(0, MAX_THOUGHT_LENGTH);
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
loadSavedThoughts();
