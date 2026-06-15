'use client';

import { useState, useEffect, useCallback } from 'react';
import { Client } from './types';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ClientModal from './ClientModal';

const CREATE_ROLES = ['Admin', 'Almacenista', 'Despachador'];
const WRITE_ROLES = ['Admin', 'Almacenista'];
const PAGE_SIZE = 9;

type TypeFilter = 'all' | 'Detal' | 'Mayorista';

function ClientTypeBadge({ type }: { type: string }) {
  if (type === 'Mayorista') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-50 text-accent-600 border border-accent-100">
        Mayorista
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-500 border border-brand-100">
      Detal
    </span>
  );
}

function CardSkeleton({ delay }: { delay: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 animate-pulse" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="h-4 bg-subtle rounded-lg w-2/5" />
        <div className="h-5 bg-subtle rounded-full w-16" />
      </div>
      <div className="space-y-2.5">
        <div className="h-3 bg-subtle rounded w-3/5" />
        <div className="h-3 bg-subtle rounded w-1/2" />
        <div className="h-3 bg-subtle rounded w-2/3" />
      </div>
    </div>
  );
}

function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-card text-center">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="text-line mb-4">
        <circle cx="22" cy="18" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 48c0-9.941 8.059-18 18-18s18 8.059 18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        {searching ? (
          <>
            <circle cx="43" cy="43" r="8" stroke="currentColor" strokeWidth="1.8" />
            <path d="M49 49L53 53" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M42 30v10M37 35h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </>
        )}
      </svg>
      <p className="text-sm font-semibold text-ink mb-1">
        {searching ? 'Sin resultados' : 'Aún no hay clientes registrados'}
      </p>
      <p className="text-xs text-muted">
        {searching ? 'Intenta con otro término de búsqueda' : 'Crea el primer cliente para empezar'}
      </p>
    </div>
  );
}

export default function ClientsClient({ rol }: { rol: string }) {
  const { toast } = useToast();
  const canCreate = CREATE_ROLES.includes(rol);
  const canWrite = WRITE_ROLES.includes(rol);

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [confirmClient, setConfirmClient] = useState<Client | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/clients');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : (data.data ?? []));
    } catch {
      toast('Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filtered = clients.filter((c) => {
    if (typeFilter !== 'all' && c.clientType !== typeFilter) return false;
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.clientType.toLowerCase().includes(q) ||
      (c.city ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleteConfirmed = async () => {
    if (!confirmClient) return;
    try {
      const res = await fetch(`/api/v1/clients/${confirmClient.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Error', 'error'); return; }
      toast('Cliente eliminado');
      fetchClients();
    } catch {
      toast('Error de conexión', 'error');
    } finally {
      setConfirmClient(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 animate-fade-in-up">
        <div>
          <h2 className="text-xl font-semibold text-ink">Clientes</h2>
          <p className="text-sm text-muted mt-0.5">Gestión de clientes registrados</p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setEditingClient(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors self-start"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1V13M1 7H13" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Nuevo cliente
          </button>
        )}
      </div>

      <div className="animate-fade-in-up flex flex-col sm:flex-row gap-3" style={{ animationDelay: '60ms' }}>
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M11 11L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, tipo, ciudad, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 bg-white transition-all"
          />
        </div>
        <div className="flex gap-1 p-1 bg-subtle rounded-xl shrink-0">
          {(['all', 'Detal', 'Mayorista'] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                typeFilter === t
                  ? t === 'Mayorista'
                    ? 'bg-accent-500 text-white shadow-sm'
                    : t === 'Detal'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-white text-ink shadow-sm'
                  : 'text-muted hover:text-ink hover:bg-white/60'
              }`}
            >
              {t === 'all' ? 'Todos' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <CardSkeleton key={i} delay={i * 60} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState searching={!!(debouncedSearch || typeFilter !== 'all')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((client, i) => (
              <div
                key={client.id}
                style={{ animationDelay: `${i * 60}ms` }}
                className="animate-fade-in-up bg-white rounded-2xl shadow-card p-5 flex flex-col gap-3 group hover:shadow-[0_4px_32px_rgba(0,0,0,0.09)] transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink leading-snug">{client.name}</h3>
                  <ClientTypeBadge type={client.clientType} />
                </div>

                <div className="space-y-2 flex-1">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0">
                        <path d="M1.5 2C1.5 1.72 1.72 1.5 2 1.5H3.8L4.6 4.2L3.3 5.2C3.9 6.5 5.5 8.1 6.8 8.7L7.8 7.4L10.5 8.2V10C10.5 10.28 10.28 10.5 10 10.5C5.3 10.5 1.5 6.7 1.5 2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
                      </svg>
                      {client.phone}
                    </div>
                  )}
                  {client.city && (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0">
                        <path d="M6.5 1.5C4.567 1.5 3 3.067 3 5c0 2.8 3.5 6.5 3.5 6.5S10 7.8 10 5c0-1.933-1.567-3.5-3.5-3.5Z" stroke="currentColor" strokeWidth="1.1" />
                        <circle cx="6.5" cy="5" r="1.3" stroke="currentColor" strokeWidth="1.1" />
                      </svg>
                      {client.city}
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-muted min-w-0">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0">
                        <rect x="1" y="3" width="11" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
                        <path d="M1 5L6.5 8L12 5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                      </svg>
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>

                {canWrite && (
                  <div className="flex items-center gap-1 pt-2 border-t border-subtle sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingClient(client); setModalOpen(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-brand-50 text-muted hover:text-brand-600 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M8 2L10 4L4 10H2V8L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmClient(client)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 3H10M4 3V2.5H8V3M3.5 3V9.5H8.5V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && filtered.length > PAGE_SIZE && (
        <div className="animate-fade-in-up flex items-center justify-between px-1" style={{ animationDelay: '120ms' }}>
          <p className="text-xs text-muted">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} clientes
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-line text-muted hover:text-ink hover:bg-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-colors ${
                  page === i + 1
                    ? 'bg-brand-500 text-white'
                    : 'border border-line text-muted hover:text-ink hover:bg-subtle'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-line text-muted hover:text-ink hover:bg-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmClient}
        title={`¿Eliminar "${confirmClient?.name}"?`}
        description="Esta acción no se puede deshacer."
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmClient(null)}
      />

      <ClientModal
        open={modalOpen}
        client={editingClient}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); fetchClients(); }}
      />
    </div>
  );
}
