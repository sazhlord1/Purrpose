import { z } from 'zod';
import { CAT_IDS, COMMITMENT_STATUSES, CONSEQUENCE_TYPES, TRANSACTION_TYPES } from './enums.js';

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

export const meResponseSchema = z.object({
  user: z.object({ id: z.string(), createdAtISO: z.string() }),
  balances: z.array(balanceViewSchema),
  serverTime: z.number(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export const historyEntrySchema = z.object({
  id: z.string(),
  type: transactionTypeSchema,
  creditType: consequenceTypeSchema,
  amount: z.number().int(),
  commitmentId: z.string().nullable(),
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
