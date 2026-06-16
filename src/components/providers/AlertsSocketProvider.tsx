'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getSocket, disconnectSocket } from '@/lib/realtime/socketClient';
import { useToast } from '@/components/ui/Toast';

export interface StockAlert {
  type: 'STOCK_CRITICAL';
  productId: string;
  productName: string;
  stock: number;
  minStock: number;
  message: string;
  level: 'CRITICAL';
}

export interface ExpirationAlert {
  type: 'EXPIRATION_WARNING';
  lotId: string;
  lotNumber: string;
  productId: string;
  productName: string;
  expirationDate: string;
  daysUntilExpiration: number;
  stock: number;
  level: 'CRITICAL' | 'WARNING';
}

export interface AlertSummary {
  stockAlerts: StockAlert[];
  expirationAlerts: ExpirationAlert[];
  totalCritical: number;
  totalWarnings: number;
}

export interface EntryIssueData {
  id: string;
  movementId: string;
  productId: string;
  productName: string;
  quantity: number;
  issueType: 'DAMAGED' | 'MISSING';
  isResolved: boolean;
  createdAt: string;
}

interface AlertToast {
  level: string;
  title: string;
  message: string;
  href: string;
}

interface AlertsContextValue {
  summary: AlertSummary | null;
  entryIssues: EntryIssueData[];
}

const AlertsContext = createContext<AlertsContextValue>({
  summary: null,
  entryIssues: [],
});

export function AlertsSocketProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { toast } = useToast();
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [entryIssues, setEntryIssues] = useState<EntryIssueData[]>([]);

  // Fetch histórico de incidencias no resueltas al autenticar
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/v1/entry-issues')
      .then<EntryIssueData[]>((r) => (r.ok ? r.json() : Promise.resolve([])))
      .then((issues) => setEntryIssues(issues))
      .catch(() => {});
  }, [status]);

  // Conexión y suscripciones al socket
  useEffect(() => {
    if (status !== 'authenticated') return;

    const socket = getSocket();

    const onSummary = (data: AlertSummary) => setSummary(data);

    const onEntryIssue = (issue: EntryIssueData) => {
      setEntryIssues((prev) => {
        if (prev.some((i) => i.id === issue.id)) return prev;
        return [...prev, issue];
      });
    };

    const onToast = (data: AlertToast) => {
      toast(data.message, data.level === 'critical' ? 'error' : 'warning');
    };

    socket.on('alerts:summary', onSummary);
    socket.on('alerts:entry_issue', onEntryIssue);
    socket.on('alerts:toast', onToast);

    return () => {
      socket.off('alerts:summary', onSummary);
      socket.off('alerts:entry_issue', onEntryIssue);
      socket.off('alerts:toast', onToast);
    };
  }, [status, toast]);

  // Desconectar al cerrar sesión
  useEffect(() => {
    if (status === 'unauthenticated') {
      disconnectSocket();
      setSummary(null);
      setEntryIssues([]);
    }
  }, [status]);

  return (
    <AlertsContext.Provider value={{ summary, entryIssues }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts(): AlertsContextValue {
  return useContext(AlertsContext);
}
