'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  inventory: 'Inventario',
  movements: 'Movimientos',
  clients: 'Clientes',
  users: 'Usuarios',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((segment, index) => ({
    href: '/' + segments.slice(0, index + 1).join('/'),
    label: routeLabels[segment] ?? segment,
    isLast: index === segments.length - 1,
  }));

  return (
    <nav className="flex items-center gap-1.5 mb-6 animate-fade-in">
      {crumbs.map((crumb, i) => (
        <div key={crumb.href} className="flex items-center gap-1.5">
          {i > 0 && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-muted/40 shrink-0">
              <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {crumb.isLast ? (
            <span className="text-sm font-medium text-ink">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-sm text-muted hover:text-ink transition-colors duration-150"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
