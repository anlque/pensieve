import type { AppState } from './state';
import { clamp } from './utils/math';

type ThoughtDragControllerDeps = {
  state: AppState;
  stage: HTMLElement | null;
  pensieveScene: HTMLElement | null;
  saveThoughts: () => void;
  closeThoughtModal: () => void;
  renderThoughts: () => void;
  updateActions: () => void;
  closeMixingView: () => void;
};

export const createThoughtDragController = ({
  state,
  stage,
  pensieveScene,
  saveThoughts,
  closeThoughtModal,
  renderThoughts,
  updateActions,
  closeMixingView,
}: ThoughtDragControllerDeps) => {
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
    if (!state.dragState) {
      return;
    }

    state.dragState.element.classList.remove('is-drag-source');
    state.dragState.ghost?.remove();
    stage?.classList.remove('is-dragging-thought', 'can-release-dragged-thought');
    state.dragState = null;
  };

  const removeThoughtByDrag = (thoughtIdToRemove: number, source: HTMLElement, ghost: HTMLElement | null) => {
    state.thoughts = state.thoughts.filter((thought) => thought.id !== thoughtIdToRemove);
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
    state.dragState = null;
    updateActions();

    window.setTimeout(() => {
      ghost?.remove();
      source.remove();
      renderThoughts();
      stage?.classList.remove('just-released-dragged-thought');
      state.suppressThoughtClick = false;

      if (state.thoughts.length === 0 && stage?.classList.contains('is-mixing')) {
        closeMixingView();
      }
    }, 1040);
  };

  const move = (event: PointerEvent) => {
    if (!state.dragState || event.pointerId !== state.dragState.pointerId) {
      return;
    }

    const deltaX = event.clientX - state.dragState.startX;
    const deltaY = event.clientY - state.dragState.startY;
    const distance = Math.hypot(deltaX, deltaY);

    if (!state.dragState.hasMoved && distance < 8) {
      return;
    }

    event.preventDefault();
    state.dragState.hasMoved = true;
    state.suppressThoughtClick = true;
    stage?.classList.add('is-dragging-thought');
    state.dragState.element.classList.add('is-drag-source');

    if (!state.dragState.ghost) {
      state.dragState.ghost = createThoughtDragGhost(state.dragState.element);
    }

    state.dragState.ghost.style.left = `${event.clientX - state.dragState.offsetX}px`;
    state.dragState.ghost.style.top = `${event.clientY - state.dragState.offsetY}px`;

    const isOutside = isPointOutsidePensieve(event.clientX, event.clientY);
    state.dragState.ghost.classList.toggle('is-drag-outside', isOutside);
    stage?.classList.toggle('can-release-dragged-thought', isOutside);
  };

  const end = (event: PointerEvent) => {
    if (!state.dragState || event.pointerId !== state.dragState.pointerId) {
      return;
    }

    const drag = state.dragState;

    try {
      drag.element.releasePointerCapture(drag.pointerId);
    } catch {
      // Pointer capture is a progressive enhancement here.
    }

    if (!drag.hasMoved) {
      resetDraggedThought();
      return;
    }

    event.preventDefault();

    if (isPointOutsidePensieve(event.clientX, event.clientY)) {
      removeThoughtByDrag(drag.thoughtId, drag.element, drag.ghost);
      return;
    }

    resetDraggedThought();
    window.setTimeout(() => {
      state.suppressThoughtClick = false;
    }, 0);
  };

  const cancel = () => {
    resetDraggedThought();
    window.setTimeout(() => {
      state.suppressThoughtClick = false;
    }, 0);
  };

  const start = (event: PointerEvent) => {
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
    state.dragState = {
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
    state.suppressThoughtClick = false;

    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      // Some browsers may not support capture on this element; document listeners still handle the drag.
    }
  };

  const consumeSuppressedClick = () => {
    if (!state.suppressThoughtClick) {
      return false;
    }

    state.suppressThoughtClick = false;
    return true;
  };

  return {
    cancel,
    consumeSuppressedClick,
    end,
    move,
    start,
  };
};
