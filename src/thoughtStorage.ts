import {
  MAX_STORED_THOUGHTS,
  STORAGE_KEYS,
} from './config';
import { createPensieveThought } from './thoughts';
import type { PensieveThought } from './types';

export type SavedThoughtsState = {
  thoughts: PensieveThought[];
  nextThoughtId: number;
};

export const saveThoughts = (thoughts: PensieveThought[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEYS.thoughts, JSON.stringify(thoughts.map((thought) => thought.text)));
  } catch {
    // Storage is a convenience; the app should still work without it.
  }
};

export const clearSavedThoughts = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.thoughts);
  } catch {
    // Storage is a convenience; the app should still work without it.
  }
};

export const loadSavedThoughts = (): SavedThoughtsState => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEYS.thoughts);

    if (!saved) {
      return { thoughts: [], nextThoughtId: 0 };
    }

    const savedTexts = JSON.parse(saved);

    if (!Array.isArray(savedTexts)) {
      return { thoughts: [], nextThoughtId: 0 };
    }

    const thoughts = savedTexts
      .filter((text): text is string => typeof text === 'string' && text.trim().length > 0)
      .slice(0, MAX_STORED_THOUGHTS)
      .map((text, index) => createPensieveThought(text, index));

    return {
      thoughts,
      nextThoughtId: thoughts.length,
    };
  } catch {
    return { thoughts: [], nextThoughtId: 0 };
  }
};
