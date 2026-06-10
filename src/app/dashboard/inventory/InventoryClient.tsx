'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Category, Subcategory, Product, ProductSummary, PaginatedProducts } from './types';
import ProductFormPanel from './ProductFormPanel';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

const WRITE_ROLES = ['Admin', 'Almacenista'];
const LIMIT = 20;

function IconBox() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 7.5L11 3.5L19 7.5V14.5L11 18.5L3 14.5V7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 3.5V18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 7.5L11 11.5L19 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconStack() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9H15M7 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 3L20 19H2L11 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 10V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="11" cy="16.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function IconSnowflake() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-blue-400">
      <path d="M7 1V13M1 7H13M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SummaryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6 animate-pulse">
      <div className="h-4 w-24 bg-subtle rounded mb-4" />
      <div className="h-8 w-16 bg-subtle rounded mb-1" />
      <div className="h-3 w-20 bg-subtle rounded" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 bg-subtle rounded-lg animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-line mb-4">
        <rect x="8" y="16" width="48" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M20 28H44M20 36H36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 24H56" stroke="currentColor" strokeWidth="2" />
      </svg>
      <p className="text-sm font-medium text-ink mb-1">
        {query ? `Sin resultados para "${query}"` : 'No hay productos registrados'}
      </p>
      <p className="text-xs text-muted">
        {query ? 'Prueba con otro término de búsqueda' : 'Agrega el primer producto para empezar'}
      </p>
    </div>
  );
}

function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Sin stock
      </span>
    );
  }
  if (stock <= minStock) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
        {stock}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {stock}
    </span>
  );
}

