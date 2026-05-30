'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export type UserRole = 'Admin' | 'Almacenista' | 'Despachador' | 'Visualizador'
type MovementType =
  | 'ENTRADA'
  | 'VENTA'
  | 'DAÑO'
  | 'VENCIMIENTO'
  | 'DEVOLUCION'
  | 'AJUSTE_INGRESO'
  | 'AJUSTE_SALIDA'
  | 'TRASLADO'

interface DashboardUser {
  nombre: string
  apellido: string
  rol: UserRole
}

interface ProductSummary {
  totalProducts: number
  totalStock: number
  lowStockCount: number
}

interface LowStockProduct {
  id: string
  code: string
  name: string
  stock: number
  minStock: number
}

interface RecentMovement {
  id: string
  type: MovementType
  product: { name: string }
  user: { nombre: string; apellido: string }
  date: string
}

interface MovementsResponse {
  data: RecentMovement[]
  total: number
}

interface ProductsResponse {
  data: LowStockProduct[]
}

const TYPE_LABELS: Record<MovementType, string> = {
  ENTRADA: 'Entrada',
  VENTA: 'Venta',
  DAÑO: 'Daño',
  VENCIMIENTO: 'Vencimiento',
  DEVOLUCION: 'Devolución',
  AJUSTE_INGRESO: 'Aj. Ingreso',
  AJUSTE_SALIDA: 'Aj. Salida',
  TRASLADO: 'Traslado',
}

const TYPE_BADGE: Record<MovementType, string> = {
  ENTRADA: 'bg-brand-50 text-brand-500 border-brand-100',
  VENTA: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  DAÑO: 'bg-red-50 text-red-600 border-red-100',
  VENCIMIENTO: 'bg-orange-50 text-orange-600 border-orange-100',
  DEVOLUCION: 'bg-purple-50 text-purple-600 border-purple-100',
  AJUSTE_INGRESO: 'bg-teal-50 text-teal-600 border-teal-100',
  AJUSTE_SALIDA: 'bg-amber-50 text-amber-700 border-amber-100',
  TRASLADO: 'bg-slate-50 text-slate-600 border-slate-100',
}

const TYPE_BAR_COLOR: Record<MovementType, string> = {
  ENTRADA: '#1B3B6F',
  VENTA: '#059669',
  DAÑO: '#DC2626',
  VENCIMIENTO: '#EA580C',
  DEVOLUCION: '#9333EA',
  AJUSTE_INGRESO: '#0D9488',
  AJUSTE_SALIDA: '#D97706',
  TRASLADO: '#475569',
}

function getGreeting(nombre: string): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return `Buenos días, ${nombre}`
  if (h >= 12 && h < 18) return `Buenas tardes, ${nombre}`
  return `Buenas noches, ${nombre}`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

function IconBox() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 7.5L10 4L17 7.5V13L10 16.5L3 13V7.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 4V16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 7.5L10 11L17 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconWarehouse() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M2 18V9L10 3L18 9V18" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="7" y="11" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3L18 16H2L10 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 9V12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.8" fill="currentColor" />
    </svg>
  )
}

