import { z } from 'zod';
import { CAT_IDS, COMMITMENT_STATUSES, CONSEQUENCE_TYPES, TRANSACTION_TYPES } from './enums.js';
import { itemIdSchema, loadoutSchema } from './items.js';

export const consequenceTypeSchema = z.enum(CONSEQUENCE_TYPES);
export const catIdSchema = z.enum(CAT_IDS);
export const commitmentStatusSchema = z.enum(COMMITMENT_STATUSES);
export const transactionTypeSchema = z.enum(TRANSACTION_TYPES);

const MIN_DEADLINE_OFFSET_MS = 5 * 60_000;
const MAX_DEADLINE_OFFSET_MS = 30 * 24 * 3_600_000;

export function createCommitmentSchema(nowMs: number) {
  return z.object({
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().max(500).optional(),
    deadlineISO: z
      .string()
      .refine(value => !Number.isNaN(Date.parse(value)), 'deadlineISO must be a valid date')
      .refine(value => Date.parse(value) >= nowMs + MIN_DEADLINE_OFFSET_MS, {
        message: `deadline must be at least ${MIN_DEADLINE_OFFSET_MS / 60_000} minutes in the future`,
      })
      .refine(value => Date.parse(value) <= nowMs + MAX_DEADLINE_OFFSET_MS, {
        message: 'deadline must be within 30 days',
      }),
    catId: catIdSchema,
    consequenceType: consequenceTypeSchema,
    consequenceAmount: z.number().int().min(1).max(9999),
  });
}

export type CreateCommitmentInput = z.infer<ReturnType<typeof createCommitmentSchema>>;

export const topUpSchema = z.object({
  creditType: consequenceTypeSchema,
  amount: z.number().int().min(1).max(9999),
});

export const idParamsSchema = z.object({ id: z.string().min(1) });

export const balanceViewSchema = z.object({
  creditType: consequenceTypeSchema,
  amount: z.number().int(),
  stakedActive: z.number().int(),
  available: z.number().int(),
});

export type BalanceView = z.infer<typeof balanceViewSchema>;

export const commitmentDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  deadlineISO: z.string(),
  status: commitmentStatusSchema,
  catId: catIdSchema,
  consequenceType: consequenceTypeSchema,
  consequenceAmount: z.number().int(),
  createdAtISO: z.string(),
  completedAtISO: z.string().nullable().optional(),
  failedAtISO: z.string().nullable().optional(),
  phase: z.string().optional(),
  remainingMs: z.number().optional(),
});

export type CommitmentDto = z.infer<typeof commitmentDtoSchema>;

export const userRoleSchema = z.enum(['USER', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const meResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    createdAtISO: z.string(),
    /** Null while the user is still a guest (anonymous session). */
    email: z.string().nullable(),
    role: userRoleSchema,
    /** For the greeting; null for guests and accounts that never gave a name. */
    firstName: z.string().nullable(),
  }),
  balances: z.array(balanceViewSchema),
  purr: z.number().int(),
  unlockedCatIds: z.array(catIdSchema),
  ownedItemIds: z.array(itemIdSchema),
  loadout: loadoutSchema,
  serverTime: z.number(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export const historyEntrySchema = z.object({
  id: z.string(),
  type: transactionTypeSchema,
  creditType: consequenceTypeSchema,
  amount: z.number().int(),
  commitmentId: z.string().nullable(),
  /** Set when the entry belongs to a habit (Detective Cheat). */
  habitId: z.string().nullable().optional(),
  title: z.string().nullable(),
  atISO: z.string(),
});

export type HistoryEntry = z.infer<typeof historyEntrySchema>;

export const historyResponseSchema = z.object({
  totals: z.object({
    completed: z.number().int(),
    failed: z.number().int(),
    donatedByType: z.record(consequenceTypeSchema, z.number().int()),
  }),
  entries: z.array(historyEntrySchema),
});

export type HistoryResponse = z.infer<typeof historyResponseSchema>;

// ─── Accounts ────────────────────────────────────────────────────────────────
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .email();

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});
export type Credentials = z.infer<typeof credentialsSchema>;

const personName = z
  .string()
  .trim()
  .min(1, 'Please enter your name')
  .max(40, 'That name is a bit long');

/** Sign up with email: also asks for a first and last name (used to greet you). */
export const registerSchema = credentialsSchema.extend({
  firstName: personName,
  lastName: personName,
});
export type RegisterInput = z.infer<typeof registerSchema>;

/** Body of POST /auth/google: the ID token from Google's sign-in button. */
export const googleSignInSchema = z.object({
  credential: z.string().min(20).max(4096),
});

export const authResponseSchema = z.object({
  token: z.string(),
  userId: z.string(),
  email: z.string(),
  role: userRoleSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

// ─── Shop / PURR ─────────────────────────────────────────────────────────────
export const unlockCatSchema = z.object({ catId: catIdSchema });
export const checkoutSchema = z.object({ packId: z.string().min(1).max(40) });
export const adminGrantSchema = z.object({
  email: emailSchema,
  amount: z.number().int().min(1).max(100_000),
});

// ─── Focus ───────────────────────────────────────────────────────────────────
export const MAX_FOCUS_SESSION_SEC = 12 * 3600;
export const focusSessionSchema = z.object({
  commitmentId: z.string().min(1).max(40).optional(),
  catId: catIdSchema,
  durationSec: z.number().int().min(1).max(MAX_FOCUS_SESSION_SEC),
  startedAtISO: z.string().refine(v => !Number.isNaN(Date.parse(v)), 'startedAtISO must be a date'),
});
export type FocusSessionInput = z.infer<typeof focusSessionSchema>;

export const focusSummarySchema = z.object({
  totalSec: z.number().int(),
  todaySec: z.number().int(),
  byCommitment: z.record(z.string(), z.number().int()),
});
export type FocusSummary = z.infer<typeof focusSummarySchema>;

// ─── Web push ────────────────────────────────────────────────────────────────
export const pushSubscribeSchema = z.object({
  endpoint: z.string().url().max(2048).startsWith('https://'),
  keys: z.object({
    p256dh: z.string().min(16).max(256),
    auth: z.string().min(8).max(64),
  }),
});
export const pushUnsubscribeSchema = z.object({ endpoint: z.string().max(2048) });
