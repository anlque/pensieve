import './styles.css';

const stage = document.querySelector<HTMLElement>('.app-stage');
const wandButton = document.querySelector<HTMLButtonElement>('.wand-button');
const backButton = document.querySelector<HTMLButtonElement>('.back-button');
const thoughtForm = document.querySelector<HTMLFormElement>('.thought-form');
const thoughtInput = document.querySelector<HTMLInputElement>('.thought-input');
const thoughtCloudText = document.querySelector<HTMLElement>('.thought-cloud-text');
const pensieveThoughts = document.querySelector<HTMLElement>('.pensieve-thoughts');
const captureScreen = document.querySelector<HTMLElement>('[data-screen="capture"]');
const pensieveScene = document.querySelector<HTMLElement>('.pensieve-scene');
const stirZone = document.querySelector<HTMLElement>('.stir-zone');
const releaseDurationMs = 2600;
const maxVisibleThoughts = 5;
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
};

let releaseTimer = 0;
let thoughtId = 0;
let releasedThought = '';
let visibleCycleIndex = 0;
let thoughts: PensieveThought[] = [];
let stirTimer = 0;

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

const getVisibleThoughts = () => {
  if (thoughts.length <= maxVisibleThoughts) {
    return thoughts;
  }

  return Array.from({ length: maxVisibleThoughts }, (_, index) => {
    const thoughtIndex = (visibleCycleIndex + index) % thoughts.length;
    return thoughts[thoughtIndex];
  });
};

const renderPensieveThoughts = () => {
  if (!pensieveThoughts) {
    return;
  }

  const visibleThoughts = getVisibleThoughts();
  pensieveThoughts.replaceChildren(
    ...visibleThoughts.map((thought) => {
      const item = document.createElement('span');
      item.className = 'pensieve-thought';
      item.textContent = thought.text;
      item.style.setProperty('--thought-x', `${thought.x}%`);
      item.style.setProperty('--thought-y', `${thought.y}%`);
      item.style.setProperty('--thought-scale', String(thought.scale));
      item.style.setProperty('--thought-delay', `${thought.delay}s`);
      item.style.setProperty('--thought-duration', `${thought.duration}s`);
      item.style.setProperty('--thought-depth', String(thought.depth));
      return item;
    }),
  );

  stage?.classList.toggle('has-pensieve-thoughts', thoughts.length > 0);
  stage?.classList.toggle('has-many-thoughts', thoughts.length > maxVisibleThoughts);
};

const saveThoughts = () => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(thoughts.map((thought) => thought.text)));
  } catch {
    // Storage is a convenience; the app should still work without it.
  }
};

const setStirPosition = (event: PointerEvent) => {
  if (!pensieveScene || !stirZone || stage?.classList.contains('is-releasing')) {
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

const addThoughtToPensieve = (text: string) => {
  const slot = thoughtPositions[thoughtId % thoughtPositions.length];
  const drift = thoughtId % 5;

  thoughts = [
    ...thoughts,
    {
      id: thoughtId,
      text,
      x: slot.x,
      y: slot.y,
      scale: 0.82 + (drift % 3) * 0.08,
      delay: -(thoughtId % 6) * 0.65,
      duration: 8.8 + (thoughtId % 5) * 1.1,
      depth: 0.42 + (thoughtId % 4) * 0.16,
    },
  ];

  thoughtId += 1;
  visibleCycleIndex = Math.max(0, thoughts.length - maxVisibleThoughts);
  renderPensieveThoughts();
  saveThoughts();
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
          },
        ];
        thoughtId += 1;
      });

    visibleCycleIndex = Math.max(0, thoughts.length - maxVisibleThoughts);
    renderPensieveThoughts();
  } catch {
    renderPensieveThoughts();
  }
};

window.setInterval(() => {
  if (thoughts.length <= maxVisibleThoughts) {
    return;
  }

  visibleCycleIndex = (visibleCycleIndex + 1) % thoughts.length;
  renderPensieveThoughts();
}, 5200);

const openCaptureScreen = () => {
  stage?.classList.add('is-capturing');
  captureScreen?.removeAttribute('aria-hidden');
  window.setTimeout(() => thoughtInput?.focus(), 260);
  document.body.dispatchEvent(new CustomEvent('pensieve:start-thought'));
};

const closeCaptureScreen = () => {
  window.clearTimeout(releaseTimer);
  stage?.classList.remove('is-capturing', 'has-draft-thought', 'is-releasing', 'just-released');
  captureScreen?.setAttribute('aria-hidden', 'true');

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
  if (releasedThought) {
    addThoughtToPensieve(releasedThought);
    releasedThought = '';
  }

  stage?.classList.remove('is-releasing', 'has-draft-thought');
  stage?.classList.add('just-released');

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

wandButton?.addEventListener('click', openCaptureScreen);
backButton?.addEventListener('click', closeCaptureScreen);
thoughtInput?.addEventListener('input', syncThoughtPreview);
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

  if (stage?.classList.contains('is-releasing')) {
    return;
  }

  releasedThought = thoughtInput.value.trim();
  thoughtInput.disabled = true;
  stage?.classList.remove('just-released');
  stage?.classList.add('is-releasing');

  window.clearTimeout(releaseTimer);
  releaseTimer = window.setTimeout(finishRelease, releaseDurationMs);
});

stage?.classList.remove('is-capturing', 'has-draft-thought', 'is-releasing', 'just-released', 'is-stirring');
captureScreen?.setAttribute('aria-hidden', 'true');
loadSavedThoughts();