export default function InventoryClient({ rol }: { rol: string }) {
  const { toast } = useToast();
  const canWrite = WRITE_ROLES.includes(rol);

  const [summary, setSummary] = useState<ProductSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Product | null>(null);

  useEffect(() => {
    fetch('/api/v1/products/summary')
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {})
      .finally(() => setSummaryLoading(false));

    fetch('/api/v1/categories')
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      setSelectedSubcategory('');
      return;
    }
    fetch(`/api/v1/subcategories?categoryId=${selectedCategory}`)
      .then((r) => r.json())
      .then((data) => setSubcategories(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => setSubcategories([]));
    setSelectedSubcategory('');
    setPage(1);
  }, [selectedCategory]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedCategory) params.set('categoryId', selectedCategory);
    if (selectedSubcategory) params.set('subcategoryId', selectedSubcategory);
    try {
      const res = await fetch(`/api/v1/products?${params}`);
      const data: PaginatedProducts = await res.json();
      setProducts(data.data ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast('Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedCategory, selectedSubcategory, toast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const refreshSummary = () => {
    fetch('/api/v1/products/summary')
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {});
  };

  const handleSaved = (updated: Product, isNew: boolean) => {
    setPanelOpen(false);
    setEditingProduct(null);
    if (isNew) {
      fetchProducts();
    } else {
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
    refreshSummary();
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setPanelOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmTarget) return;
    const target = confirmTarget;
    setConfirmTarget(null);
    setProducts((prev) => prev.filter((p) => p.id !== target.id));
    setTotal((prev) => prev - 1);
    try {
      const res = await fetch(`/api/v1/products/${target.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Producto eliminado');
      refreshSummary();
    } catch {
      toast('Error al eliminar producto', 'error');
      fetchProducts();
      refreshSummary();
    }
  };

  const summaryCards = [
    {
      label: 'Total productos',
      value: summary?.totalProducts ?? 0,
      icon: <IconBox />,
      color: 'text-brand-500',
      bg: 'bg-brand-50',
    },
    {
      label: 'Unidades en stock',
      value: summary?.totalStock ?? 0,
      icon: <IconStack />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Stock bajo',
      value: summary?.lowStockCount ?? 0,
      icon: <IconAlert />,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h2 className="text-xl font-semibold text-ink">Inventario</h2>
          <p className="text-sm text-muted mt-0.5">Gestión de productos y stock</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/inventory/categories"
            className="text-xs font-medium text-brand-500 hover:text-brand-700 transition-colors"
          >
            Categorías
          </Link>
          {canWrite && (
            <button
              onClick={() => { setEditingProduct(null); setPanelOpen(true); }}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1V13M1 7H13" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Nuevo producto
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryLoading
          ? Array.from({ length: 3 }).map((_, i) => <SummaryCardSkeleton key={i} />)
          : summaryCards.map((card, i) => (
              <div
                key={card.label}
                style={{ animationDelay: `${i * 80}ms` }}
                className="animate-fade-in-up bg-white rounded-2xl shadow-card p-6"
              >
                <div className={`inline-flex p-2.5 rounded-xl ${card.bg} ${card.color} mb-4`}>
                  {card.icon}
                </div>
                <p className="text-2xl font-bold text-ink">{card.value.toLocaleString()}</p>
                <p className="text-xs text-muted mt-0.5">{card.label}</p>
              </div>
            ))}
      </div>

      <div className="animate-fade-in-up animation-delay-240 bg-white rounded-2xl shadow-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por código o nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-line rounded-xl bg-subtle/40 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-line rounded-xl px-3 py-2.5 bg-subtle/40 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all min-w-[160px]"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={selectedSubcategory}
            onChange={(e) => { setSelectedSubcategory(e.target.value); setPage(1); }}
            disabled={!selectedCategory}
            className="text-sm border border-line rounded-xl px-3 py-2.5 bg-subtle/40 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all min-w-[160px] disabled:opacity-40"
          >
            <option value="">Todas las subcategorías</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : products.length === 0 ? (
          <EmptyState query={debouncedSearch} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Código</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Nombre</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted hidden md:table-cell">Categoría</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted hidden lg:table-cell">Subcategoría</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Stock total</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted hidden sm:table-cell">Bodega</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted hidden sm:table-cell">Vitrina</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted hidden sm:table-cell">Refrig.</th>
                  {canWrite && <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-subtle/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-muted">{p.code}</td>
                    <td className="py-3 px-3 font-medium text-ink">{p.name}</td>
                    <td className="py-3 px-3 text-muted hidden md:table-cell">
                      {p.subcategory?.category?.name ?? '—'}
                    </td>
                    <td className="py-3 px-3 text-muted hidden lg:table-cell">
                      {p.subcategory?.name ?? '—'}
                    </td>
                    <td className="py-3 px-3">
                      <StockBadge stock={p.stock} minStock={p.minStock} />
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        (p.stockBodega ?? 0) <= 0
                          ? 'bg-red-50 text-red-500'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {p.stockBodega ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        (p.stockVitrina ?? 0) <= 0
                          ? 'bg-subtle text-muted'
                          : 'bg-brand-50 text-brand-600'
                      }`}>
                        {p.stockVitrina ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center hidden sm:table-cell">
                      {p.requiresRefrigeration ? <IconSnowflake /> : <span className="text-muted">—</span>}
                    </td>
                    {canWrite && (
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-brand-50 text-muted hover:text-brand-600 transition-colors"
                            title="Editar"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setConfirmTarget(p)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors"
                            title="Eliminar"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2 3.5H12M5 3.5V2.5H9V3.5M4.5 3.5V11.5H9.5V3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-subtle">
            <p className="text-xs text-muted">
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-line hover:bg-subtle disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <span className="px-3 py-1.5 text-xs text-muted">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-line hover:bg-subtle disabled:opacity-40 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmTarget}
        title={`¿Eliminar "${confirmTarget?.name}"?`}
        description="Esta acción no se puede deshacer."
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmTarget(null)}
      />

      <ProductFormPanel
        open={panelOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => { setPanelOpen(false); setEditingProduct(null); }}
        onSaved={handleSaved}
      />
    </div>
  );
}
