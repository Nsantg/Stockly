'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Category, Subcategory } from '../types';
import { useToast } from '@/components/ui/Toast';

const WRITE_ROLES = ['Admin', 'Almacenista'];

interface CategoryWithSubs extends Category {
  subcategories: Subcategory[];
  expanded: boolean;
}

interface CatFormData {
  name: string;
  requiresRefrigeration: boolean;
  allowsSerialNumber: boolean;
}

interface SubFormData {
  name: string;
}

const EMPTY_CAT: CatFormData = { name: '', requiresRefrigeration: false, allowsSerialNumber: false };
const EMPTY_SUB: SubFormData = { name: '' };

function CategoryModal({
  open,
  category,
  onClose,
  onSaved,
}: {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<CatFormData>(EMPTY_CAT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(
      category
        ? { name: category.name, requiresRefrigeration: category.requiresRefrigeration, allowsSerialNumber: category.allowsSerialNumber }
        : EMPTY_CAT,
    );
    setError('');
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    setSaving(true);
    try {
      const url = category ? `/api/v1/categories/${category.id}` : '/api/v1/categories';
      const res = await fetch(url, {
        method: category ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), requiresRefrigeration: form.requiresRefrigeration, allowsSerialNumber: form.allowsSerialNumber }),
      });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Error al guardar', 'error'); return; }
      toast(category ? 'Categoría actualizada' : 'Categoría creada');
      onSaved();
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
          <h3 className="text-base font-semibold text-ink">{category ? 'Editar categoría' : 'Nueva categoría'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-subtle text-muted hover:text-ink transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setError(''); }}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'}`}
              placeholder="Nombre de la categoría"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <Toggle
            label="Requiere refrigeración"
            value={form.requiresRefrigeration}
            onChange={(v) => setForm((p) => ({ ...p, requiresRefrigeration: v }))}
          />
          <Toggle
            label="Permite número de serie"
            value={form.allowsSerialNumber}
            onChange={(v) => setForm((p) => ({ ...p, allowsSerialNumber: v }))}
          />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium border border-line rounded-xl hover:bg-subtle transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-medium bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl transition-colors"
            >
              {saving ? 'Guardando…' : category ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InlineSubForm({
  onSave,
  onCancel,
}: {
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<SubFormData>(EMPTY_SUB);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nombre requerido'); return; }
    onSave(form.name.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2 pl-4">
      <div className="flex-1">
        <input
          type="text"
          autoFocus
          value={form.name}
          onChange={(e) => { setForm({ name: e.target.value }); setError(''); }}
          className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'}`}
          placeholder="Nombre de subcategoría"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
        Agregar
      </button>
      <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-medium border border-line rounded-lg hover:bg-subtle transition-colors">
        Cancelar
      </button>
    </form>
  );
}

function EditingSubRow({
  sub,
  onSave,
  onCancel,
}: {
  sub: Subcategory;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(sub.name);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Nombre requerido'); return; }
    onSave(name.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="flex-1">
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'}`}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
        Guardar
      </button>
      <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-medium border border-line rounded-lg hover:bg-subtle transition-colors">
        Cancelar
      </button>
    </form>
  );
}

export default function CategoriesClient({ rol }: { rol: string }) {
  const { toast } = useToast();
  const canWrite = WRITE_ROLES.includes(rol);

  const [items, setItems] = useState<CategoryWithSubs[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState<{ catId: string; sub: Subcategory } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, subRes] = await Promise.all([
        fetch('/api/v1/categories'),
        fetch('/api/v1/subcategories'),
      ]);
      const cats: Category[] = await catRes.json().then((d) => (Array.isArray(d) ? d : d.data ?? []));
      const subs: Subcategory[] = await subRes.json().then((d) => (Array.isArray(d) ? d : d.data ?? []));
      setItems(
        cats.map((c) => ({
          ...c,
          subcategories: subs.filter((s) => s.categoryId === c.id),
          expanded: true,
        })),
      );
    } catch {
      toast('Error al cargar categorías', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleExpanded = (id: string) => {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c)));
  };

  const handleDeleteCat = async (cat: Category) => {
    if (!confirm(`¿Eliminar categoría "${cat.name}"?`)) return;
    try {
      const res = await fetch(`/api/v1/categories/${cat.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Error', 'error'); return; }
      toast('Categoría eliminada');
      fetchAll();
    } catch {
      toast('Error de conexión', 'error');
    }
  };

  const handleAddSub = async (catId: string, name: string) => {
    try {
      const res = await fetch('/api/v1/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, categoryId: catId }),
      });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Error', 'error'); return; }
      toast('Subcategoría agregada');
      setAddingSubFor(null);
      fetchAll();
    } catch {
      toast('Error de conexión', 'error');
    }
  };

  const handleEditSub = async (sub: Subcategory, name: string) => {
    try {
      const res = await fetch(`/api/v1/subcategories/${sub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Error', 'error'); return; }
      toast('Subcategoría actualizada');
      setEditingSub(null);
      fetchAll();
    } catch {
      toast('Error de conexión', 'error');
    }
  };

  const handleDeleteSub = async (sub: Subcategory) => {
    if (!confirm(`¿Eliminar subcategoría "${sub.name}"?`)) return;
    try {
      const res = await fetch(`/api/v1/subcategories/${sub.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Error', 'error'); return; }
      toast('Subcategoría eliminada');
      fetchAll();
    } catch {
      toast('Error de conexión', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory" className="p-1.5 rounded-lg hover:bg-subtle text-muted hover:text-ink transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L5 9L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h2 className="text-xl font-semibold text-ink">Categorías</h2>
            <p className="text-sm text-muted mt-0.5">Organización de productos</p>
          </div>
        </div>
        {canWrite && (
          <button
            onClick={() => { setEditingCat(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1V13M1 7H13" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Nueva categoría
          </button>
        )}
      </div>

      <div className="animate-fade-in-up animation-delay-80 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-2xl shadow-card animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-card text-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-line mb-3">
              <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M14 20H34M14 28H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-sm font-medium text-ink mb-1">Sin categorías</p>
            <p className="text-xs text-muted">Crea la primera categoría para empezar</p>
          </div>
        ) : (
          items.map((cat, i) => (
            <div
              key={cat.id}
              style={{ animationDelay: `${i * 60}ms` }}
              className="animate-fade-in-up bg-white rounded-2xl shadow-card overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-4">
                <button
                  onClick={() => toggleExpanded(cat.id)}
                  className="text-muted hover:text-ink transition-colors shrink-0"
                >
                  <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    className={`transition-transform ${cat.expanded ? 'rotate-90' : ''}`}
                  >
                    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink">{cat.name}</span>
                    {cat.requiresRefrigeration && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M5 0.5V9.5M0.5 5H9.5M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                        </svg>
                        Refrigeración
                      </span>
                    )}
                    {cat.allowsSerialNumber && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600 border border-purple-100">
                        # Serial
                      </span>
                    )}
                    <span className="text-xs text-muted">
                      {cat.subcategories.length} subcategoría{cat.subcategories.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {canWrite && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingCat(cat); setModalOpen(true); }}
                      className="p-1.5 rounded-lg hover:bg-brand-50 text-muted hover:text-brand-600 transition-colors"
                      title="Editar"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCat(cat)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 3.5H12M5 3.5V2.5H9V3.5M4.5 3.5V11.5H9.5V3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {cat.expanded && (
                <div className="border-t border-subtle px-5 pb-4 pt-2 space-y-1.5">
                  {cat.subcategories.length === 0 && !addingSubFor && (
                    <p className="text-xs text-muted py-1 pl-4">Sin subcategorías</p>
                  )}
                  {cat.subcategories.map((sub) => (
                    <div key={sub.id} className="pl-4">
                      {editingSub?.catId === cat.id && editingSub.sub.id === sub.id ? (
                        <EditingSubRow
                          sub={sub}
                          onSave={(name) => handleEditSub(sub, name)}
                          onCancel={() => setEditingSub(null)}
                        />
                      ) : (
                        <div className="flex items-center gap-2 group py-1">
                          <span className="text-xs text-muted mr-1">—</span>
                          <span className="text-sm text-ink flex-1">{sub.name}</span>
                          {canWrite && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingSub({ catId: cat.id, sub })}
                                className="p-1 rounded hover:bg-brand-50 text-muted hover:text-brand-600 transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path d="M8 2L10 4L4 10H2V8L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteSub(sub)}
                                className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 3H10M4 3V2.5H8V3M3.5 3V9.5H8.5V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {canWrite && (
                    <>
                      {addingSubFor === cat.id ? (
                        <InlineSubForm
                          onSave={(name) => handleAddSub(cat.id, name)}
                          onCancel={() => setAddingSubFor(null)}
                        />
                      ) : (
                        <button
                          onClick={() => { setAddingSubFor(cat.id); setEditingSub(null); }}
                          className="pl-4 mt-1 flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-700 font-medium transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          Agregar subcategoría
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <CategoryModal
        open={modalOpen}
        category={editingCat}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); fetchAll(); }}
      />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-line bg-subtle/30">
      <span className="text-sm font-medium text-ink">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative rounded-full transition-colors`}
        style={{ height: '22px', width: '40px', background: value ? '#1B3B6F' : '#E5E5EA' }}
      >
        <span
          className="absolute top-0.5 left-0.5 rounded-full bg-white shadow transition-transform"
          style={{ height: '18px', width: '18px', transform: value ? 'translateX(18px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );
}
