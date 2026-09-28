import { useQuery } from '@tanstack/react-query';
import type { CommitmentDto, FocusSummary, MeResponse } from '@purrpose/shared';
import { api } from './api.js';

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => api<MeResponse>('/me') });
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
