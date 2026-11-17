import { useQuery } from '@tanstack/react-query';
import type { CommitmentDto, FocusSummary, HabitDto, MeResponse } from '@purrpose/shared';
import { api } from './api.js';

export function useMe(enabled = true) {
  return useQuery({ queryKey: ['me'], queryFn: () => api<MeResponse>('/me'), enabled });
}

export function useCommitments(refetchInterval?: number, enabled = true) {
  return useQuery({
    queryKey: ['commitments'],
    queryFn: () => api<{ commitments: CommitmentDto[] }>('/commitments'),
    refetchInterval,
    enabled,
  });
}

export function useFocusSummary() {
  return useQuery({ queryKey: ['focus-summary'], queryFn: () => api<FocusSummary>('/focus/summary') });
}

export function useIsAdmin(): boolean {
  return useMe().data?.user.role === 'ADMIN';
}

export function useHabits(enabled = true) {
  return useQuery({
    queryKey: ['habits'],
    queryFn: () => api<{ habits: HabitDto[] }>('/habits'),
    refetchInterval: 60_000,
    enabled,
  });
}
