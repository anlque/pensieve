import type { AppState } from './state';

type ReleaseAnimationApi = {
  cancelReleaseFrame: () => void;
  resetStyles: (options?: { keepThreadErased?: boolean }) => void;
  scheduleWandLightAnchorUpdate: () => void;
};

type ScreenControllerDeps = {
  state: AppState;
  stage: HTMLElement | null;
  captureScreen: HTMLElement | null;
  pensieveScene: HTMLElement | null;
  thoughtInput: HTMLInputElement | null;
  thoughtCloudText: HTMLElement | null;
  thoughtModal: HTMLElement | null;
  infoDialog: HTMLElement | null;
  infoButton: HTMLButtonElement | null;
  releaseAnimation: ReleaseAnimationApi;
  t: (key: 'thought.preview') => string;
  hideCompletionScreen: () => void;
  closeWallpaperMenu: () => void;
  closeThoughtModal: () => void;
  updateThoughtInteractivity: () => void;
  updateActions: () => void;
  getThoughtCount: () => number;
};

const CAPTURE_FOCUS_DELAY_MS = 260;
const MIXING_FOCUS_RETURN_DELAY_MS = 180;

export type ScreenController = ReturnType<typeof createScreenController>;

export const createScreenController = ({
  state,
  stage,
  captureScreen,
  pensieveScene,
  thoughtInput,
  thoughtCloudText,
  thoughtModal,
  infoDialog,
  infoButton,
  releaseAnimation,
  t,
  hideCompletionScreen,
  closeWallpaperMenu,
  closeThoughtModal,
  updateThoughtInteractivity,
  updateActions,
  getThoughtCount,
}: ScreenControllerDeps) => {
  const openCaptureScreen = () => {
    hideCompletionScreen();
    state.hadDraftThought = false;
    stage?.classList.add('is-capturing');
    captureScreen?.removeAttribute('aria-hidden');
    releaseAnimation.scheduleWandLightAnchorUpdate();
    window.setTimeout(() => thoughtInput?.focus(), CAPTURE_FOCUS_DELAY_MS);
    document.body.dispatchEvent(new CustomEvent('pensieve:start-thought'));
  };

  const closeCaptureScreen = () => {
    window.clearTimeout(state.releaseTimer);
    window.clearTimeout(state.clearTimer);
    hideCompletionScreen();
    releaseAnimation.cancelReleaseFrame();
    releaseAnimation.resetStyles();
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
    updateActions();

    if (thoughtInput) {
      thoughtInput.value = '';
      thoughtInput.disabled = false;
    }

    state.hadDraftThought = false;

    if (thoughtCloudText) {
      thoughtCloudText.textContent = t('thought.preview');
    }
  };

  const openMixingView = () => {
    if (
      getThoughtCount() === 0 ||
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
    updateActions();
    thoughtInput?.blur();
  };

  const closeMixingView = () => {
    closeThoughtModal();
    stage?.classList.remove('is-mixing');
    pensieveScene?.setAttribute('aria-hidden', 'true');
    updateThoughtInteractivity();
    updateActions();
    window.setTimeout(() => thoughtInput?.focus(), MIXING_FOCUS_RETURN_DELAY_MS);
  };

  return {
    closeCaptureScreen,
    closeMixingView,
    openCaptureScreen,
    openMixingView,
  };
};
