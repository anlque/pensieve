import { MIXING_ORBITS } from './config';
import type { TranslationKey } from './i18n';
import type { AppState } from './state';
import type { PensieveThought } from './types';

type ThoughtRendererDeps = {
  state: AppState;
  stage: HTMLElement | null;
  thoughtsContainer: HTMLElement | null;
  letGoButton: HTMLButtonElement | null;
  mixButton: HTMLButtonElement | null;
  t: (key: TranslationKey) => string;
};

const createThoughtElement = (thought: PensieveThought) => {
  const item = document.createElement('button');
  item.className = 'pensieve-thought';
  item.type = 'button';
  item.tabIndex = -1;
  item.dataset.thoughtId = String(thought.id);
  return item;
};

export const createThoughtRenderer = ({
  state,
  stage,
  thoughtsContainer,
  letGoButton,
  mixButton,
  t,
}: ThoughtRendererDeps) => {
  const updateActions = () => {
    const isBusy =
      stage?.classList.contains('is-releasing') ||
      stage?.classList.contains('is-clearing-thoughts') ||
      stage?.classList.contains('is-mixing');

    if (letGoButton) {
      letGoButton.hidden = state.thoughts.length === 0;
      letGoButton.disabled = state.thoughts.length === 0 || Boolean(isBusy);
    }

    if (mixButton) {
      mixButton.hidden = state.thoughts.length === 0;
      mixButton.disabled = state.thoughts.length === 0 || Boolean(isBusy);
    }
  };

  const updateInteractivity = () => {
    const isMixing = Boolean(stage?.classList.contains('is-mixing'));
    const isCapturing = Boolean(stage?.classList.contains('is-capturing'));

    thoughtsContainer?.querySelectorAll<HTMLButtonElement>('.pensieve-thought').forEach((item) => {
      item.tabIndex = isMixing ? 0 : -1;
      item.toggleAttribute('draggable', false);
      item.setAttribute('aria-disabled', String(!isMixing && !isCapturing));
    });
  };

  const syncElement = (item: HTMLElement, thought: PensieveThought) => {
    const mixingOrbit = MIXING_ORBITS[thought.id % MIXING_ORBITS.length];
    const cycle = Math.floor(thought.id / MIXING_ORBITS.length);
    const cycleOffset = (cycle % 3) - 1;

    item.classList.toggle('is-surfacing', thought.id === state.surfacingThoughtId);
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

  const render = () => {
    if (!thoughtsContainer) {
      return;
    }

    const currentItems = new Map(
      Array.from(thoughtsContainer.querySelectorAll<HTMLElement>('.pensieve-thought')).map((item) => [
        item.dataset.thoughtId,
        item,
      ]),
    );

    state.thoughts.forEach((thought) => {
      const key = String(thought.id);
      const item = currentItems.get(key) ?? createThoughtElement(thought);
      syncElement(item, thought);

      if (!item.isConnected) {
        thoughtsContainer.append(item);
      }

      currentItems.delete(key);
    });

    currentItems.forEach((item) => item.remove());

    stage?.classList.toggle('has-pensieve-thoughts', state.thoughts.length > 0);
    stage?.classList.toggle('has-many-thoughts', state.thoughts.length > 5);
    updateInteractivity();
    updateActions();
  };

  return {
    render,
    updateActions,
    updateInteractivity,
  };
};
