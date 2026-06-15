'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 sm:bottom-5 sm:left-auto sm:right-5 sm:w-auto z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-in-up pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-card text-sm font-medium text-white ${
              t.type === 'success'
                ? 'bg-emerald-600'
                : t.type === 'warning'
                  ? 'bg-accent-500'
                  : 'bg-red-500'
            }`}
          >
            {t.type === 'success' ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : t.type === 'warning' ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14.5 13.5H1.5L8 2Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M8 6.5V9.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="8" cy="11.5" r="0.8" fill="white" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
