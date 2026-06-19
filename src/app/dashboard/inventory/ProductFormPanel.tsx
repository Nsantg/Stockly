'use client';

import { useEffect, useState } from 'react';
import { Category, Subcategory, Product, ProductFormData } from './types';
import { useToast } from '@/components/ui/Toast';

interface Props {
  open: boolean;
  product: Product | null;
  categories: Category[];
  recommendedMinStock?: number;
  onClose: () => void;
  onSaved: (updated: Product, isNew: boolean) => void;
}

const EMPTY: ProductFormData = {
  code: '',
  name: '',
  barcode: '',
  serialNumber: '',
  weight: '',
  subcategoryId: '',
  requiresRefrigeration: false,
  stock: '0',
  minStock: '0',
};

type Errors = Partial<Record<keyof ProductFormData, string>>;

function validate(data: ProductFormData, showSerial: boolean, isNew: boolean): Errors {
  const e: Errors = {};
  if (!data.code.trim()) e.code = 'El código es requerido';
  if (!data.name.trim()) e.name = 'El nombre es requerido';
  if (!data.subcategoryId) e.subcategoryId = 'Selecciona una subcategoría';
  if (data.weight && isNaN(Number(data.weight))) e.weight = 'Debe ser un número';
  if (isNew && (isNaN(Number(data.stock)) || Number(data.stock) < 0)) e.stock = 'Stock inválido';
  if (isNaN(Number(data.minStock)) || Number(data.minStock) < 0) e.minStock = 'Stock mínimo inválido';
  if (showSerial && !data.serialNumber.trim()) e.serialNumber = 'El número de serie es requerido';
  return e;
}

