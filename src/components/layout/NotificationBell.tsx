'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAlerts, type StockAlert, type ExpirationAlert, type EntryIssueData } from '@/components/providers/AlertsSocketProvider';

type BellItem =
  | { kind: 'stock'; label: string; sub: string }
  | { kind: 'expiration'; label: string; sub: string; critical: boolean }
  | { kind: 'entry'; label: string; sub: string; damaged: boolean };

function buildTopItems(
  stockAlerts: StockAlert[],
  expirationAlerts: ExpirationAlert[],
  entryIssues: EntryIssueData[],
): BellItem[] {
  const items: BellItem[] = [];

  for (const a of stockAlerts) {
    if (items.length >= 5) break;
    items.push({ kind: 'stock', label: a.productName, sub: `${a.stock} u. · mínimo ${a.minStock}` });
  }

  for (const a of expirationAlerts.filter((x) => x.level === 'CRITICAL')) {
    if (items.length >= 5) break;
    items.push({ kind: 'expiration', label: a.productName, sub: `Lote ${a.lotNumber} · vence en ${a.daysUntilExpiration} días`, critical: true });
  }

  for (const i of entryIssues) {
    if (items.length >= 5) break;
    const damaged = i.issueType === 'DAMAGED';
    items.push({ kind: 'entry', label: i.productName, sub: `${damaged ? 'Producto dañado' : 'Cantidad faltante'} · ${i.quantity} u.`, damaged });
  }

  for (const a of expirationAlerts.filter((x) => x.level === 'WARNING')) {
    if (items.length >= 5) break;
    items.push({ kind: 'expiration', label: a.productName, sub: `Lote ${a.lotNumber} · vence en ${a.daysUntilExpiration} días`, critical: false });
  }

  return items;
}

function DotCritical() {
  return <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />;
}
function DotWarning() {
  return <span className="h-1.5 w-1.5 rounded-full bg-accent-500 shrink-0" />;
}

const PANEL_W = 288;
const PANEL_GAP = 8;

export default function NotificationBell() {
  const { summary, entryIssues } = useAlerts();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const badgeCount =
    (summary?.totalCritical ?? 0) + (summary?.totalWarnings ?? 0) + entryIssues.length;

  const topItems = buildTopItems(
    summary?.stockAlerts ?? [],
    summary?.expirationAlerts ?? [],
    entryIssues,
  );

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Alinear borde derecho del panel con el botón, clampeado al viewport
      let left = rect.right - PANEL_W;
      left = Math.max(PANEL_GAP, Math.min(left, window.innerWidth - PANEL_W - PANEL_GAP));
      setPanelStyle({
        bottom: window.innerHeight - rect.top + PANEL_GAP,
        left,
        width: PANEL_W,
      });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={handleToggle}
        aria-label="Notificaciones"
        className="relative h-7 w-7 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-white/60 transition-colors duration-150"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M7.5 2C5.015 2 3 4.015 3 6.5V10L1.5 11.5H13.5L12 10V6.5C12 4.015 9.985 2 7.5 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M6 12C6 12.828 6.672 13.5 7.5 13.5C8.328 13.5 9 12.828 9 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="fixed bg-white rounded-xl shadow-card border border-line animate-fade-in-up z-[9999]"
        >
          <div className="px-3 py-2.5 border-b border-line">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Notificaciones</p>
          </div>
          <div className="divide-y divide-line max-h-60 overflow-y-auto">
            {topItems.length === 0 ? (
              <p className="px-4 py-5 text-xs text-muted text-center">Sin alertas activas</p>
            ) : (
              topItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 px-3 py-2.5">
                  <div className="mt-1.5">
                    {item.kind === 'stock' ? (
                      <DotCritical />
                    ) : item.kind === 'entry' ? (
                      <DotWarning />
                    ) : item.critical ? (
                      <DotCritical />
                    ) : (
                      <DotWarning />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">{item.label}</p>
                    <p className="text-[11px] text-muted truncate">{item.sub}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-3 py-2 border-t border-line">
            <Link
              href="/dashboard/alerts"
              onClick={() => setOpen(false)}
              className="block w-full text-center px-3 py-1.5 text-xs font-semibold text-brand-500 hover:bg-brand-50 rounded-lg transition-colors duration-150"
            >
              Ver todas las alertas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
