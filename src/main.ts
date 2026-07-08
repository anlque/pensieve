import './styles.css';

const stage = document.querySelector<HTMLElement>('.app-stage');
const wandButton = document.querySelector<HTMLButtonElement>('.wand-button');
const backButton = document.querySelector<HTMLButtonElement>('.back-button');
const thoughtForm = document.querySelector<HTMLFormElement>('.thought-form');
const thoughtInput = document.querySelector<HTMLInputElement>('.thought-input');
const thoughtCloudText = document.querySelector<HTMLElement>('.thought-cloud-text');
const releaseDurationMs = 2600;

let releaseTimer = 0;

const openCaptureScreen = () => {
  stage?.classList.add('is-capturing');
  document.querySelector<HTMLElement>('[data-screen="capture"]')?.removeAttribute('aria-hidden');
  window.setTimeout(() => thoughtInput?.focus(), 260);
  document.body.dispatchEvent(new CustomEvent('pensieve:start-thought'));
};

const closeCaptureScreen = () => {
  window.clearTimeout(releaseTimer);
  stage?.classList.remove('is-capturing', 'has-draft-thought', 'is-releasing', 'just-released');
  document.querySelector<HTMLElement>('[data-screen="capture"]')?.setAttribute('aria-hidden', 'true');

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

  thoughtInput.disabled = true;
  stage?.classList.remove('just-released');
  stage?.classList.add('is-releasing');

  window.clearTimeout(releaseTimer);
  releaseTimer = window.setTimeout(finishRelease, releaseDurationMs);
});
