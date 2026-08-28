export const SCENE_WIDTH = 380;
export const SCENE_HEIGHT = 480;
export const GROUND_Y = 380;

export type AnchorName = 'bed' | 'scratcher' | 'toy' | 'shelf' | 'bowl' | 'cabinet';

export const ANCHORS: Record<AnchorName, number> = {
  bed: 190,
  scratcher: 190,
  toy: 190,
  shelf: 190,
  bowl: 190,
  cabinet: 190,
};

export function homeXForProgress(_progress: number): number {
  return 190;
}

export function getLifeStage(progress: number): 1 | 2 | 3 | 4 | 5 {
  const p = Math.max(0, Math.min(1, progress));
  if (p < 0.2) return 1;
  if (p < 0.4) return 2;
  if (p < 0.6) return 3;
  if (p < 0.8) return 4;
  return 5;
}
