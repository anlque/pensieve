import { MAX_THOUGHT_LENGTH } from './config';
import type { AppState } from './state';
import type { PensieveThought } from './types';

type ThoughtModalControllerDeps = {
  state: AppState;
  stage: HTMLElement | null;
  modal: HTMLElement | null;
  modalText: HTMLElement | null;
  editInput: HTMLInputElement | null;
  editButton: HTMLButtonElement | null;
  renderThoughts: () => void;
  saveThoughts: () => void;
  onEmpty: () => void;
};

export const createThoughtModalController = ({
  state,
  stage,
  modal,
  modalText,
  editInput,
  editButton,
  renderThoughts,
  saveThoughts,
  onEmpty,
}: ThoughtModalControllerDeps) => {
  const getSelectedThought = () => state.thoughts.find((thought) => thought.id === state.selectedThoughtId);

  const close = () => {
    stage?.classList.remove('has-open-thought');
    modal?.classList.remove('is-editing');
    modal?.setAttribute('aria-hidden', 'true');
    state.selectedThoughtId = null;

    if (modalText) {
      modalText.textContent = '';
    }

    if (editInput) {
      editInput.value = '';
    }
  };

  const open = (thought: PensieveThought) => {
    if (!modal || !modalText) {
      return;
    }

    state.selectedThoughtId = thought.id;
    modal.classList.remove('is-editing');
    modalText.textContent = thought.text;
    modal.removeAttribute('aria-hidden');
    stage?.classList.add('has-open-thought');
    window.setTimeout(() => editButton?.focus(), 120);
  };

  const isEditing = () => Boolean(modal?.classList.contains('is-editing'));

  const startEditing = () => {
    const thought = getSelectedThought();

    if (!thought || !modal || !editInput) {
      return;
    }

    editInput.value = thought.text;
    modal.classList.add('is-editing');
    window.setTimeout(() => {
      editInput.focus();
      editInput.select();
    }, 80);
  };

  const stopEditing = () => {
    modal?.classList.remove('is-editing');
    window.setTimeout(() => editButton?.focus(), 80);
  };

  const saveEdited = () => {
    const thought = getSelectedThought();
    const nextText = editInput?.value.trim() ?? '';

    if (!thought || !nextText) {
      editInput?.focus();
      return;
    }

    const limitedText = nextText.slice(0, MAX_THOUGHT_LENGTH);
    state.thoughts = state.thoughts.map((item) => (item.id === thought.id ? { ...item, text: limitedText } : item));
    renderThoughts();
    saveThoughts();

    if (modalText) {
      modalText.textContent = limitedText;
    }

    stopEditing();
  };

  const deleteSelected = () => {
    const thought = getSelectedThought();

    if (!thought) {
      return;
    }

    state.thoughts = state.thoughts.filter((item) => item.id !== thought.id);
    saveThoughts();
    close();
    renderThoughts();

    if (state.thoughts.length === 0) {
      onEmpty();
    }
  };

  return {
    close,
    deleteSelected,
    isEditing,
    open,
    saveEdited,
    startEditing,
    stopEditing,
  };
};
