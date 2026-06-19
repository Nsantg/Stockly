'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  inventory: 'Inventario',
  movements: 'Movimientos',
  clients: 'Clientes',
  users: 'Usuarios',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveLabel(url: string, pick: (data: Record<string, unknown>) => string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const label = pick(data).trim();
    return label.length > 0 ? label : null;
  } catch {
    return null;
  }
}

const resourceResolvers: Record<string, (id: string) => Promise<string | null>> = {
  products: (id) => resolveLabel(`/api/v1/products/${id}`, (d) => String(d.name ?? '')),
  clients: (id) => resolveLabel(`/api/v1/clients/${id}`, (d) => String(d.name ?? '')),
  users: (id) => resolveLabel(`/api/v1/users/${id}`, (d) => `${d.nombre ?? ''} ${d.apellido ?? ''}`),
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    segments.forEach((segment, index) => {
      if (!UUID_REGEX.test(segment) || labels[segment] || pending[segment]) return;
      const resolve = resourceResolvers[segments[index - 1]];
      if (!resolve) return;

      setPending((prev) => ({ ...prev, [segment]: true }));
      resolve(segment).then((label) => {
        setLabels((prev) => ({ ...prev, [segment]: label ?? segment }));
        setPending((prev) => ({ ...prev, [segment]: false }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((segment, index) => ({
    href: '/' + segments.slice(0, index + 1).join('/'),
    label: routeLabels[segment] ?? labels[segment] ?? segment,
    isLoading: UUID_REGEX.test(segment) && pending[segment] && !labels[segment],
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
          {crumb.isLoading ? (
            <span className="h-4 w-16 rounded bg-subtle animate-pulse" aria-hidden="true" />
          ) : crumb.isLast ? (
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
