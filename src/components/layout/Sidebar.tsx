'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { getNavGroups, rolBadge } from './navConfig';
import { useAlerts } from '@/components/providers/AlertsSocketProvider';
import NotificationBell from './NotificationBell';

interface SidebarProps {
  nombre: string;
  apellido: string;
  rol: string;
}

export default function Sidebar({ nombre, apellido, rol }: SidebarProps) {
  const pathname = usePathname();
  const badge = rolBadge[rol] ?? rolBadge.Visualizador;
  const groups = getNavGroups(rol);
  const { summary, entryIssues } = useAlerts();
  const criticalCount = (summary?.totalCritical ?? 0) + (summary?.totalWarnings ?? 0) + entryIssues.length;

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-line h-screen sticky top-0 animate-fade-in">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-line shrink-0">
        <div className="h-7 w-7 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
          <div className="grid grid-cols-2 gap-[3px]">
            <div className="h-[6px] w-[6px] rounded-[2px] bg-white/90" />
            <div className="h-[6px] w-[6px] rounded-[2px] bg-white/40" />
            <div className="h-[6px] w-[6px] rounded-[2px] bg-white/40" />
            <div className="h-[6px] w-[6px] rounded-[2px] bg-accent-400/90" />
          </div>
        </div>
        <span className="text-[15px] font-bold tracking-tight text-ink">Stockly</span>
        <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)] animate-pulse shrink-0" />
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted/70">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                        isActive
                          ? 'bg-brand-50 text-brand-500'
                          : 'text-ink/60 hover:bg-subtle hover:text-ink'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-brand-500" />
                      )}
                      <Icon />
                      <span className="flex-1">{item.label}</span>
                      {item.href === '/dashboard/alerts' && criticalCount > 0 && (
                        <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                          {criticalCount > 99 ? '99+' : criticalCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-line shrink-0">
        <div className="rounded-xl bg-subtle p-3">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-brand-500 uppercase">
                {nombre[0]}{apellido[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate leading-snug">
                {nombre} {apellido}
              </p>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${badge.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                {rol}
              </span>
            </div>
            <NotificationBell />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-muted hover:text-red-500 hover:bg-red-50 transition-colors duration-150"
          >
            <IconSignOut />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}

function IconSignOut() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path d="M5.5 2H3C2.448 2 2 2.448 2 3V11C2 11.552 2.448 12 3 12H5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9.5 9.5L12.5 7L9.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 7H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
