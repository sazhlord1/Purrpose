export type CatState =
  | 'INITIAL'
  | 'WAITING'
  | 'ANTICIPATING'
  | 'VERY_CLOSE'
  | 'SUCCESS'
  | 'FAILURE'
  | 'SLEEPING'
  | 'SATISFIED';

export const CAT_STATES: CatState[] = [
  'INITIAL',
  'WAITING',
  'ANTICIPATING',
  'VERY_CLOSE',
  'SUCCESS',
  'FAILURE',
  'SLEEPING',
  'SATISFIED',
];

export type Expression = 'neutral' | 'hopeful' | 'stare' | 'sad' | 'happyShut' | 'sleep';

export type TailHint = 'up' | 'limp' | 'brace';

export interface PoseDef {
  bodyD: string;
  detailLines?: string[];
  legLines?: string[];
  raisedArmLines?: string[];
  pawPoints?: Array<[number, number]>;
  hindPawsFlat?: Array<[number, number]>;
  head: { x: number; y: number; rot?: number };
  tail?: { x: number; y: number; hint: TailHint };
  integratedTail?: string;
}

export const POSE_BY_STATE: Record<CatState, PoseDef> = {
  INITIAL: {
    bodyD:
      'M110 88 C76 96 66 126 66 154 C66 166 74 172 110 172 C146 172 154 166 154 154 C154 126 144 96 110 88 Z',
    detailLines: ['M98 124 C104 136 116 136 122 124'],
    legLines: ['M96 140 L96 170', 'M124 140 L124 170'],
    pawPoints: [
      [96, 172],
      [124, 172],
    ],
    head: { x: 110, y: 74 },
    tail: { x: 68, y: 154, hint: 'up' },
  },
  WAITING: {
    bodyD:
      'M110 90 C75 98 65 128 65 156 C65 168 74 173 110 173 C146 173 155 168 155 156 C155 128 145 98 110 90 Z',
    detailLines: ['M96 126 C104 138 116 138 124 126'],
    legLines: ['M96 142 L96 171', 'M124 142 L124 171'],
    pawPoints: [
      [96, 172],
      [124, 172],
    ],
    head: { x: 110, y: 78 },
    tail: { x: 66, y: 156, hint: 'up' },
  },
  ANTICIPATING: {
    bodyD:
      'M110 92 C74 100 64 128 64 156 C64 168 74 173 110 173 C146 173 156 168 156 156 C156 128 146 100 110 92 Z',
    detailLines: ['M96 126 C104 138 116 138 124 126'],
    legLines: ['M96 142 L96 171'],
    raisedArmLines: ['M124 140 C128 148 132 156 130 166'],
    pawPoints: [
      [96, 172],
      [130, 168],
    ],
    head: { x: 110, y: 80, rot: 4 },
    tail: { x: 66, y: 156, hint: 'up' },
  },
  VERY_CLOSE: {
    bodyD:
      'M110 86 C74 94 64 124 64 154 C64 166 74 172 110 172 C146 172 156 166 156 154 C156 124 146 94 110 86 Z',
    detailLines: ['M98 120 C104 132 116 132 122 120'],
    raisedArmLines: ['M96 138 C90 148 88 156 92 166', 'M124 138 C130 148 132 156 128 166'],
    pawPoints: [
      [92, 168],
      [128, 168],
    ],
    head: { x: 110, y: 72, rot: -3 },
    tail: { x: 64, y: 154, hint: 'brace' },
  },
  SUCCESS: {
    bodyD:
      'M110 90 C76 98 66 128 66 156 C66 168 74 173 110 173 C146 173 154 168 154 156 C154 128 144 98 110 90 Z',
    detailLines: ['M96 126 C104 138 116 138 124 126'],
    legLines: ['M96 142 L96 171', 'M124 142 L124 171'],
    pawPoints: [
      [96, 172],
      [124, 172],
    ],
    head: { x: 110, y: 78, rot: 2 },
    tail: { x: 68, y: 156, hint: 'limp' },
  },
  FAILURE: {
    bodyD:
      'M110 86 C74 94 64 124 64 154 C64 166 74 172 110 172 C146 172 156 166 156 154 C156 124 146 94 110 86 Z',
    detailLines: ['M98 120 C104 132 116 132 122 120'],
    raisedArmLines: ['M92 136 C80 126 76 114 74 104', 'M128 136 C140 126 144 114 146 104'],
    pawPoints: [
      [74, 102],
      [146, 102],
    ],
    head: { x: 110, y: 70, rot: -2 },
    tail: { x: 64, y: 154, hint: 'up' },
  },
  SLEEPING: {
    bodyD:
      'M110 102 C68 102 54 128 54 154 C54 174 74 180 110 180 C146 180 166 174 166 154 C166 128 152 102 110 102 Z',
    integratedTail: 'M156 160 C162 148 158 136 146 130',
    detailLines: ['M88 152 C100 162 120 162 132 152'],
    head: { x: 110, y: 112, rot: 8 },
  },
  SATISFIED: {
    bodyD:
      'M110 90 C76 98 66 128 66 156 C66 168 74 173 110 173 C146 173 154 168 154 156 C154 128 144 98 110 90 Z',
    detailLines: ['M96 126 C104 138 116 138 124 126'],
    legLines: ['M96 142 L96 171'],
    raisedArmLines: ['M124 140 C132 132 134 120 128 112'],
    pawPoints: [
      [96, 172],
      [126, 110],
    ],
    head: { x: 110, y: 76 },
    tail: { x: 68, y: 156, hint: 'limp' },
  },
};

export const DEFAULT_EXPRESSION: Record<CatState, Expression> = {
  INITIAL: 'neutral',
  WAITING: 'hopeful',
  ANTICIPATING: 'hopeful',
  VERY_CLOSE: 'stare',
  SUCCESS: 'sad',
  FAILURE: 'happyShut',
  SLEEPING: 'sleep',
  SATISFIED: 'happyShut',
};
