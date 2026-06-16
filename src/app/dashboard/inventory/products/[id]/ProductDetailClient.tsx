'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '../../types';
import { MovementType, TYPE_BADGE, TYPE_LABELS } from '@/app/dashboard/movements/types';

interface Lot {
  id: string;
  lotNumber: string;
  stock: number;
  expirationDate: string | null;
  createdAt: string;
}

interface MovementItem {
  id: string;
  type: MovementType;
  quantity: number;
  date: string;
  user: { nombre: string };
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

function getLotStatus(expirationDate: string | null): { label: string; classes: string } {
  if (!expirationDate) {
    return { label: 'Sin fecha', classes: 'bg-slate-50 text-slate-500 border-slate-100' };
  }
  const exp = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (exp < today) {
    return { label: 'Vencido', classes: 'bg-red-50 text-red-600 border-red-100' };
  }
  const diffDays = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) {
    return { label: 'Próximo', classes: 'bg-orange-50 text-orange-600 border-orange-100' };
  }
  return { label: 'Vigente', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'hoy';
  if (sameDay(date, yesterday)) return 'ayer';

  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return `${diffDays} días`;

  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function ProductDetailClient({ id }: { id: string; rol: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [lots, setLots] = useState<Lot[]>([]);
  const [lotsLoading, setLotsLoading] = useState(true);
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/products/${id}`)
      .then((r) => r.json())
      .then(setProduct)
      .catch(() => {})
      .finally(() => setProductLoading(false));

    fetch(`/api/v1/lots?productId=${id}`)
      .then((r) => r.json())
      .then((data) => setLots(Array.isArray(data) ? data : (data.data ?? [])))
      .catch(() => {})
      .finally(() => setLotsLoading(false));

    fetch(`/api/v1/movements?productId=${id}&limit=8`)
      .then((r) => r.json())
      .then((data) => setMovements(data.data ?? []))
      .catch(() => {})
      .finally(() => setMovementsLoading(false));
  }, [id]);

  const sortedLots = [...lots].sort((a, b) => {
    if (!a.expirationDate && !b.expirationDate) return 0;
    if (!a.expirationDate) return 1;
    if (!b.expirationDate) return -1;
    return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/inventory"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Volver al inventario
      </Link>

      {/* Section A: Product header */}
      <div
        className="bg-white rounded-2xl shadow-card p-6 animate-fade-in-up"
        style={{ animationDelay: '0ms' }}
      >
        {productLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-5 w-20 bg-subtle rounded" />
            <div className="h-7 w-64 bg-subtle rounded" />
            <div className="flex gap-2">
              <div className="h-6 w-32 bg-subtle rounded-full" />
              <div className="h-6 w-24 bg-subtle rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="h-20 bg-subtle rounded-xl" />
              <div className="h-20 bg-subtle rounded-xl" />
              <div className="h-20 bg-subtle rounded-xl" />
            </div>
            <div className="h-4 w-36 bg-subtle rounded" />
          </div>
        ) : product ? (
          <>
            <div className="mb-3">
              <span className="bg-brand-50 text-brand-500 text-xs font-mono px-2 py-0.5 rounded">
                {product.code}
              </span>
            </div>
            <h1 className="text-xl font-bold text-ink mb-4">{product.name}</h1>

            {/* Metadata row 1 */}
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-subtle rounded-full text-xs text-ink font-medium">
                {product.subcategory?.category?.name}
                <span className="text-muted mx-0.5">›</span>
                {product.subcategory?.name}
              </span>
              {product.requiresRefrigeration && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                  ❄ Refrigeración
                </span>
              )}
              {product.serialNumber && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-subtle rounded-full text-xs text-ink font-medium">
                  N/S: {product.serialNumber}
                </span>
              )}
            </div>

            {/* Metadata row 2 */}
            {(product.barcode || product.weight !== null) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.barcode && (
                  <span className="inline-flex items-center px-3 py-1 bg-subtle rounded-full text-xs text-muted font-mono">
                    {product.barcode}
                  </span>
                )}
                {product.weight !== null && (
                  <span className="inline-flex items-center px-3 py-1 bg-subtle rounded-full text-xs text-muted">
                    {product.weight} kg
                  </span>
                )}
              </div>
            )}

            {/* Stock grid */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {(
                [
                  { label: 'Stock total', value: product.stock },
                  { label: 'Bodega', value: product.stockBodega },
                  { label: 'Vitrina', value: product.stockVitrina },
                ] as const
              ).map(({ label, value }) => (
                <div key={label} className="bg-subtle/60 rounded-xl p-4 flex flex-col gap-2">
                  <p className="text-xs text-muted">{label}</p>
                  <StockBadge stock={value} minStock={product.minStock} />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted">Stock mínimo: {product.minStock} u.</p>
          </>
        ) : (
          <p className="text-sm text-muted">Producto no encontrado.</p>
        )}
      </div>

      {/* Sections B & C */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section B: Active lots */}
        <div
          className="bg-white rounded-2xl shadow-card p-6 animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink">Lotes activos</h2>
            {!lotsLoading && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-brand-50 text-brand-500 rounded-full">
                {sortedLots.length}
              </span>
            )}
          </div>

          {lotsLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-subtle animate-pulse rounded-xl"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          ) : sortedLots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                className="text-line mb-3"
              >
                <rect
                  x="6"
                  y="12"
                  width="36"
                  height="28"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path d="M6 20H42" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M16 12V8M32 12V8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M15 30H33M20 36H28"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-sm font-medium text-ink mb-0.5">Sin lotes registrados</p>
              <p className="text-xs text-muted">No se encontraron lotes para este producto</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="text-left py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      Lote
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      Vencimiento
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      Stock
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {sortedLots.map((lot) => {
                    const status = getLotStatus(lot.expirationDate);
                    return (
                      <tr key={lot.id} className="hover:bg-subtle/40 transition-colors">
                        <td className="py-2.5 px-2 font-mono text-xs text-ink">
                          {lot.lotNumber}
                        </td>
                        <td className="py-2.5 px-2 text-xs text-muted">
                          {lot.expirationDate ? formatDate(lot.expirationDate) : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-xs font-semibold text-ink">
                          {lot.stock}
                        </td>
                        <td className="py-2.5 px-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${status.classes}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section C: Recent movements */}
        <div
          className="bg-white rounded-2xl shadow-card p-6 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink">Movimientos recientes</h2>
            <Link
              href={`/dashboard/movements?productId=${id}`}
              className="text-xs font-medium text-brand-500 hover:text-brand-600 hover:underline transition-colors"
            >
              Ver todos →
            </Link>
          </div>

          {movementsLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-subtle animate-pulse rounded-xl"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                className="text-line mb-3"
              >
                <path
                  d="M8 24H40M28 12L40 24L28 36"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm font-medium text-ink mb-0.5">Sin movimientos registrados</p>
              <p className="text-xs text-muted">Aún no hay movimientos para este producto</p>
            </div>
          ) : (
            <ul className="divide-y divide-subtle">
              {movements.map((mv) => (
                <li key={mv.id} className="py-3 flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${TYPE_BADGE[mv.type]}`}
                  >
                    {TYPE_LABELS[mv.type]}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="text-sm text-ink font-medium">{mv.quantity} u.</span>{' '}
                    <span className="text-xs text-muted">por {mv.user?.nombre}</span>
                  </span>
                  <span className="text-xs text-muted shrink-0">
                    {formatRelativeDate(mv.date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
