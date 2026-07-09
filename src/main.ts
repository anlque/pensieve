import './styles.css';

const stage = document.querySelector<HTMLElement>('.app-stage');
const wandButton = document.querySelector<HTMLButtonElement>('.wand-button');
const backButton = document.querySelector<HTMLButtonElement>('.back-button');
const letGoButton = document.querySelector<HTMLButtonElement>('.let-go-button');
const mixButton = document.querySelector<HTMLButtonElement>('.mix-button');
const mixCloseButton = document.querySelector<HTMLButtonElement>('.mix-close-button');
const thoughtForm = document.querySelector<HTMLFormElement>('.thought-form');
const thoughtInput = document.querySelector<HTMLInputElement>('.thought-input');
const thoughtModal = document.querySelector<HTMLElement>('.thought-modal');
const thoughtModalText = document.querySelector<HTMLElement>('.thought-modal-text');
const thoughtModalClose = document.querySelector<HTMLButtonElement>('.thought-modal-close');
const thoughtCloudText = document.querySelector<HTMLElement>('.thought-cloud-text');
const thoughtCloud = document.querySelector<HTMLElement>('.thought-cloud');
const thoughtStream = document.querySelector<HTMLElement>('.thought-stream');
const releaseTrail = document.querySelector<HTMLElement>('.release-trail');
const wandHand = document.querySelector<HTMLElement>('.wand-hand');
const wandLight = document.querySelector<HTMLElement>('.wand-light');
const pensieveThoughts = document.querySelector<HTMLElement>('.pensieve-thoughts');
const captureScreen = document.querySelector<HTMLElement>('[data-screen="capture"]');
const pensieveScene = document.querySelector<HTMLElement>('.pensieve-scene');
const stirZone = document.querySelector<HTMLElement>('.stir-zone');
const releaseDurationMs = 3000;
const clearThoughtsDurationMs = 1980;
const storageKey = 'pensieve.thoughts.v1';

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

let releaseTimer = 0;
let thoughtId = 0;
let releasedThought = '';
let thoughts: PensieveThought[] = [];
let stirTimer = 0;
let surfacingThoughtId: number | null = null;
let surfacingTimer = 0;
let releaseFrame = 0;
let clearTimer = 0;

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
  item.setAttribute('aria-label', `Показать мысль: ${thought.text}`);
  return item;
};

const updateThoughtInteractivity = () => {
  const isMixing = Boolean(stage?.classList.contains('is-mixing'));
  pensieveThoughts?.querySelectorAll<HTMLButtonElement>('.pensieve-thought').forEach((item) => {
    item.tabIndex = isMixing ? 0 : -1;
  });
};

const syncThoughtElement = (item: HTMLElement, thought: PensieveThought) => {
  item.classList.toggle('is-surfacing', thought.id === surfacingThoughtId);
  item.textContent = thought.text;
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

const clearSavedThoughts = () => {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Storage is a convenience; the app should still work without it.
  }
};

const setStirPosition = (event: PointerEvent) => {
  if (
    !pensieveScene ||
    !stirZone ||
    stage?.classList.contains('is-releasing') ||
    stage?.classList.contains('is-clearing-thoughts')
  ) {
    return;
  }

  const rect = stirZone.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  const clampedX = Math.min(92, Math.max(8, x));
  const clampedY = Math.min(86, Math.max(14, y));

  pensieveScene.style.setProperty('--stir-x', `${clampedX}%`);
  pensieveScene.style.setProperty('--stir-y', `${clampedY}%`);
  stage?.classList.add('is-stirring');

  window.clearTimeout(stirTimer);
  stirTimer = window.setTimeout(() => {
    stage?.classList.remove('is-stirring');
  }, 700);
};

const stopStirring = () => {
  window.clearTimeout(stirTimer);
  stirTimer = window.setTimeout(() => {
    stage?.classList.remove('is-stirring');
  }, 900);
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
      orbitRadiusX: 74 + (thoughtId % 4) * 28,
      orbitRadiusY: 28 + (thoughtId % 5) * 9,
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
            orbitRadiusX: 74 + (thoughtId % 4) * 28,
            orbitRadiusY: 28 + (thoughtId % 5) * 9,
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
  );
  captureScreen?.setAttribute('aria-hidden', 'true');
  pensieveScene?.setAttribute('aria-hidden', 'true');
  thoughtModal?.setAttribute('aria-hidden', 'true');
  updateThoughtInteractivity();
  updateLetGoButton();

  if (thoughtInput) {
    thoughtInput.value = '';
    thoughtInput.disabled = false;
  }

  if (thoughtCloudText) {
    thoughtCloudText.textContent = 'Нужно позвонить маме';
  }
};

const syncThoughtPreview = () => {
  const thought = thoughtInput?.value.trim() ?? '';

  stage?.classList.toggle('has-draft-thought', thought.length > 0);

  if (thoughtCloudText) {
    thoughtCloudText.textContent = thought || 'Нужно позвонить маме';
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
    thoughtCloudText.textContent = 'Нужно позвонить маме';
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
  thoughtModal?.setAttribute('aria-hidden', 'true');

  if (thoughtModalText) {
    thoughtModalText.textContent = '';
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

  thoughtModalText.textContent = thought.text;
  thoughtModal.removeAttribute('aria-hidden');
  stage?.classList.add('has-open-thought');
  window.setTimeout(() => thoughtModalClose?.focus(), 120);
};

wandButton?.addEventListener('click', openCaptureScreen);
backButton?.addEventListener('click', closeCaptureScreen);
letGoButton?.addEventListener('click', clearPensieveThoughts);
mixButton?.addEventListener('click', openMixingView);
mixCloseButton?.addEventListener('click', closeMixingView);
thoughtModalClose?.addEventListener('click', closeThoughtModal);
thoughtModal?.addEventListener('click', (event) => {
  if (event.target === thoughtModal) {
    closeThoughtModal();
  }
});
thoughtInput?.addEventListener('input', syncThoughtPreview);
pensieveThoughts?.addEventListener('click', (event) => {
  if (!stage?.classList.contains('is-mixing')) {
    return;
  }

  const thoughtElement = (event.target as HTMLElement).closest<HTMLElement>('.pensieve-thought');
  const thought = thoughts.find((item) => String(item.id) === thoughtElement?.dataset.thoughtId);

  if (thought) {
    openThoughtModal(thought);
  }
});
stirZone?.addEventListener('pointerdown', (event) => {
  stirZone.setPointerCapture(event.pointerId);
  setStirPosition(event);
});
stirZone?.addEventListener('pointermove', setStirPosition);
stirZone?.addEventListener('pointerup', stopStirring);
stirZone?.addEventListener('pointercancel', stopStirring);
stirZone?.addEventListener('pointerleave', stopStirring);

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
);
captureScreen?.setAttribute('aria-hidden', 'true');
pensieveScene?.setAttribute('aria-hidden', 'true');
thoughtModal?.setAttribute('aria-hidden', 'true');
loadSavedThoughts();
