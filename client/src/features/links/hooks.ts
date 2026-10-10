'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks';
import type { ApiKey, BulkResult, Link, Paginated } from '@/types';
import type { StatusFilter } from '@/store/uiSlice';

export interface LinkPayload {
  url?: string;
  alias?: string;
  expiresAt?: string | null;
  maxClicks?: number | null;
  password?: string | null;
  isActive?: boolean;
  tags?: string[];
}

export const keys = {
  links: ['links'] as const,
  list: (f: object) => ['links', 'list', f] as const,
  link: (id: number) => ['links', id] as const,
  tags: ['tags'] as const,
  summary: (days: number) => ['summary', days] as const,
  analytics: (id: number, days: number) => ['analytics', id, days] as const,
  apiKeys: ['api-keys'] as const,
};

export function useLinks(filters: { search: string; tag: string; status: StatusFilter; page: number }) {
  const { isAuthenticated } = useAuth();
  const params = { ...filters, pageSize: 10 };
  return useQuery({
    queryKey: keys.list(params),
    queryFn: async () => (await api.get<Paginated<Link>>('/api/links', { params: clean(params) })).data,
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
  });
}

export function useLink(id: number) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: keys.link(id),
    queryFn: async () => (await api.get<Link>(`/api/links/${id}`)).data,
    enabled: isAuthenticated && Number.isFinite(id),
  });
}

export function useTags() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: keys.tags,
    queryFn: async () => (await api.get<string[]>('/api/links/tags')).data,
    enabled: isAuthenticated,
  });
}

export function useQr(id: number | undefined) {
  return useQuery({
    queryKey: ['qr', id],
    queryFn: async () => (await api.get<{ dataUrl: string }>(`/api/links/${id}/qr`)).data.dataUrl,
    enabled: id !== undefined,
    staleTime: Infinity,
  });
}

/** Works for anonymous visitors too (the interceptor only adds a token when signed in). */
export function useCreateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LinkPayload) => (await api.post<Link>('/api/links', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.links });
      qc.invalidateQueries({ queryKey: keys.tags });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

export function useUpdateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: LinkPayload & { id: number }) =>
      (await api.patch<Link>(`/api/links/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.links });
      qc.invalidateQueries({ queryKey: keys.tags });
    },
  });
}

export function useDeleteLinks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => (await api.post<{ deleted: number }>('/api/links/bulk-delete', { ids })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.links });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

export function useBulkCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (urls: string[]) => (await api.post<BulkResult[]>('/api/links/bulk', { urls })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.links });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

export function useApiKeys() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: keys.apiKeys,
    queryFn: async () => (await api.get<ApiKey[]>('/api/api-keys')).data,
    enabled: isAuthenticated,
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => (await api.post<ApiKey>('/api/api-keys', { name })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.apiKeys }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/api-keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.apiKeys }),
  });
}

const clean = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v != null));
