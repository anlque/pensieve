import {
  RELEASE_DURATION_MS,
  THREAD_CLEAR_DURATION_MS,
} from './config';
import type { AppState } from './state';
import {
  clamp,
  easeInOut,
  easeOut,
  fadeBetween,
  mix,
} from './utils/math';

type ReleaseAnimationControllerDeps = {
  state: AppState;
  stage: HTMLElement | null;
  thoughtInput: HTMLInputElement | null;
  thoughtForm: HTMLFormElement | null;
  thoughtCloud: HTMLElement | null;
  thoughtStream: HTMLElement | null;
  thoughtStreamSvg: SVGSVGElement | null;
  thoughtThreadPaths: SVGPathElement[];
  releaseTrail: HTMLElement | null;
  wandHand: HTMLElement | null;
  wandLight: HTMLElement | null;
  pensieveScene: HTMLElement | null;
  onReleaseFinish: () => void;
};

export const createReleaseAnimationController = ({
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
  onReleaseFinish,
}: ReleaseAnimationControllerDeps) => {
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

  const resetStyles = ({ keepThreadErased = false } = {}) => {
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

  const prepareDraftThread = () => {
    window.cancelAnimationFrame(state.thoughtThreadClearFrame);
    stage?.classList.remove('is-clearing-thread');
    thoughtStream?.removeAttribute('style');
    clearThoughtThreadErase();
  };

  const animateThoughtThreadClear = () => {
    window.cancelAnimationFrame(state.thoughtThreadClearFrame);
    updateWandLightAnchor();
    stage?.classList.add('is-clearing-thread');

    const startedAt = window.performance.now();

    const step = (now: number) => {
      const progress = clamp((now - startedAt) / THREAD_CLEAR_DURATION_MS, 0, 1);
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

  const cancelReleaseFrame = () => {
    window.cancelAnimationFrame(state.releaseFrame);
  };

  const animateRelease = () => {
    cancelReleaseFrame();

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

      onReleaseFinish();
    };

    state.releaseFrame = window.requestAnimationFrame(step);
  };

  return {
    animateRelease,
    animateThoughtThreadClear,
    cancelReleaseFrame,
    prepareDraftThread,
    resetStyles,
    scheduleWandLightAnchorUpdate,
    updateWandLightAnchor,
  };
};
