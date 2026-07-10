import {
  MAX_THOUGHT_LENGTH,
  THOUGHT_POSITIONS,
} from './config';
import type { PensieveThought } from './types';

export const createPensieveThought = (text: string, id: number): PensieveThought => {
  const slot = THOUGHT_POSITIONS[id % THOUGHT_POSITIONS.length];
  const drift = id % 5;

  return {
    id,
    text: text.trim().slice(0, MAX_THOUGHT_LENGTH),
    x: slot.x,
    y: slot.y,
    scale: 0.82 + (drift % 3) * 0.08,
    delay: -(id % 6) * 0.65,
    duration: 8.8 + (id % 5) * 1.1,
    depth: 0.42 + (id % 4) * 0.16,
    orbitRadiusX: 152 + (id % 5) * 34,
    orbitDuration: 14 + (id % 5) * 1.8,
  };
};
