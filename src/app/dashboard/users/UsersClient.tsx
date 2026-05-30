'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from './types';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import UserModal from './UserModal';

const ROLE_BADGE: Record<UserRole, { bg: string; text: string; border: string; label: string }> = {
  Admin: { bg: 'bg-brand-50', text: 'text-brand-600', border: 'border-brand-100', label: 'Admin' },
  Almacenista: { bg: 'bg-accent-50', text: 'text-accent-600', border: 'border-accent-100', label: 'Almacenista' },
  Despachador: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Despachador' },
  Visualizador: { bg: 'bg-subtle', text: 'text-muted', border: 'border-line', label: 'Visualizador' },
};

function RoleBadge({ rol }: { rol: UserRole }) {
  const s = ROLE_BADGE[rol];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Activo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-subtle text-muted border border-line">
      <span className="w-1.5 h-1.5 rounded-full bg-muted shrink-0" />
      Inactivo
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-subtle flex gap-8">
        {[120, 180, 80, 70, 90].map((w, i) => (
          <div key={i} className="h-3 bg-subtle rounded animate-pulse" style={{ width: w, animationDelay: `${i * 40}ms` }} />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-6 py-4 border-b border-subtle flex gap-8 animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="h-3.5 bg-subtle rounded w-32" />
          <div className="h-3.5 bg-subtle rounded w-44" />
          <div className="h-5 bg-subtle rounded-full w-20" />
          <div className="h-5 bg-subtle rounded-full w-16" />
          <div className="h-3.5 bg-subtle rounded w-24" />
          <div className="h-5 bg-subtle rounded w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-card text-center">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="text-line mb-4">
        <circle cx="20" cy="18" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 46c0-8.837 7.163-16 16-16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="36" cy="26" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path d="M24 46c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        {searching && (
          <>
            <circle cx="46" cy="10" r="5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M50 14L53 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </>
        )}
      </svg>
      <p className="text-sm font-semibold text-ink mb-1">
        {searching ? 'Sin resultados' : 'Aún no hay usuarios registrados'}
      </p>
      <p className="text-xs text-muted">
        {searching ? 'Intenta con otro término de búsqueda' : 'Crea el primer usuario para empezar'}
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function UsersClient({ currentUserId }: { currentUserId: string }) {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/users');
      if (!res.ok) { toast('Error al cargar usuarios', 'error'); return; }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      u.nombre.toLowerCase().includes(q) ||
      u.apellido.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.rol.toLowerCase().includes(q)
    );
  });

  const handleDeactivateConfirmed = async () => {
    if (!confirmUser) return;
    try {
      const res = await fetch(`/api/v1/users/${confirmUser.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Error', 'error'); return; }
      toast('Usuario desactivado');
      fetchUsers();
    } catch {
      toast('Error de conexión', 'error');
    } finally {
      setConfirmUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between animate-fade-in-up">
        <div>
          <h2 className="text-xl font-semibold text-ink">Gestión de usuarios</h2>
          <p className="text-sm text-muted mt-0.5">Administra los accesos y roles del equipo</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setModalOpen(true); }}
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1V13M1 7H13" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Nuevo usuario
        </button>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M11 11L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, email o rol…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 bg-white transition-all"
          />
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState searching={!!debouncedSearch} />
        ) : (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">Nombre</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">Rol</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">Creado</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, i) => (
                    <tr
                      key={user.id}
                      className="border-b border-subtle last:border-0 hover:bg-surface/60 transition-colors animate-fade-in-up group"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="px-6 py-4 font-medium text-ink whitespace-nowrap">
                        {user.nombre} {user.apellido}
                      </td>
                      <td className="px-4 py-4 text-muted whitespace-nowrap">{user.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <RoleBadge rol={user.rol} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge active={user.isActive} />
                      </td>
                      <td className="px-4 py-4 text-muted whitespace-nowrap">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingUser(user); setModalOpen(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-brand-50 text-muted hover:text-brand-600 transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M8 2L10 4L4 10H2V8L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                            </svg>
                            Editar
                          </button>
                          {user.id !== currentUserId && user.isActive && (
                            <button
                              onClick={() => setConfirmUser(user)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                                <path d="M4 6h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                              </svg>
                              Desactivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmUser}
        title={`¿Desactivar a ${confirmUser?.nombre} ${confirmUser?.apellido}?`}
        description="El usuario perderá acceso al sistema. Podrás reactivarlo editando su perfil."
        confirmLabel="Desactivar"
        danger
        onConfirm={handleDeactivateConfirmed}
        onCancel={() => setConfirmUser(null)}
      />

      <UserModal
        open={modalOpen}
        user={editingUser}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); fetchUsers(); }}
      />
    </div>
  );
}
