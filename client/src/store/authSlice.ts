import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';

/** Browser-owned state: who is signed in and their short-lived access token (memory only). */
interface AuthState {
  status: 'idle' | 'authenticated' | 'anonymous';
  user: User | null;
  accessToken: string | null;
}

const slice = createSlice({
  name: 'auth',
  initialState: { status: 'idle', user: null, accessToken: null } as AuthState,
  reducers: {
    setSession(state, a: PayloadAction<{ user: User; accessToken: string }>) {
      state.status = 'authenticated';
      state.user = a.payload.user;
      state.accessToken = a.payload.accessToken;
    },
    clearSession(state) {
      state.status = 'anonymous';
      state.user = null;
      state.accessToken = null;
    },
  },
});

export const { setSession, clearSession } = slice.actions;
export default slice.reducer;
