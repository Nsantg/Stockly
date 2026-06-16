import type { ComponentType } from 'react';

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const rolBadge: Record<string, { bg: string; text: string; dot: string }> = {
  Admin: { bg: 'bg-brand-50', text: 'text-brand-500', dot: 'bg-brand-500' },
  Almacenista: { bg: 'bg-accent-50', text: 'text-accent-600', dot: 'bg-accent-500' },
  Despachador: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Visualizador: { bg: 'bg-subtle', text: 'text-muted', dot: 'bg-muted' },
};

function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconInventory() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M2 5.5L8 2.5L14 5.5V10.5L8 13.5L2 10.5V5.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 2.5V13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2 5.5L8 8.5L14 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconMovements() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M2 8H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 4.5L14 8L10 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 4.5L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconClients() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="6" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 14C1 11.239 3.239 9 6 9C8.761 9 11 11.239 11 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="11.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M14 14C14 12.343 12.881 11 11.5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 14C2.5 11.515 4.786 9 8 9C11.214 9 13.5 11.515 13.5 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconAlerts() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M8 2C5.239 2 3 4.239 3 7V11L1.5 12.5H14.5L13 11V7C13 4.239 10.761 2 8 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6.5 13C6.5 13.828 7.172 14.5 8 14.5C8.828 14.5 9.5 13.828 9.5 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 1.5V3.3M8 12.7V14.5M1.5 8H3.3M12.7 8H14.5M3.4 3.4L4.7 4.7M11.3 11.3L12.6 12.6M3.4 12.6L4.7 11.3M11.3 4.7L12.6 3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const baseNavGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: IconDashboard },
      { label: 'Alertas', href: '/dashboard/alerts', icon: IconAlerts },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { label: 'Inventario', href: '/dashboard/inventory', icon: IconInventory },
      { label: 'Movimientos', href: '/dashboard/movements', icon: IconMovements },
      { label: 'Clientes', href: '/dashboard/clients', icon: IconClients },
    ],
  },
];

const adminNavGroup: NavGroup = {
  label: 'Administración',
  items: [
    { label: 'Usuarios', href: '/dashboard/users', icon: IconUsers },
    { label: 'Configuración', href: '/dashboard/settings', icon: IconSettings },
  ],
};

export function getNavGroups(rol: string): NavGroup[] {
  return rol === 'Admin' ? [...baseNavGroups, adminNavGroup] : baseNavGroups;
}