export default function ProductFormPanel({ open, product, categories, recommendedMinStock = 0, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<ProductFormData>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null;
  const showSerial = selectedCategory?.allowsSerialNumber ?? false;
  const refrigerationWarning = selectedCategory?.requiresRefrigeration ?? false;

  useEffect(() => {
    if (!open) return;
    if (product) {
      const catId = product.subcategory?.category?.id ?? '';
      setSelectedCategoryId(catId);
      setForm({
        code: product.code,
        name: product.name,
        barcode: product.barcode ?? '',
        serialNumber: product.serialNumber ?? '',
        weight: product.weight != null ? String(product.weight) : '',
        subcategoryId: product.subcategoryId,
        requiresRefrigeration: product.requiresRefrigeration,
        stock: String(product.stock),
        minStock: String(product.minStock),
      });
    } else {
      setForm({ ...EMPTY, minStock: String(recommendedMinStock) });
      setSelectedCategoryId('');
    }
    setErrors({});
  }, [open, product, recommendedMinStock]);

  useEffect(() => {
    if (!selectedCategoryId) {
      setSubcategories([]);
      return;
    }
    fetch(`/api/v1/subcategories?categoryId=${selectedCategoryId}`)
      .then((r) => r.json())
      .then((data) => setSubcategories(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => setSubcategories([]));
  }, [selectedCategoryId]);

  const set = (field: keyof ProductFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    setForm((prev) => ({ ...prev, subcategoryId: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form, showSerial, !product);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      const body = {
        code: form.code.trim(),
        name: form.name.trim(),
        barcode: form.barcode.trim() || null,
        serialNumber: showSerial ? form.serialNumber.trim() || null : null,
        weight: form.weight ? Number(form.weight) : null,
        subcategoryId: form.subcategoryId,
        requiresRefrigeration: form.requiresRefrigeration,
        ...(!product && { stock: Number(form.stock) }),
        minStock: Number(form.minStock),
      };

      const isNew = !product;
      const url = isNew ? '/api/v1/products' : `/api/v1/products/${product!.id}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast(err.error ?? 'Error al guardar', 'error');
        return;
      }

      const responseData = await res.json();
      const sub = subcategories.find((s) => s.id === form.subcategoryId);
      const cat = categories.find((c) => c.id === selectedCategoryId);

      const updated: Product = {
        id: isNew ? responseData.id : product!.id,
        code: body.code,
        name: body.name,
        barcode: body.barcode,
        serialNumber: body.serialNumber,
        weight: body.weight,
        subcategoryId: form.subcategoryId,
        subcategory: { ...sub!, category: cat! } as Product['subcategory'],
        requiresRefrigeration: form.requiresRefrigeration,
        stock: Number(form.stock),
        stockBodega: responseData.stockBodega ?? (isNew ? Number(form.stock) : product?.stockBodega ?? 0),
        stockVitrina: responseData.stockVitrina ?? (isNew ? 0 : product?.stockVitrina ?? 0),
        minStock: Number(form.minStock),
        isActive: true,
      };

      toast(isNew ? 'Producto creado' : 'Producto actualizado');
      onSaved(updated, isNew);
    } catch {
      toast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
          <h3 className="text-base font-semibold text-ink">
            {product ? 'Editar producto' : 'Nuevo producto'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-subtle text-muted hover:text-ink transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {refrigerationWarning && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-amber-500 mt-0.5 shrink-0">
                <path d="M8 2L15 14H1L8 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M8 7V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="8" cy="12" r="0.6" fill="currentColor" />
              </svg>
              <p className="text-xs text-amber-700 font-medium">
                Esta categoría requiere refrigeración. Asegúrate de activar el campo correspondiente.
              </p>
            </div>
          )}

          <Field label="Código *" error={errors.code}>
            <input
              type="text"
              value={form.code}
              onChange={(e) => set('code', e.target.value)}
              className={input(!!errors.code)}
              placeholder="PRD-001"
            />
          </Field>

          <Field label="Nombre *" error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={input(!!errors.name)}
              placeholder="Nombre del producto"
            />
          </Field>

          <Field label="Categoría *" error={errors.subcategoryId}>
            <select
              value={selectedCategoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={input(!!errors.subcategoryId)}
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Subcategoría *" error={errors.subcategoryId}>
            <select
              value={form.subcategoryId}
              onChange={(e) => set('subcategoryId', e.target.value)}
              disabled={!selectedCategoryId}
              className={`${input(!!errors.subcategoryId)} disabled:opacity-40`}
            >
              <option value="">Seleccionar subcategoría</option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Código de barras" error={errors.barcode}>
            <input
              type="text"
              value={form.barcode}
              onChange={(e) => set('barcode', e.target.value)}
              className={input(false)}
              placeholder="Opcional"
            />
          </Field>

          {showSerial && (
            <Field label="Número de serie *" error={errors.serialNumber}>
              <input
                type="text"
                value={form.serialNumber}
                onChange={(e) => set('serialNumber', e.target.value)}
                className={input(!!errors.serialNumber)}
                placeholder="SN-XXXX"
              />
            </Field>
          )}

          <Field label="Peso (kg)" error={errors.weight}>
            <input
              type="number"
              step="0.001"
              min="0"
              value={form.weight}
              onChange={(e) => set('weight', e.target.value)}
              className={input(!!errors.weight)}
              placeholder="0.000"
            />
          </Field>

          <div className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-line bg-subtle/30">
            <span className="text-sm font-medium text-ink">Requiere refrigeración</span>
            <button
              type="button"
              onClick={() => set('requiresRefrigeration', !form.requiresRefrigeration)}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${
                form.requiresRefrigeration ? 'bg-brand-500' : 'bg-line'
              }`}
              style={{ height: '22px', width: '40px' }}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-transform ${
                  form.requiresRefrigeration ? 'translate-x-[18px]' : 'translate-x-0'
                }`}
                style={{ height: '18px', width: '18px' }}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {product ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Stock actual</label>
                <div className={`${input(false)} bg-subtle text-muted cursor-not-allowed select-none`}>
                  {form.stock}
                </div>
                <p className="text-[11px] text-muted leading-tight">
                  Usa movimientos para modificar el stock
                </p>
              </div>
            ) : (
              <Field label="Stock inicial" error={errors.stock}>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => set('stock', e.target.value)}
                  className={input(!!errors.stock)}
                />
              </Field>
            )}
            <Field label="Stock mínimo" error={errors.minStock}>
              <input
                type="number"
                min="0"
                value={form.minStock}
                onChange={(e) => set('minStock', e.target.value)}
                className={input(!!errors.minStock)}
              />
              {!product && recommendedMinStock > 0 && (
                <p className="text-[11px] text-muted leading-tight">
                  Recomendado por el admin: {recommendedMinStock}
                </p>
              )}
            </Field>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-line flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium border border-line rounded-xl hover:bg-subtle transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-medium bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
                <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
            {saving ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-muted uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 animate-shake">{error}</p>}
    </div>
  );
}

function input(hasError: boolean) {
  return `w-full px-3 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 transition-all ${
    hasError
      ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
      : 'border-line focus:ring-brand-100 focus:border-brand-400'
  }`;
}
