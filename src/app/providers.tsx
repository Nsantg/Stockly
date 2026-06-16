'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/ui/Toast';
import { AlertsSocketProvider } from '@/components/providers/AlertsSocketProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <AlertsSocketProvider>{children}</AlertsSocketProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
