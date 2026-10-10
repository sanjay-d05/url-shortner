'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { refreshSession } from '@/lib/api';
import { makeStore } from '@/store';
import { clearSession } from '@/store/authSlice';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } }),
  );

  // Restore the session on first load using the httpOnly refresh cookie.
  useEffect(() => {
    refreshSession().catch(() => store.dispatch(clearSession()));
  }, [store]);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: 6 } }} />
      </QueryClientProvider>
    </Provider>
  );
}
