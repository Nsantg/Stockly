'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MovementType, ClientType, ProductDetail, ClientOption, TYPE_LABELS, ALL_MOVEMENT_TYPES } from './types';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

const SALIDA_TYPES: MovementType[] = ['VENTA', 'DAÑO', 'VENCIMIENTO', 'AJUSTE_SALIDA'];
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_EVIDENCE = 4;

const TYPE_ROLES: Record<MovementType, string[]> = {
  ENTRADA: ['Admin', 'Almacenista'],
  VENTA: ['Admin', 'Almacenista', 'Despachador'],
  DAÑO: ['Admin', 'Almacenista', 'Despachador'],
  VENCIMIENTO: ['Admin', 'Almacenista', 'Despachador'],
  TRASLADO: ['Admin', 'Almacenista', 'Despachador'],
  DEVOLUCION: ['Admin', 'Almacenista'],
  AJUSTE_INGRESO: ['Admin', 'Almacenista'],
  AJUSTE_SALIDA: ['Admin', 'Almacenista'],
};

const DESTRUCTIVE: MovementType[] = ['DAÑO', 'VENCIMIENTO', 'AJUSTE_SALIDA'];

const TYPE_CARD: Record<MovementType, { selected: string; icon: () => React.ReactElement }> = {
  ENTRADA: {
    selected: 'bg-brand-500 border-brand-500 text-white',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3v12M5 10l6 7 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  VENTA: {
    selected: 'bg-emerald-700 border-emerald-700 text-white',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M5 6h12l-2 9H7L5 6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M9 6V5a2 2 0 0 1 4 0v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="9" cy="18" r="1" fill="currentColor" />
        <circle cx="15" cy="18" r="1" fill="currentColor" />
      </svg>
    ),
  },
  DAÑO: {
    selected: 'bg-red-600 border-red-600 text-white',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 4L19.5 18.5H2.5L11 4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M11 10v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="11" cy="15.5" r="0.9" fill="currentColor" />
      </svg>
    ),
  },
  VENCIMIENTO: {
    selected: 'bg-orange-600 border-orange-600 text-white',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.4" />
        <path d="M11 7v4l3 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  DEVOLUCION: {
    selected: 'bg-purple-600 border-purple-600 text-white',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M7 7H15C17.5 7 19.5 9 19.5 11.5C19.5 14 17.5 16 15 16H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M7 4L4 7L7 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  AJUSTE_INGRESO: {
    selected: 'bg-teal-600 border-teal-600 text-white',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  AJUSTE_SALIDA: {
    selected: 'bg-amber-700 border-amber-700 text-white',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 11h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  TRASLADO: {
    selected: 'bg-slate-600 border-slate-600 text-white',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 8h14M15 5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 14H4M7 11l-3 3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

const BTN_CLASS: Record<MovementType, string> = {
  ENTRADA: 'bg-brand-500 hover:bg-brand-600',
  VENTA: 'bg-emerald-700 hover:bg-emerald-800',
  DAÑO: 'bg-red-600 hover:bg-red-700',
  VENCIMIENTO: 'bg-orange-600 hover:bg-orange-700',
  DEVOLUCION: 'bg-purple-600 hover:bg-purple-700',
  AJUSTE_INGRESO: 'bg-teal-600 hover:bg-teal-700',
  AJUSTE_SALIDA: 'bg-amber-700 hover:bg-amber-800',
  TRASLADO: 'bg-slate-600 hover:bg-slate-700',
};

interface FormState {
  quantity: string;
  proveedor: string;
  observacionSelect: string;
  observations: string;
  clientId: string;
  clientQuery: string;
  clientType: ClientType;
  totalWeight: string;
  returnCause: string;
  returnDescription: string;
  motivo: string;
}

const EMPTY_FORM: FormState = {
  quantity: '',
  proveedor: '',
  observacionSelect: '',
  observations: '',
  clientId: '',
  clientQuery: '',
  clientType: 'Detal',
  totalWeight: '',
  returnCause: '',
  returnDescription: '',
  motivo: '',
};

interface ProductOptionLocal { id: string; code: string; name: string; }

function ProductSearch({
  query,
  onQueryChange,
  onSelect,
  error,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  onSelect: (p: ProductOptionLocal) => void;
  error?: string;
}) {
  const [results, setResults] = useState<ProductOptionLocal[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    try {
      const res = await fetch(`/api/v1/products/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json().then((d) => (Array.isArray(d) ? d : [])));
    } catch { setResults([]); }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onQueryChange(v);
    setOpen(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(v), 300);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => query && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Buscar por nombre o código…"
        className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
          error ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'
        }`}
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full bg-white border border-line rounded-xl shadow-card overflow-hidden">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => { onSelect(p); onQueryChange(p.name); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-subtle text-left transition-colors"
            >
              <span className="text-xs font-mono bg-subtle px-1.5 py-0.5 rounded text-muted shrink-0">{p.code}</span>
              <span className="text-sm text-ink">{p.name}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function ClientSearch({
  query,
  onQueryChange,
  onSelect,
  error,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  onSelect: (c: ClientOption) => void;
  error?: string;
}) {
  const [results, setResults] = useState<ClientOption[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    try {
      const res = await fetch(`/api/v1/clients/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json().then((d) => (Array.isArray(d) ? d : [])));
    } catch { setResults([]); }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onQueryChange(v);
    setOpen(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(v), 300);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => query && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Buscar cliente…"
        className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
          error ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'
        }`}
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full bg-white border border-line rounded-xl shadow-card overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => { onSelect(c); onQueryChange(c.name); setOpen(false); }}
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
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  );
}

function EvidenceMultiZone({
  files,
  onAdd,
  onRemove,
}: {
  files: File[];
  onAdd: (f: File) => void;
  onRemove: (i: number) => void;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const validateAndAdd = (f: File) => {
    if (!ALLOWED_MIME.includes(f.type)) { toast('Formato no permitido. Use JPEG, PNG o WebP', 'error'); return; }
    if (f.size > 10 * 1024 * 1024) { toast('El archivo no puede superar 10 MB', 'error'); return; }
    if (files.length >= MAX_EVIDENCE) return;
    onAdd(f);
  };

  const handleFileList = (list: FileList) => {
    const slots = MAX_EVIDENCE - files.length;
    Array.from(list).slice(0, slots).forEach(validateAndAdd);
  };

  const AddCell = () => (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFileList(e.dataTransfer.files); }}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-all duration-150 text-muted ${
        files.length === 0 ? 'py-8 w-full' : 'h-28'
      } ${dragging ? 'border-brand-400 bg-brand-50' : 'border-line bg-subtle hover:border-brand-300 hover:text-ink'}`}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="4" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="8" cy="9" r="1.8" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2 16l5-4 3.5 3.5 2.5-2.5 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {files.length === 0 ? (
        <>
          <span className="text-sm">Agregar evidencia fotográfica</span>
          <span className="text-xs">Opcional · JPEG, PNG o WebP · Máx. 10 MB · Hasta {MAX_EVIDENCE} imágenes</span>
        </>
      ) : (
        <span className="text-xs font-medium">Agregar</span>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { if (e.target.files) handleFileList(e.target.files); e.target.value = ''; }}
      />
    </button>
  );

  if (files.length === 0) return <AddCell />;

  return (
    <div className="grid grid-cols-2 gap-2">
      {files.map((f, i) => (
        <div key={i} className="relative h-28 rounded-xl overflow-hidden border border-line shadow-card-sm">
          {previews[i] && (
            <img src={previews[i]} alt={`Evidencia ${i + 1}`} className="w-full h-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 hover:bg-red-50 text-ink hover:text-red-600 transition-colors shadow-sm"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/30 backdrop-blur-sm">
            <p className="text-xs text-white truncate">{f.name}</p>
          </div>
        </div>
      ))}
      {files.length < MAX_EVIDENCE && <AddCell />}
    </div>
  );
}

export default function NewMovementClient({ rol, initialType }: { rol: string; initialType?: MovementType | null }) {
  const { toast } = useToast();
  const allowedTypes = ALL_MOVEMENT_TYPES.filter((t) => TYPE_ROLES[t].includes(rol));

  const [selectedType, setSelectedType] = useState<MovementType | null>(
    initialType && allowedTypes.includes(initialType) ? initialType : null,
  );
  const [productQuery, setProductQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [productError, setProductError] = useState('');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const handleProductSelect = useCallback(async (p: ProductOptionLocal) => {
    setProductError('');
    try {
      const res = await fetch(`/api/v1/products/${p.id}`);
      if (res.ok) {
        const d = await res.json();
        setSelectedProduct({
          id: d.id,
          code: d.code,
          name: d.name,
          stock: d.stock ?? 0,
          allowsSerialNumber: d.subcategory?.category?.allowsSerialNumber ?? false,
        });
      }
    } catch {
      setSelectedProduct({ id: p.id, code: p.code, name: p.name, stock: 0, allowsSerialNumber: false });
    }
  }, []);

  const handleTypeSelect = (type: MovementType) => {
    setSelectedType(type);
    setForm(EMPTY_FORM);
    setErrors({});
    setProductQuery('');
    setSelectedProduct(null);
    setProductError('');
    if (!SALIDA_TYPES.includes(type)) setEvidenceFiles([]);
  };

  const validate = (): boolean => {
    let pErr = '';
    const next: Partial<Record<string, string>> = {};

    if (!selectedProduct) pErr = 'Selecciona un producto';

    const qty = parseInt(form.quantity, 10);
    if (!form.quantity || isNaN(qty) || qty <= 0) next.quantity = 'Ingresa una cantidad válida';

    if (selectedType === 'VENTA' && !form.clientId) next.clientQuery = 'Selecciona un cliente';

    if (selectedType === 'DEVOLUCION') {
      if (!form.clientId) next.clientQuery = 'Selecciona un cliente';
      if (!form.returnCause.trim()) next.returnCause = 'La causa es requerida';
      if (selectedProduct && !selectedProduct.allowsSerialNumber) {
        pErr = 'Este producto no admite devoluciones';
      }
    }

    if ((selectedType === 'AJUSTE_INGRESO' || selectedType === 'AJUSTE_SALIDA') && !form.motivo.trim()) {
      next.motivo = 'El motivo es requerido';
    }

    setProductError(pErr);
    setErrors(next);
    return !pErr && Object.keys(next).length === 0;
  };

  const buildBody = () => {
    const body: Record<string, unknown> = {
      type: selectedType,
      productId: selectedProduct!.id,
      quantity: parseInt(form.quantity, 10),
    };

    if (selectedType === 'ENTRADA') {
      const parts = [
        form.proveedor.trim() ? `Proveedor: ${form.proveedor.trim()}` : '',
        form.observacionSelect || '',
      ].filter(Boolean);
      if (parts.length) body.observations = parts.join(' — ');
    }

    if (selectedType === 'DAÑO' || selectedType === 'VENCIMIENTO') {
      if (form.observations.trim()) body.observations = form.observations.trim();
    }

    if (selectedType === 'VENTA') {
      body.clientId = form.clientId;
      body.clientType = form.clientType;
      if (form.totalWeight) body.totalWeight = parseFloat(form.totalWeight);
    }

    if (selectedType === 'DEVOLUCION') {
      body.clientId = form.clientId;
      body.returnCause = form.returnCause.trim();
      if (form.returnDescription.trim()) body.returnDescription = form.returnDescription.trim();
    }

    if (selectedType === 'AJUSTE_INGRESO' || selectedType === 'AJUSTE_SALIDA') {
      body.observations = form.motivo.trim();
    }

    return body;
  };

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody()),
      });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Error al registrar', 'error'); return; }
      const created = await res.json();
      const movementId: string = created?.movement?.id ?? created?.id ?? null;

      if (evidenceFiles.length > 0 && movementId && SALIDA_TYPES.includes(selectedType!)) {
        let anyFailed = false;
        for (const file of evidenceFiles) {
          const fd = new FormData();
          fd.append('file', file);
          try {
            const evRes = await fetch(`/api/v1/movements/${movementId}/evidence`, { method: 'POST', body: fd });
            if (!evRes.ok) anyFailed = true;
          } catch {
            anyFailed = true;
          }
        }
        if (anyFailed) {
          toast('Movimiento registrado pero alguna imagen no pudo subirse', 'error');
        }
      }

      toast(`${TYPE_LABELS[selectedType!]} registrada correctamente`);
      setSelectedType(null);
      setProductQuery('');
      setSelectedProduct(null);
      setForm(EMPTY_FORM);
      setErrors({});
      setEvidenceFiles([]);
    } catch {
      toast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedType || !validate()) return;
    if (DESTRUCTIVE.includes(selectedType)) { setConfirmOpen(true); return; }
    submit();
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-card p-6">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Tipo de movimiento</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {allowedTypes.map((type) => {
            const cfg = TYPE_CARD[type];
            const selected = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeSelect(type)}
                className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all ${
                  selected ? cfg.selected : 'bg-white border-line text-muted hover:border-brand-200 hover:text-ink hover:bg-subtle'
                }`}
              >
                {cfg.icon()}
                <span className="text-xs font-semibold leading-tight text-center">{TYPE_LABELS[type]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedType && (
        <div key={selectedType} className="animate-fade-in-up bg-white rounded-2xl shadow-card p-6 space-y-5">
          <Field label="Producto" required>
            <ProductSearch
              query={productQuery}
              onQueryChange={(v) => { setProductQuery(v); if (!v) setSelectedProduct(null); }}
              onSelect={handleProductSelect}
              error={productError}
            />
            {selectedProduct && (
              <div className="flex items-center gap-2 px-3 py-2 bg-subtle rounded-lg">
                <span className="text-xs text-muted">Stock actual:</span>
                <span className={`text-xs font-semibold ${selectedProduct.stock <= 0 ? 'text-red-500' : 'text-emerald-700'}`}>
                  {selectedProduct.stock} unidades
                </span>
              </div>
            )}
          </Field>

          <Field label="Cantidad" required>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setField('quantity', e.target.value)}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                errors.quantity ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'
              }`}
              placeholder="0"
            />
            {errors.quantity && <p className="text-xs text-red-500">{errors.quantity}</p>}
          </Field>

          {selectedType === 'ENTRADA' && (
            <>
              <Field label="Proveedor">
                <input
                  type="text"
                  value={form.proveedor}
                  onChange={(e) => setField('proveedor', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all"
                  placeholder="Nombre del proveedor"
                />
              </Field>
              <Field label="Observaciones">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: '', l: 'Sin observación' },
                    { v: 'Producto dañado', l: 'Producto dañado' },
                    { v: 'Cantidad incorrecta', l: 'Cantidad incorrecta' },
                  ].map(({ v, l }) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setField('observacionSelect', v)}
                      className={`py-2 px-1 text-xs font-medium rounded-xl border-2 transition-all text-center leading-tight ${
                        form.observacionSelect === v
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'bg-white border-line text-muted hover:border-brand-200'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {selectedType === 'VENTA' && (
            <>
              <Field label="Cliente" required>
                <ClientSearch
                  query={form.clientQuery}
                  onQueryChange={(v) => { setField('clientQuery', v); if (!v) setField('clientId', ''); }}
                  onSelect={(c) => {
                    setField('clientId', c.id);
                    setField('clientType', c.clientType);
                    setField('clientQuery', c.name);
                    setErrors((p) => ({ ...p, clientQuery: undefined }));
                  }}
                  error={errors.clientQuery}
                />
              </Field>
              <Field label="Tipo de cliente">
                <div className="grid grid-cols-2 gap-2">
                  {(['Detal', 'Mayorista'] as ClientType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setField('clientType', t)}
                      className={`py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${
                        form.clientType === t
                          ? t === 'Detal' ? 'bg-brand-500 border-brand-500 text-white' : 'bg-accent-600 border-accent-600 text-white'
                          : 'bg-white border-line text-muted hover:border-brand-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Peso total (kg)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.totalWeight}
                  onChange={(e) => setField('totalWeight', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all"
                  placeholder="0.00"
                />
              </Field>
            </>
          )}

          {(selectedType === 'DAÑO' || selectedType === 'VENCIMIENTO') && (
            <Field label="Observaciones">
              <textarea
                value={form.observations}
                onChange={(e) => setField('observations', e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all resize-none"
                placeholder="Describe las condiciones o el motivo…"
              />
            </Field>
          )}

          {selectedType === 'DEVOLUCION' && (
            <>
              <Field label="Cliente" required>
                <ClientSearch
                  query={form.clientQuery}
                  onQueryChange={(v) => { setField('clientQuery', v); if (!v) setField('clientId', ''); }}
                  onSelect={(c) => { setField('clientId', c.id); setField('clientQuery', c.name); setErrors((p) => ({ ...p, clientQuery: undefined })); }}
                  error={errors.clientQuery}
                />
              </Field>
              <Field label="Causa" required>
                <input
                  type="text"
                  value={form.returnCause}
                  onChange={(e) => setField('returnCause', e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.returnCause ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'
                  }`}
                  placeholder="Motivo de la devolución"
                />
                {errors.returnCause && <p className="text-xs text-red-500">{errors.returnCause}</p>}
              </Field>
              <Field label="Descripción adicional">
                <textarea
                  value={form.returnDescription}
                  onChange={(e) => setField('returnDescription', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all resize-none"
                  placeholder="Detalles adicionales…"
                />
              </Field>
            </>
          )}

          {(selectedType === 'AJUSTE_INGRESO' || selectedType === 'AJUSTE_SALIDA') && (
            <Field label="Motivo" required>
              <input
                type="text"
                value={form.motivo}
                onChange={(e) => setField('motivo', e.target.value)}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.motivo ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'
                }`}
                placeholder="Describe el motivo del ajuste"
              />
              {errors.motivo && <p className="text-xs text-red-500">{errors.motivo}</p>}
            </Field>
          )}

          {SALIDA_TYPES.includes(selectedType) && (
            <div className="animate-fade-in space-y-1.5">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                Evidencia fotográfica
                {evidenceFiles.length > 0 && (
                  <span className="ml-2 text-brand-500 normal-case font-normal">
                    {evidenceFiles.length}/{MAX_EVIDENCE}
                  </span>
                )}
              </label>
              <EvidenceMultiZone
                files={evidenceFiles}
                onAdd={(f) => setEvidenceFiles((prev) => [...prev, f])}
                onRemove={(i) => setEvidenceFiles((prev) => prev.filter((_, idx) => idx !== i))}
              />
            </div>
          )}

          <div className="pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className={`w-full py-3 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-60 ${BTN_CLASS[selectedType]}`}
            >
              {saving ? 'Registrando…' : `Registrar ${TYPE_LABELS[selectedType]}`}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={`¿Confirmar ${selectedType ? TYPE_LABELS[selectedType].toLowerCase() : ''}?`}
        description="Esta operación modifica el inventario y puede ser difícil de revertir."
        confirmLabel="Confirmar"
        onConfirm={() => { setConfirmOpen(false); submit(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
