import { configureStore } from '@reduxjs/toolkit';
import { authBridge } from '@/lib/api';
import authReducer, { clearSession, setSession } from './authSlice';
import uiReducer from './uiSlice';

export const makeStore = () => {
  const store = configureStore({ reducer: { auth: authReducer, ui: uiReducer } });

  authBridge.getToken = () => store.getState().auth.accessToken;
  authBridge.onSession = (user, accessToken) => store.dispatch(setSession({ user, accessToken }));
  authBridge.onLogout = () => store.dispatch(clearSession());

  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
