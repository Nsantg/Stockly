'use client';

import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import {
  Movement,
  MovementsPage,
  MovementType,
  ClientType,
  ProductOption,
  ClientOption,
  ALL_MOVEMENT_TYPES,
  TYPE_LABELS,
  TYPE_BADGE,
} from './types';
import { useToast } from '@/components/ui/Toast';
import { exportToExcel, exportToPdf } from './exportUtils';

const SALIDA_TYPES: MovementType[] = ['VENTA', 'DAÑO', 'VENCIMIENTO', 'AJUSTE_SALIDA'];
const EVIDENCE_UPLOAD_ROLES = ['Admin', 'Almacenista', 'Despachador'];
const MAX_EVIDENCE = 4;

const ANNUL_ROLES = ['Admin', 'Almacenista'];
const LIMIT = 15;

function fmt(d: string) {
  return new Date(d).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function TypeBadge({ type }: { type: MovementType }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${TYPE_BADGE[type]}`}>
      {TYPE_LABELS[type]}
    </span>
  );
}

function StatusBadge({ isAnnulled }: { isAnnulled: boolean }) {
  return isAnnulled ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
      Anulado
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
      Activo
    </span>
  );
}

function AnnulModal({
  open,
  movement,
  onClose,
  onDone,
}: {
  open: boolean;
  movement: Movement | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setReason(''); setError(''); }
  }, [open]);

  const handleSubmit = async () => {
    if (reason.trim().length < 5) { setError('El motivo debe tener al menos 5 caracteres'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/movements/${movement!.id}/annul`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Error al anular', 'error'); return; }
      toast('Movimiento anulado');
      onDone();
    } catch {
      toast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
          <h3 className="text-base font-semibold text-ink">Anular movimiento</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-subtle text-muted hover:text-ink transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-muted">
            Anular este movimiento revertirá su efecto en el inventario. Esta acción no se puede deshacer.
          </p>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Motivo *</label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              rows={3}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all resize-none ${
                error ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'
              }`}
              placeholder="Describe el motivo de la anulación (mín. 5 caracteres)"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium border border-line rounded-xl hover:bg-subtle transition-colors">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl transition-colors"
            >
              {saving ? 'Anulando…' : 'Anular'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditDispatchModal({
  open,
  movement,
  onClose,
  onDone,
}: {
  open: boolean;
  movement: Movement | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [productQuery, setProductQuery] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [clientQuery, setClientQuery] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientType, setClientType] = useState<ClientType>('Detal');
  const [totalWeight, setTotalWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [pResults, setPResults] = useState<ProductOption[]>([]);
  const [pOpen, setPOpen] = useState(false);
  const [cResults, setCResults] = useState<ClientOption[]>([]);
  const [cOpen, setCOpen] = useState(false);
  const pTimer = useRef<ReturnType<typeof setTimeout>>();
  const cTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!open || !movement) return;
    setProductQuery(movement.product.name);
    setProductId(movement.productId);
    setQuantity(String(movement.quantity));
    setClientQuery(movement.client?.name ?? '');
    setClientId(movement.clientId ?? '');
    setClientType(movement.clientType ?? 'Detal');
    setTotalWeight(movement.totalWeight ? String(movement.totalWeight) : '');
  }, [open, movement]);

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setPResults([]); return; }
    try {
      const res = await fetch(`/api/v1/products/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setPResults(await res.json().then((d: unknown) => (Array.isArray(d) ? d : [])));
    } catch { setPResults([]); }
  }, []);

  const searchClients = useCallback(async (q: string) => {
    if (!q.trim()) { setCResults([]); return; }
    try {
      const res = await fetch(`/api/v1/clients/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setCResults(await res.json().then((d: unknown) => (Array.isArray(d) ? d : [])));
    } catch { setCResults([]); }
  }, []);

  const handleSubmit = async () => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) { toast('Cantidad inválida', 'error'); return; }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { quantity: qty, clientType };
      if (productId) body.productId = productId;
      if (clientId) body.clientId = clientId;
      if (totalWeight) body.totalWeight = parseFloat(totalWeight);
      const res = await fetch(`/api/v1/movements/${movement!.id}/dispatch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Error al editar', 'error'); return; }
      toast('Despacho actualizado');
      onDone();
    } catch {
      toast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
          <h3 className="text-base font-semibold text-ink">Editar despacho</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-subtle text-muted hover:text-ink transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Producto</label>
            <div className="relative">
              <input
                type="text"
                value={productQuery}
                onChange={(e) => {
                  setProductQuery(e.target.value);
                  setPOpen(true);
                  clearTimeout(pTimer.current);
                  pTimer.current = setTimeout(() => searchProducts(e.target.value), 300);
                }}
                onBlur={() => setTimeout(() => setPOpen(false), 150)}
                className="w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all"
              />
              {pOpen && pResults.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-line rounded-xl shadow-card overflow-hidden">
                  {pResults.map((p) => (
                    <button key={p.id} type="button"
                      onMouseDown={() => { setProductId(p.id); setProductQuery(p.name); setPOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-subtle text-left transition-colors"
                    >
                      <span className="text-xs font-mono bg-subtle px-1.5 py-0.5 rounded text-muted">{p.code}</span>
                      <span className="text-sm text-ink">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Cantidad *</label>
              <input
                type="number" min="1" value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Peso (kg)</label>
              <input
                type="number" step="0.01" min="0" value={totalWeight}
                onChange={(e) => setTotalWeight(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Cliente</label>
            <div className="relative">
              <input
                type="text"
                value={clientQuery}
                onChange={(e) => {
                  setClientQuery(e.target.value);
                  setCOpen(true);
                  clearTimeout(cTimer.current);
                  cTimer.current = setTimeout(() => searchClients(e.target.value), 300);
                }}
                onBlur={() => setTimeout(() => setCOpen(false), 150)}
                className="w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all"
              />
              {cOpen && cResults.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-line rounded-xl shadow-card overflow-hidden">
                  {cResults.map((c) => (
                    <button key={c.id} type="button"
                      onMouseDown={() => { setClientId(c.id); setClientQuery(c.name); setClientType(c.clientType); setCOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-subtle text-left transition-colors"
                    >
                      <span className="text-sm text-ink">{c.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.clientType === 'Mayorista' ? 'bg-accent-50 text-accent-600' : 'bg-brand-50 text-brand-500'}`}>
                        {c.clientType}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Tipo de cliente</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Detal', 'Mayorista'] as ClientType[]).map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => setClientType(t)}
                  className={`py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${
                    clientType === t
                      ? t === 'Detal' ? 'bg-brand-500 border-brand-500 text-white' : 'bg-accent-600 border-accent-600 text-white'
                      : 'bg-white border-line text-muted hover:border-brand-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium border border-line rounded-xl hover:bg-subtle transition-colors">
              Cancelar
            </button>
            <button
              type="button" onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2.5 text-sm font-medium bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl transition-colors"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Lightbox({
  urls,
  index,
  onClose,
  onNav,
}: {
  urls: string[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onNav(index - 1);
      if (e.key === 'ArrowRight' && index < urls.length - 1) onNav(index + 1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, index, urls.length, onNav]);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-center gap-3">
        <button
          onClick={() => onNav(index - 1)}
          disabled={index === 0}
          className="shrink-0 p-2 rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-0 text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex flex-col items-center gap-2 min-w-0">
          <button
            onClick={onClose}
            className="self-end p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <img
            src={urls[index]}
            alt={`Evidencia ${index + 1}`}
            className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
          />
          {urls.length > 1 && (
            <p className="text-white/60 text-xs">{index + 1} / {urls.length}</p>
          )}
        </div>
        <button
          onClick={() => onNav(index + 1)}
          disabled={index === urls.length - 1}
          className="shrink-0 p-2 rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-0 text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function EvidenceBlock({
  movement,
  rol,
  onEvidenceUploaded,
}: {
  movement: Movement;
  rol: string;
  onEvidenceUploaded: (urls: string[]) => void;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const canUpload = EVIDENCE_UPLOAD_ROLES.includes(rol);
  const urls = movement.evidenceUrls ?? [];

  const handleUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast('El archivo no puede superar 10 MB', 'error'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/v1/movements/${movement.id}/evidence`, { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Error al subir evidencia', 'error'); return; }
      const updated: Movement = await res.json();
      onEvidenceUploaded(updated.evidenceUrls ?? []);
      toast('Evidencia agregada correctamente');
    } catch {
      toast('Error de conexión', 'error');
    } finally {
      setUploading(false);
    }
  };

  const showAddButton = !movement.isAnnulled && canUpload && urls.length < MAX_EVIDENCE;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider">
        Evidencia fotográfica
        {urls.length > 0 && <span className="ml-1.5 font-normal normal-case text-muted">({urls.length})</span>}
      </p>

      {urls.length === 0 && !showAddButton && (
        <p className="text-xs text-muted italic">Sin evidencia</p>
      )}

      {(urls.length > 0 || showAddButton) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {urls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="group relative h-24 rounded-xl overflow-hidden border border-line shadow-card-sm bg-subtle hover:border-brand-300 transition-colors"
            >
              <img src={url} alt={`Evidencia ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                <svg
                  width="20" height="20" viewBox="0 0 20 20" fill="none"
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"
                >
                  <path d="M8 3H4a1 1 0 0 0-1 1v4m14-5h-4a1 1 0 0 1 1 1v4m-14 5v4a1 1 0 0 0 1 1h4m10-1v-4a1 1 0 0 1 1-1h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          ))}

          {showAddButton && (
            <button
              type="button"
              onClick={() => !uploading && inputRef.current?.click()}
              className="h-24 rounded-xl border-2 border-dashed border-line bg-subtle hover:border-brand-300 flex flex-col items-center justify-center gap-1.5 text-muted hover:text-ink transition-colors"
            >
              {uploading ? (
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="34" strokeDashoffset="12" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1.5" y="3" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="6.5" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.1" />
                  <path d="M1.5 13l4.5-4 3.5 3.5 2.5-2 4.5 4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <span className="text-xs font-medium">{uploading ? 'Subiendo…' : 'Agregar'}</span>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
              />
            </button>
          )}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          urls={urls}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNav={setLightboxIndex}
        />
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 px-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 bg-subtle rounded-xl animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
      ))}
    </div>
  );
}

function TypeDropdown({
  value,
  onChange,
}: {
  value: MovementType[];
  onChange: (v: MovementType[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (type: MovementType) => {
    onChange(value.includes(type) ? value.filter((t) => t !== type) : [...value, type]);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-2 px-3 py-2.5 text-sm border border-line rounded-xl hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all bg-white min-w-[140px]"
      >
        <span className="flex-1 text-left text-sm text-ink">
          {value.length === 0 ? 'Todos los tipos' : `${value.length} tipo${value.length > 1 ? 's' : ''}`}
        </span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 top-full mt-1 w-48 bg-white border border-line rounded-xl shadow-card overflow-hidden animate-fade-in">
          {ALL_MOVEMENT_TYPES.map((type) => (
            <label
              key={type}
              onMouseDown={(e) => e.preventDefault()}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-subtle cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(type)}
                onChange={() => toggle(type)}
                className="rounded border-line accent-brand-500"
              />
              <TypeBadge type={type} />
            </label>
          ))}
          {value.length > 0 && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange([])}
              className="w-full px-3 py-2 text-xs text-muted hover:text-ink hover:bg-subtle transition-colors text-left border-t border-line"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-muted w-28 shrink-0">{label}</span>
      <span className="text-xs text-ink font-medium">{value}</span>
    </div>
  );
}

function ExportButton({
  filterTypes,
  filterProductId,
  filterStart,
  filterEnd,
}: {
  filterTypes: MovementType[];
  filterProductId: string;
  filterStart: string;
  filterEnd: string;
}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const buildParams = () => {
    const params = new URLSearchParams();
    if (filterTypes.length === 1) params.set('type', filterTypes[0]);
    if (filterProductId) params.set('productId', filterProductId);
    if (filterStart) params.set('startDate', filterStart);
    if (filterEnd) params.set('endDate', `${filterEnd}T23:59:59`);
    return params;
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setIsOpen(false);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/movements/export?${buildParams()}`);
      if (!res.ok) throw new Error();
      const movements: Movement[] = await res.json();
      if (movements.length === 0) {
        toast('No hay movimientos para exportar', 'error');
        return;
      }
      if (format === 'excel') {
        exportToExcel(movements);
      } else {
        exportToPdf(movements);
      }
    } catch {
      toast('No se pudo generar el archivo', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !isLoading && setIsOpen((p) => !p)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        disabled={isLoading}
        className="px-4 py-2.5 text-sm font-medium border border-line rounded-xl hover:bg-subtle text-muted transition-colors flex items-center gap-1.5 disabled:opacity-60"
      >
        {isLoading ? (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" strokeDasharray="26" strokeDashoffset="9" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 4 3-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 10v1.5A1.5 1.5 0 0 0 3.5 13h7a1.5 1.5 0 0 0 1.5-1.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        )}
        Exportar
      </button>
      {isOpen && (
        <div className="absolute z-20 top-full mt-1 right-0 bg-white border border-line rounded-xl shadow-card min-w-[160px] animate-fade-in overflow-hidden">
          <button
            type="button"
            onMouseDown={() => handleExport('excel')}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-subtle text-ink cursor-pointer transition-colors"
          >
            <span>📊</span>
            <span>Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onMouseDown={() => handleExport('pdf')}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-subtle text-ink cursor-pointer transition-colors"
          >
            <span>📄</span>
            <span>PDF (.pdf)</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function MovementHistoryClient({ rol }: { rol: string }) {
  const { toast } = useToast();
  const canAnnul = ANNUL_ROLES.includes(rol);
  const [localEvidence, setLocalEvidence] = useState<Record<string, string[]>>({});

  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [annulTarget, setAnnulTarget] = useState<Movement | null>(null);
  const [dispatchTarget, setDispatchTarget] = useState<Movement | null>(null);

  const [filterTypes, setFilterTypes] = useState<MovementType[]>([]);
  const [filterProductQuery, setFilterProductQuery] = useState('');
  const [filterProductId, setFilterProductId] = useState('');
  const [filterProductResults, setFilterProductResults] = useState<ProductOption[]>([]);
  const [filterProductOpen, setFilterProductOpen] = useState(false);
  const [filterUser, setFilterUser] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const productTimer = useRef<ReturnType<typeof setTimeout>>();

  const searchFilterProduct = useCallback(async (q: string) => {
    if (!q.trim()) { setFilterProductResults([]); return; }
    try {
      const res = await fetch(`/api/v1/products/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setFilterProductResults(await res.json().then((d: unknown) => (Array.isArray(d) ? d : [])));
    } catch { setFilterProductResults([]); }
  }, []);

  const fetchMovements = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (filterTypes.length === 1) params.set('type', filterTypes[0]);
      if (filterProductId) params.set('productId', filterProductId);
      if (filterStart) params.set('startDate', filterStart);
      if (filterEnd) params.set('endDate', `${filterEnd}T23:59:59`);
      const res = await fetch(`/api/v1/movements?${params}`);
      if (!res.ok) { toast('Error al cargar historial', 'error'); return; }
      const data: MovementsPage = await res.json();
      setMovements(Array.isArray(data) ? data : (data.data ?? []));
      setTotalPages((data as MovementsPage).totalPages ?? 1);
    } catch {
      toast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterTypes, filterProductId, filterStart, filterEnd, toast]);

  useEffect(() => {
    setPage(1);
    fetchMovements(1);
  }, [fetchMovements]);

  const filtered = filterTypes.length <= 1 && !filterUser
    ? movements
    : movements.filter((m) => {
        const typeOk = filterTypes.length === 0 || filterTypes.includes(m.type);
        const userOk = !filterUser || `${m.user.nombre} ${m.user.apellido}`.toLowerCase().includes(filterUser.toLowerCase());
        return typeOk && userOk;
      });

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchMovements(p);
    setExpandedId(null);
  };

  const handleAnnulDone = () => {
    setAnnulTarget(null);
    fetchMovements(page);
  };

  const handleDispatchDone = () => {
    setDispatchTarget(null);
    fetchMovements(page);
  };

  const applyFilters = () => {
    setPage(1);
    fetchMovements(1);
    setExpandedId(null);
  };

  const clearFilters = () => {
    setFilterTypes([]);
    setFilterProductQuery('');
    setFilterProductId('');
    setFilterUser('');
    setFilterStart('');
    setFilterEnd('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Tipo</label>
            <TypeDropdown value={filterTypes} onChange={setFilterTypes} />
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Producto</label>
            <div className="relative">
              <input
                type="text"
                value={filterProductQuery}
                placeholder="Buscar producto…"
                onChange={(e) => {
                  setFilterProductQuery(e.target.value);
                  if (!e.target.value) setFilterProductId('');
                  setFilterProductOpen(true);
                  clearTimeout(productTimer.current);
                  productTimer.current = setTimeout(() => searchFilterProduct(e.target.value), 300);
                }}
                onBlur={() => setTimeout(() => setFilterProductOpen(false), 150)}
                className="w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 bg-white transition-all"
              />
              {filterProductOpen && filterProductResults.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-line rounded-xl shadow-card overflow-hidden">
                  {filterProductResults.map((p) => (
                    <button
                      key={p.id} type="button"
                      onMouseDown={() => { setFilterProductId(p.id); setFilterProductQuery(p.name); setFilterProductOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-subtle text-left transition-colors"
                    >
                      <span className="text-xs font-mono bg-subtle px-1.5 py-0.5 rounded text-muted">{p.code}</span>
                      <span className="text-sm text-ink">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Usuario</label>
            <input
              type="text"
              value={filterUser}
              placeholder="Nombre del usuario…"
              onChange={(e) => setFilterUser(e.target.value)}
              className="px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 bg-white transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Desde</label>
            <input
              type="date"
              value={filterStart}
              onChange={(e) => setFilterStart(e.target.value)}
              className="px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 bg-white transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Hasta</label>
            <input
              type="date"
              value={filterEnd}
              onChange={(e) => setFilterEnd(e.target.value)}
              className="px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 bg-white transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyFilters}
              className="px-4 py-2.5 text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-colors"
            >
              Filtrar
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2.5 text-sm font-medium border border-line rounded-xl hover:bg-subtle text-muted transition-colors"
            >
              Limpiar
            </button>
            <ExportButton
              filterTypes={filterTypes}
              filterProductId={filterProductId}
              filterStart={filterStart}
              filterEnd={filterEnd}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-line mb-4">
              <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="1.8" />
              <path d="M14 20h20M14 28h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M6 18h36" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <p className="text-sm font-semibold text-ink mb-1">Sin movimientos</p>
            <p className="text-xs text-muted">No hay resultados para los filtros aplicados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider whitespace-nowrap">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Cant.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((mov) => (
                  <Fragment key={mov.id}>
                    <tr
                      onClick={() => setExpandedId((p) => (p === mov.id ? null : mov.id))}
                      className={`border-b border-line cursor-pointer transition-colors ${expandedId === mov.id ? 'bg-subtle' : 'hover:bg-subtle/60'}`}
                    >
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{fmt(mov.date)}</td>
                      <td className="px-4 py-3"><TypeBadge type={mov.type} /></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm text-ink font-medium leading-snug">{mov.product.name}</span>
                          <span className="text-xs text-muted font-mono">{mov.product.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-ink">{mov.quantity}</td>
                      <td className="px-4 py-3 text-sm text-ink whitespace-nowrap">
                        {mov.user.nombre} {mov.user.apellido}
                      </td>
                      <td className="px-4 py-3"><StatusBadge isAnnulled={mov.isAnnulled} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {canAnnul && !mov.isAnnulled && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setAnnulTarget(mov); }}
                              className="px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-red-50 text-muted hover:text-red-600 transition-colors"
                            >
                              Anular
                            </button>
                          )}
                          {canAnnul && !mov.isAnnulled && mov.type === 'VENTA' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDispatchTarget(mov); }}
                              className="px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-brand-50 text-muted hover:text-brand-600 transition-colors whitespace-nowrap"
                            >
                              Editar despacho
                            </button>
                          )}
                          <svg
                            width="16" height="16" viewBox="0 0 16 16" fill="none"
                            className={`text-muted transition-transform shrink-0 ${expandedId === mov.id ? 'rotate-180' : ''}`}
                          >
                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </td>
                    </tr>
                    {expandedId === mov.id && (
                      <tr key={`${mov.id}-detail`}>
                        <td colSpan={7} className="px-4 py-4 bg-subtle border-b border-line">
                          <div className="animate-fade-in grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                            <DetailRow label="ID" value={<span className="font-mono text-xs">{mov.id}</span>} />
                            <DetailRow label="Fecha registro" value={fmt(mov.createdAt)} />
                            {mov.observations && <DetailRow label="Observaciones" value={mov.observations} />}
                            {mov.client && <DetailRow label="Cliente" value={mov.client.name} />}
                            {mov.clientType && <DetailRow label="Tipo cliente" value={mov.clientType} />}
                            {mov.totalWeight != null && <DetailRow label="Peso total" value={`${mov.totalWeight} kg`} />}
                            {mov.returnCause && <DetailRow label="Causa devolución" value={mov.returnCause} />}
                            {mov.returnDescription && <DetailRow label="Descripción" value={mov.returnDescription} />}
                            {mov.sourceLocation && <DetailRow label="Origen" value={mov.sourceLocation} />}
                            {mov.targetLocation && <DetailRow label="Destino" value={mov.targetLocation} />}
                            {(mov.type === 'AJUSTE_INGRESO' || mov.type === 'AJUSTE_SALIDA') && mov.sourceMovementId && (
                              <DetailRow
                                label="Movimiento corregido"
                                value={<span className="font-mono text-xs">{mov.sourceMovementId}</span>}
                              />
                            )}
                            {mov.isAnnulled && (
                              <>
                                <DetailRow label="Anulado por" value={mov.annulledBy ? `${mov.annulledBy.nombre} ${mov.annulledBy.apellido}` : '—'} />
                                <DetailRow label="Fecha anulación" value={mov.annulledAt ? fmt(mov.annulledAt) : '—'} />
                                <DetailRow label="Motivo anulación" value={mov.annulledReason ?? '—'} />
                              </>
                            )}
                            {SALIDA_TYPES.includes(mov.type) && (
                              <div className="sm:col-span-2 pt-1">
                                <EvidenceBlock
                                  movement={{ ...mov, evidenceUrls: localEvidence[mov.id] ?? mov.evidenceUrls }}
                                  rol={rol}
                                  onEvidenceUploaded={(urls) =>
                                    setLocalEvidence((prev) => ({ ...prev, [mov.id]: urls }))
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-line rounded-lg hover:bg-subtle disabled:opacity-40 transition-colors"
          >
            Anterior
          </button>
          <span className="text-sm text-muted">Página {page} de {totalPages}</span>
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-line rounded-lg hover:bg-subtle disabled:opacity-40 transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}

      <AnnulModal
        open={!!annulTarget}
        movement={annulTarget}
        onClose={() => setAnnulTarget(null)}
        onDone={handleAnnulDone}
      />

      <EditDispatchModal
        open={!!dispatchTarget}
        movement={dispatchTarget}
        onClose={() => setDispatchTarget(null)}
        onDone={handleDispatchDone}
      />
    </div>
  );
}
