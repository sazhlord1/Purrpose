export { Cat, resolveCatConfig, catName, CAT_STATES } from './Cat.js';
export type { CatProps } from './Cat.js';
export { POSE_BY_STATE, DEFAULT_EXPRESSION } from './poses.js';
export type { CatState, Expression, TailHint, PoseDef } from './poses.js';
export { LivingCat, quirkFor } from './LivingCat.js';
export type { LivingCatHandle, LivingCatProps, LivingItems } from './LivingCat.js';
export { CatScene } from './CatScene.js';
export type { CatSceneProps } from './CatScene.js';
export {
  MACRO_TABLE,
  MICRO_WEIGHTS,
  IDLE_TIMING,
  SPEECH_CHANCE,
  fnv1a,
  mulberry32,
  seedFor,
  pickMacro,
  pickMicro,
  macroCooldownMs,
  durationFor,
  isTerminal,
  itemMacros,
  excludedMacros,
  rollSpeech,
  stepped,
} from './engine.js';
export type { MacroName, MicroName, ActivePhase, WeightedMacro, ItemBehaviors } from './engine.js';
export {
  LIFE_STAGES,
  SCENE_WIDTH,
  SCENE_HEIGHT,
  STAGE_SPAN,
  getLifeStage,
  stageInfo,
  msUntilNextStage,
  dayPeriod,
} from './stages.js';
export type { LifeStage, LifeStageInfo, DayPeriod } from './stages.js';
export { LIVING_CSS, injectLivingStyle } from './livingCss.js';
export type { CatSeedConfig, CatId } from '@purrpose/shared';
export { DetectiveGear, FACE_SPECS, ExprEyes, FaceOverlays, PawOverlay, Wearables } from './FaceKit.js';
export type { CatAction, CatWear, FaceSpec } from './FaceKit.js';
export { ItemArt, ItemIcon, ITEM_FOOTPRINT, ITEM_CSS } from './items.js';
export { AppIcon, IconGlyph, STAGE_ICON } from './icons.js';
export type { IconName } from './icons.js';
export { useGazeFollow } from './gaze.js';
export { useTextWidth } from './textFit.js';
