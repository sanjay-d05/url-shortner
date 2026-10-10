'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearSession, setSession } from '@/store/authSlice';
import type { User } from '@/types';

type Session = { user: User; accessToken: string };

export function useAuth() {
  const { status, user } = useAppSelector((s) => s.auth);
  return { status, user, isAuthenticated: status === 'authenticated' };
}

export function useAuthMutation(path: 'login' | 'register') {
  const dispatch = useAppDispatch();
  const router = useRouter();
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) =>
      (await api.post<Session>(`/api/auth/${path}`, body)).data,
    onSuccess: (data) => {
      dispatch(setSession(data));
      router.push('/dashboard');
    },
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const qc = useQueryClient();
  return async () => {
    await api.post('/api/auth/logout').catch(() => undefined);
    dispatch(clearSession());
    qc.clear(); // drop all cached server data for the previous user
    router.push('/');
  };
}

/** Redirects to /login once we know the visitor is anonymous. */
export function useRequireAuth() {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === 'anonymous') router.replace('/login');
  }, [status, router]);
  return status;
}
