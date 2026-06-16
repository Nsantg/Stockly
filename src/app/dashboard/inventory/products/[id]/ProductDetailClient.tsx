'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '../../types';
import { MovementType, TYPE_BADGE, TYPE_LABELS } from '@/app/dashboard/movements/types';

interface ExpirationAlert {
  lotId: string;
  lotNumber: string;
  productId: string;
  expirationDate: string;
  daysUntilExpiration: number;
  stock: number;
  level: 'CRITICAL' | 'WARNING';
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

function daysBadgeClasses(days: number): string {
  if (days <= 7) return 'bg-red-50 text-red-600 border-red-100';
  if (days <= 30) return 'bg-orange-50 text-orange-600 border-orange-100';
  return 'bg-amber-50 text-amber-600 border-amber-100';
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
  const [expAlerts, setExpAlerts] = useState<ExpirationAlert[]>([]);
  const [expLoading, setExpLoading] = useState(true);
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/products/${id}`)
      .then((r) => r.json())
      .then(setProduct)
      .catch(() => {})
      .finally(() => setProductLoading(false));

    fetch('/api/v1/alerts/expiration?days=30')
      .then((r) => r.json())
      .then((data: ExpirationAlert[]) => {
        const filtered = Array.isArray(data)
          ? data.filter((a) => a.productId === id).sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration)
          : [];
        setExpAlerts(filtered);
      })
      .catch(() => {})
      .finally(() => setExpLoading(false));

    fetch(`/api/v1/movements?productId=${id}&limit=8`)
      .then((r) => r.json())
      .then((data) => setMovements(data.data ?? []))
      .catch(() => {})
      .finally(() => setMovementsLoading(false));
  }, [id]);

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
        {/* Section B: Expiration alerts */}
        <div
          className="bg-white rounded-2xl shadow-card p-6 animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="text-orange-500">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M1 6H15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M5 1V3M11 1V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M5 9H5.01M8 9H8.01M11 9H11.01M5 11.5H5.01M8 11.5H8.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-ink">Lotes próximos a vencer</h2>
            {!expLoading && expAlerts.length > 0 && (
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-full">
                {expAlerts.length}
              </span>
            )}
          </div>

          {expLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-subtle animate-pulse rounded-xl"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          ) : expAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7.5 11L10 13.5L14.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-ink">Sin vencimientos próximos</p>
              <p className="text-xs text-muted mt-1">No hay lotes que venzan en los próximos 30 días</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="text-left pb-2.5 pr-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
                      Lote
                    </th>
                    <th className="text-left pb-2.5 pr-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
                      Vencimiento
                    </th>
                    <th className="text-left pb-2.5 pr-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
                      Días rest.
                    </th>
                    <th className="text-right pb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expAlerts.map((alert, i) => (
                    <tr
                      key={alert.lotId}
                      className={`border-b border-subtle last:border-0 animate-fade-in-up ${
                        alert.level === 'CRITICAL' ? 'bg-red-50/40' : ''
                      }`}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="py-3 pr-3 font-mono text-xs text-ink">{alert.lotNumber}</td>
                      <td className="py-3 pr-3 text-xs text-muted">{formatDate(alert.expirationDate)}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${daysBadgeClasses(alert.daysUntilExpiration)}`}
                        >
                          {alert.daysUntilExpiration} días
                        </span>
                      </td>
                      <td className="py-3 text-right text-xs text-muted">{alert.stock} u.</td>
                    </tr>
                  ))}
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
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-line mb-3">
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
