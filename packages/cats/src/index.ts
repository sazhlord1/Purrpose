export { Cat, resolveCatConfig, catName, CAT_STATES } from './Cat.js';
export type { CatProps } from './Cat.js';
export { POSE_BY_STATE, DEFAULT_EXPRESSION } from './poses.js';
export type { CatState, Expression, TailHint, PoseDef } from './poses.js';
export { LivingCat, quirkFor } from './LivingCat.js';
export type { LivingCatHandle, LivingCatProps } from './LivingCat.js';
export { CatScene } from './CatScene.js';
export type { CatSceneProps } from './CatScene.js';
export { CatWorld } from './CatWorld.js';
export type { CatWorldProps, WorldCat } from './CatWorld.js';
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
  rollSpeech,
  stepped,
} from './engine.js';
export type { MacroName, MicroName, ActivePhase, WeightedMacro } from './engine.js';
export { ANCHORS, homeXForProgress, SCENE_WIDTH, SCENE_HEIGHT, GROUND_Y } from './anchors.js';
export type { AnchorName } from './anchors.js';
export { LIVING_CSS, injectLivingStyle } from './livingCss.js';
export type { CatSeedConfig, CatId } from '@purrpose/shared';
