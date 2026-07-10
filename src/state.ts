import type { DragState, PensieveThought } from './types';

export type AppState = {
  thoughtThreadLength: number;
  thoughtThreadClearFrame: number;
  hadDraftThought: boolean;
  releaseTimer: number;
  thoughtId: number;
  releasedThought: string;
  thoughts: PensieveThought[];
  surfacingThoughtId: number | null;
  surfacingTimer: number;
  releaseFrame: number;
  clearTimer: number;
  completionTimer: number;
  selectedThoughtId: number | null;
  dragState: DragState | null;
  suppressThoughtClick: boolean;
};

export const createAppState = (): AppState => ({
  thoughtThreadLength: 0,
  thoughtThreadClearFrame: 0,
  hadDraftThought: false,
  releaseTimer: 0,
  thoughtId: 0,
  releasedThought: '',
  thoughts: [],
  surfacingThoughtId: null,
  surfacingTimer: 0,
  releaseFrame: 0,
  clearTimer: 0,
  completionTimer: 0,
  selectedThoughtId: null,
  dragState: null,
  suppressThoughtClick: false,
});
