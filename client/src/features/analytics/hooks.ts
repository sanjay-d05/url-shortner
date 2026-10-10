'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks';
import { keys } from '@/features/links/hooks';
import type { LinkAnalytics, Summary } from '@/types';

export function useSummary(days = 14) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: keys.summary(days),
    queryFn: async () => (await api.get<Summary>('/api/analytics/summary', { params: { days } })).data,
    enabled: isAuthenticated,
  });
}

export function useLinkAnalytics(id: number, days: number) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: keys.analytics(id, days),
    queryFn: async () => (await api.get<LinkAnalytics>(`/api/links/${id}/analytics`, { params: { days } })).data,
    enabled: isAuthenticated && Number.isFinite(id),
    placeholderData: keepPreviousData,
  });
}