function IconTruck() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="6" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 9H15.5L18 12V15H12V9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="5" cy="15.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="15" cy="15.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 10L8.5 14.5L16 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function KpiCard({
  icon,
  label,
  value,
  accent,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  accent?: boolean
  delay: number
}) {
  return (
    <div
      className="animate-fade-in-up bg-white rounded-2xl shadow-card p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
          accent ? 'bg-accent-50 text-accent-500' : 'bg-brand-50 text-brand-500'
        }`}
      >
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">{label}</p>
      <p
        className={`text-3xl font-bold tracking-tight ${
          accent ? 'text-accent-500' : 'text-ink'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function KpiSkeleton({ delay }: { delay: number }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-card p-6 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-10 h-10 rounded-xl bg-subtle animate-pulse mb-4" />
      <div className="h-3 bg-subtle rounded animate-pulse w-24 mb-3" />
      <div className="h-8 bg-subtle rounded animate-pulse w-14" />
    </div>
  )
}

function BarChart({ typeCounts }: { typeCounts: Partial<Record<MovementType, number>> }) {
  const entries = (Object.entries(typeCounts) as [MovementType, number][]).filter(
    ([, v]) => v > 0,
  )

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted">
        Sin movimientos en la última semana
      </div>
    )
  }

  const max = Math.max(...entries.map(([, v]) => v))
  const CHART_H = 112

  return (
    <div className="overflow-x-auto -mx-1">
      <div className="flex items-end gap-4 px-1 min-w-max" style={{ height: 152 }}>
        {entries.map(([type, count]) => {
          const barH = Math.max(6, Math.round((count / max) * CHART_H))
          return (
            <div
              key={type}
              className="flex flex-col items-center gap-1.5 group"
              style={{ minWidth: 44 }}
            >
              <span className="text-xs font-semibold text-ink opacity-0 group-hover:opacity-100 transition-opacity select-none">
                {count}
              </span>
              <div
                className="w-9 rounded-t-md transition-all duration-500"
                style={{ height: barH, backgroundColor: TYPE_BAR_COLOR[type] }}
                title={`${TYPE_LABELS[type]}: ${count}`}
              />
              <span className="text-[10px] text-muted font-medium text-center leading-tight" style={{ maxWidth: 44 }}>
                {TYPE_LABELS[type]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChartSkeleton() {
  const heights = [70, 110, 45, 90, 30, 75, 55]
  return (
    <div className="flex items-end gap-4 px-1" style={{ height: 152 }}>
      {heights.map((h, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5" style={{ minWidth: 44 }}>
          <div
            className="w-9 rounded-t-md bg-subtle animate-pulse"
            style={{ height: h, animationDelay: `${i * 55}ms` }}
          />
          <div
            className="h-2.5 bg-subtle rounded animate-pulse w-9"
            style={{ animationDelay: `${i * 55}ms` }}
          />
        </div>
      ))}
    </div>
  )
}

function ActivityItem({ movement, index }: { movement: RecentMovement; index: number }) {
  return (
    <div
      className="flex items-center gap-3 py-3 border-b border-subtle last:border-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
          TYPE_BADGE[movement.type]
        }`}
      >
        {TYPE_LABELS[movement.type]}
      </span>
      <span className="text-sm text-ink truncate flex-1">{movement.product.name}</span>
      <span className="text-xs text-muted shrink-0 hidden sm:block">
        {movement.user.nombre} {movement.user.apellido[0]}.
      </span>
      <span className="text-xs text-muted shrink-0">{timeAgo(movement.date)}</span>
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-3 border-b border-subtle last:border-0 animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="h-5 bg-subtle rounded-full w-16 shrink-0" />
          <div className="h-3.5 bg-subtle rounded flex-1" />
          <div className="h-3 bg-subtle rounded w-14 shrink-0" />
          <div className="h-3 bg-subtle rounded w-16 shrink-0" />
        </div>
      ))}
    </div>
  )
}

function AlertItem({ product, index }: { product: LowStockProduct; index: number }) {
  const isCritical = product.stock === 0
  return (
    <div
      className="flex items-center gap-3 py-3 border-b border-subtle last:border-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{product.name}</p>
        <p className="text-xs text-muted">{product.code}</p>
      </div>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
          isCritical
            ? 'bg-red-50 text-red-600 border-red-100'
            : 'bg-accent-50 text-accent-600 border-accent-100'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isCritical ? 'bg-red-500' : 'bg-accent-500'
          }`}
        />
        {isCritical ? 'Sin stock' : `${product.stock} / ${product.minStock}`}
      </span>
      <Link
        href="/dashboard/movements"
        className="shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-brand-50 text-brand-500 hover:bg-brand-100 transition-colors"
      >
        Entrada
      </Link>
    </div>
  )
}

function AlertSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-12 bg-subtle rounded-xl animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  )
}

function QuickActions({ rol }: { rol: UserRole }) {
  const canWrite = rol === 'Admin' || rol === 'Almacenista'
  const canDispatch = rol === 'Admin' || rol === 'Despachador'

  const actions: { label: string; href: string; color: string; icon: React.ReactNode }[] = [
    ...(canWrite
      ? [
          {
            label: 'Registrar entrada',
            href: '/dashboard/movements',
            color: 'bg-brand-50 text-brand-500 hover:bg-brand-100',
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 4V18M4 11H18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ),
          },
        ]
      : []),
    ...(canDispatch
      ? [
          {
            label: 'Nuevo despacho',
            href: '/dashboard/movements',
            color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M4 11H18M13 6L18 11L13 16"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
          },
        ]
      : []),
    {
      label: 'Ver inventario',
      href: '/dashboard/inventory',
      color: 'bg-surface text-ink hover:bg-subtle',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M3 8L11 4L19 8V14L11 18L3 14V8Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M11 4V18M3 8L11 12L19 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: 'Movimientos',
      href: '/dashboard/movements',
      color: 'bg-surface text-ink hover:bg-subtle',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 11H18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path
            d="M13 6L18 11L13 16"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M9 6L4 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    ...(rol === 'Admin'
      ? [
          {
            label: 'Usuarios',
            href: '/dashboard/users',
            color: 'bg-surface text-ink hover:bg-subtle',
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M3 19c0-3.314 2.686-6 6-6s6 2.686 6 6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path d="M17 3v6M14 6h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map(({ label, href, icon, color }, i) => (
        <Link
          key={label}
          href={href}
          className={`flex flex-col items-center gap-2.5 p-4 rounded-xl transition-colors animate-fade-in-up ${color}`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {icon}
          <span className="text-xs font-semibold text-center leading-tight">{label}</span>
        </Link>
      ))}
    </div>
  )
}

export default function DashboardClient({ user }: { user: DashboardUser }) {
  const [summary, setSummary] = useState<ProductSummary | null>(null)
  const [todayDispatches, setTodayDispatches] = useState<number | null>(null)
  const [chartData, setChartData] = useState<Partial<Record<MovementType, number>> | null>(null)
  const [recentMovements, setRecentMovements] = useState<RecentMovement[] | null>(null)
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[] | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    Promise.all([
      fetch('/api/v1/products/summary').then<ProductSummary>((r) => r.json()),
      fetch(
        `/api/v1/movements?type=VENTA&startDate=${today}&endDate=${today}&limit=1`,
      ).then<MovementsResponse>((r) => r.json()),
      fetch(
        `/api/v1/movements?startDate=${sevenDaysAgo}&endDate=${today}&limit=500`,
      ).then<MovementsResponse>((r) => r.json()),
      fetch('/api/v1/products?limit=200').then<ProductsResponse>((r) => r.json()),
    ])
      .then(([sum, dispatches, weekMvts, products]) => {
        setSummary(sum)
        setTodayDispatches(dispatches.total ?? 0)

        const counts: Partial<Record<MovementType, number>> = {}
        for (const m of weekMvts.data ?? []) {
          counts[m.type] = (counts[m.type] ?? 0) + 1
        }
        setChartData(counts)

        const recent = [...(weekMvts.data ?? [])]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
        setRecentMovements(recent)

        const prods = products.data ?? []
        setLowStockProducts(prods.filter((p) => p.stock <= p.minStock))
      })
      .catch(() => {
        setSummary({ totalProducts: 0, totalStock: 0, lowStockCount: 0 })
        setTodayDispatches(0)
        setChartData({})
        setRecentMovements([])
        setLowStockProducts([])
      })
  }, [])

  const kpiReady = summary !== null && todayDispatches !== null

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="text-xl font-semibold text-ink">{getGreeting(user.nombre)}</h2>
        <p className="text-sm text-muted mt-0.5">Aquí está el resumen de operaciones de hoy.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!kpiReady ? (
          <>
            <KpiSkeleton delay={0} />
            <KpiSkeleton delay={80} />
            <KpiSkeleton delay={160} />
            <KpiSkeleton delay={240} />
          </>
        ) : (
          <>
            <KpiCard
              icon={<IconBox />}
              label="Total productos"
              value={summary.totalProducts.toLocaleString('es-CO')}
              delay={0}
            />
            <KpiCard
              icon={<IconWarehouse />}
              label="Stock total"
              value={summary.totalStock.toLocaleString('es-CO')}
              delay={80}
            />
            <KpiCard
              icon={<IconAlert />}
              label="Stock bajo"
              value={summary.lowStockCount}
              accent={summary.lowStockCount > 0}
              delay={160}
            />
            <KpiCard
              icon={<IconTruck />}
              label="Despachos hoy"
              value={todayDispatches}
              delay={240}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div
            className="animate-fade-in-up bg-white rounded-2xl shadow-card p-6"
            style={{ animationDelay: '300ms' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-5">
              Movimientos por tipo · última semana
            </p>
            {chartData === null ? <ChartSkeleton /> : <BarChart typeCounts={chartData} />}
          </div>

          <div
            className="animate-fade-in-up bg-white rounded-2xl shadow-card p-6"
            style={{ animationDelay: '380ms' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                Actividad reciente
              </p>
              <Link
                href="/dashboard/movements"
                className="text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
              >
                Ver todos →
              </Link>
            </div>
            {recentMovements === null ? (
              <ActivitySkeleton />
            ) : recentMovements.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">Sin movimientos recientes</p>
            ) : (
              <div>
                {recentMovements.map((m, i) => (
                  <ActivityItem key={m.id} movement={m} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div
            className="animate-fade-in-up bg-white rounded-2xl shadow-card p-6"
            style={{ animationDelay: '340ms' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                Alertas de stock
              </p>
              {lowStockProducts !== null && lowStockProducts.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                  {lowStockProducts.length}
                </span>
              )}
            </div>
            {lowStockProducts === null ? (
              <AlertSkeleton />
            ) : lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3 text-emerald-500">
                  <IconCheck />
                </div>
                <p className="text-sm font-semibold text-ink">Stock en orden</p>
                <p className="text-xs text-muted mt-0.5">
                  Todos los productos tienen stock suficiente
                </p>
              </div>
            ) : (
              <div>
                {lowStockProducts.slice(0, 5).map((p, i) => (
                  <AlertItem key={p.id} product={p} index={i} />
                ))}
                {lowStockProducts.length > 5 && (
                  <Link
                    href="/dashboard/inventory"
                    className="block text-center text-xs text-brand-500 hover:text-brand-600 font-medium mt-3 transition-colors"
                  >
                    +{lowStockProducts.length - 5} más · Ver inventario
                  </Link>
                )}
              </div>
            )}
          </div>

          <div
            className="animate-fade-in-up bg-white rounded-2xl shadow-card p-6"
            style={{ animationDelay: '420ms' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">
              Accesos rápidos
            </p>
            <QuickActions rol={user.rol} />
          </div>
        </div>
      </div>
    </div>
  )
}
