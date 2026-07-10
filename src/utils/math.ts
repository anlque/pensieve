export const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const easeInOut = (progress: number) =>
  progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

export const easeOut = (progress: number) => 1 - Math.pow(1 - progress, 3);

export const fadeBetween = (progress: number, start: number, end: number) => {
  const amount = clamp((progress - start) / (end - start), 0, 1);
  return amount * amount * (3 - 2 * amount);
};
