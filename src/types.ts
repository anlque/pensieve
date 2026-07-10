export type PensieveThought = {
  id: number;
  text: string;
  x: number;
  y: number;
  scale: number;
  delay: number;
  duration: number;
  depth: number;
  orbitRadiusX: number;
  orbitDuration: number;
};

export type DragState = {
  thoughtId: number;
  element: HTMLElement;
  ghost: HTMLElement | null;
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  hasMoved: boolean;
};
