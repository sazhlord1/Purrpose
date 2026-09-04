export const COMMITMENT_STATUSES = ['ACTIVE', 'COMPLETED', 'FAILED'] as const;
export type CommitmentStatus = (typeof COMMITMENT_STATUSES)[number];

export const CONSEQUENCE_TYPES = ['MEALS', 'DRY_FOOD', 'VET_CARE'] as const;
export type ConsequenceType = (typeof CONSEQUENCE_TYPES)[number];

export const TRANSACTION_TYPES = ['STARTER_GRANT', 'TOPUP', 'FAILURE_DEDUCTION'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CAT_IDS = [
  'orange',
  'tuxedo',
  'black',
  'boba',
  'mochi',
  'oreo',
  'pepper',
  'yuki',
] as const;
export type CatId = (typeof CAT_IDS)[number];

export const CREDIT_TYPE_LABELS: Record<ConsequenceType, string> = {
  MEALS: 'Cat Meals',
  DRY_FOOD: 'Dry Food',
  VET_CARE: 'Vet Care',
};

export const CREDIT_TYPE_ICONS: Record<ConsequenceType, string> = {
  MEALS: '\u{1F96B}',
  DRY_FOOD: '\u{1F35A}',
  VET_CARE: '\u{1F3E5}',
};
