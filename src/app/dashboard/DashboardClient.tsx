'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

export type UserRole = 'Admin' | 'Almacenista' | 'Despachador' | 'Visualizador'

type Period = 'today' | 'week' | 'month' | 'year'

type MovementType =
  | 'ENTRADA'
  | 'VENTA'
  | 'DAÑO'
  | 'VENCIMIENTO'
  | 'DEVOLUCION'
  | 'AJUSTE_INGRESO'
  | 'AJUSTE_SALIDA'
  | 'TRASLADO'

interface RecentMovement {
  id: string
  type: MovementType
  product: { name: string }
  quantity: number
  date: string
}

interface MovementsResponse {
  data: RecentMovement[]
  total: number
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

interface DashboardUser {
  nombre: string
  apellido: string
  rol: UserRole
}

interface DashboardKpis {
  dispatchedUnits: number
  dispatchCount: number
  entryCount: number
  topClient: { clientId: string; clientName: string; totalPurchases: number } | null
  maxStockProduct: { productId: string; productName: string; stock: number } | null
  minStockProduct: { productId: string; productName: string; stock: number } | null
  stockPercentage: number
  topRotationProduct: { productId: string; productName: string; totalDispatched: number } | null
  rotationIndex: number
  damagedIndex: number
  discardRate: number
}

const DEFAULT_KPIS: DashboardKpis = {
  dispatchedUnits: 0,
  dispatchCount: 0,
  entryCount: 0,
  topClient: null,
  maxStockProduct: null,
  minStockProduct: null,
  stockPercentage: 0,
  topRotationProduct: null,
  rotationIndex: 0,
  damagedIndex: 0,
  discardRate: 0,
}

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Este mes' },
  { id: 'year', label: 'Este año' },
]

function getPeriodDates(period: Period): { startDate: string; endDate: string } {
  const now = new Date()
  const end = new Date(now)
  end.setUTCHours(23, 59, 59, 999)
  const start = new Date(now)
  start.setUTCHours(0, 0, 0, 0)
  if (period === 'week') {
    const day = start.getUTCDay()
    start.setUTCDate(start.getUTCDate() - (day === 0 ? 6 : day - 1))
  } else if (period === 'month') {
    start.setUTCDate(1)
  } else if (period === 'year') {
    start.setUTCMonth(0, 1)
  }
  return { startDate: start.toISOString(), endDate: end.toISOString() }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days} día${days > 1 ? 's' : ''}`
}

function getGreeting(nombre: string): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return `Buenos días, ${nombre}`
  if (h >= 12 && h < 18) return `Buenas tardes, ${nombre}`
  return `Buenas noches, ${nombre}`
}

function IconBoxOut() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 3L15.5 6.5V11.5L9 15L2.5 11.5V6.5L9 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 3V15M2.5 6.5L9 10L15.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 12.5L16.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconDocument() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4 2H11L15 6V16H4V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 2V6H15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 9H12M7 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconBoxIn() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 3L15.5 6.5V11.5L9 15L2.5 11.5V6.5L9 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 3V15M2.5 6.5L9 10L15.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 6.5V10M7.5 8.5L9 10L10.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2L10.9 7.2H16.4L11.8 10.5L13.5 15.8L9 12.5L4.5 15.8L6.2 10.5L1.6 7.2H7.1L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function IconRotate() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 9C3 5.686 5.686 3 9 3C11.2 3 13.1 4.2 14.2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 9C15 12.314 12.314 15 9 15C6.8 15 4.9 13.8 3.8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 3V6.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15V11.5H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconTrendUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 13L7 8L10 11L16 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 5H16V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconTrendDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 5L7 10L10 7L16 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13H16V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconGauge() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 14C3 10.134 5.686 7 9 7C12.314 7 15 10.134 15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 14L7 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="14" r="0.9" fill="currentColor" />
    </svg>
  )
}

function ArcProgress({ value }: { value: number }) {
  const fill = Math.min(Math.max(value, 0), 100)
  const color = fill >= 80 ? '#059669' : fill >= 50 ? '#E07B39' : '#DC2626'
  return (
    <svg width="52" height="30" viewBox="0 0 52 30" className="mt-2">
      <path d="M4 28 A22 22 0 0 1 48 28" fill="none" stroke="#F2F2F7" strokeWidth="5" strokeLinecap="round" pathLength={100} />
      <path
        d="M4 28 A22 22 0 0 1 48 28"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={100 - fill}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

function KpiSkeleton({ delay }: { delay: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-card-sm p-5 animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="w-9 h-9 rounded-xl bg-subtle animate-pulse mb-4" />
      <div className="h-2.5 bg-subtle rounded animate-pulse w-24 mb-2" />
      <div className="h-7 bg-subtle rounded animate-pulse w-14" />
    </div>
  )
}

function KpiCard({ icon, label, value, delay, children }: {
  icon: React.ReactNode
  label: string
  value: string
  delay: number
  children?: React.ReactNode
}) {
  return (
    <div
      className="animate-fade-in-up bg-white rounded-2xl shadow-card-sm p-5 hover:shadow-card transition-shadow duration-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-1.5">{label}</p>
      <p className="text-2xl font-bold text-ink tracking-tight leading-none">{value}</p>
      {children}
    </div>
  )
}

function DataSkeleton({ delay }: { delay: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-card-sm p-5 animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-subtle animate-pulse shrink-0" />
        <div className="flex-1">
          <div className="h-2.5 bg-subtle rounded animate-pulse w-16 mb-2.5" />
          <div className="h-3.5 bg-subtle rounded animate-pulse w-36 mb-1.5" />
          <div className="h-2.5 bg-subtle rounded animate-pulse w-24" />
        </div>
      </div>
    </div>
  )
}

function DataCard({ icon, iconBg, label, title, subtitle, badge, delay }: {
  icon: React.ReactNode
  iconBg?: string
  label: string
  title: string
  subtitle?: string
  badge?: React.ReactNode
  delay: number
}) {
  return (
    <div
      className="animate-fade-in-up bg-white rounded-2xl shadow-card-sm p-5 hover:shadow-card transition-shadow duration-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconBg ?? 'bg-brand-50 text-brand-500'}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-0.5">{label}</p>
          <p className="text-sm font-semibold text-ink truncate">{title}</p>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
        {badge && <div className="shrink-0 mt-0.5">{badge}</div>}
      </div>
    </div>
  )
}

function PeriodSelector({ active, onChange }: { active: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex gap-1 p-1 bg-subtle rounded-xl shrink-0 flex-wrap sm:flex-nowrap">
      {PERIODS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
            active === id
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-muted hover:text-ink hover:bg-white/60'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 border-b border-subtle last:border-0" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="h-5 bg-subtle rounded-full w-16 animate-pulse shrink-0" />
          <div className="h-3 bg-subtle rounded animate-pulse flex-1" />
          <div className="h-3 bg-subtle rounded animate-pulse w-10 shrink-0" />
          <div className="h-3 bg-subtle rounded animate-pulse w-16 shrink-0" />
        </div>
      ))}
    </div>
  )
}

function ActivityItem({ movement, index }: { movement: RecentMovement; index: number }) {
  return (
    <div
      className="flex items-center gap-3 py-2.5 border-b border-subtle last:border-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${TYPE_BADGE[movement.type]}`}>
        {TYPE_LABELS[movement.type]}
      </span>
      <span className="text-sm text-ink truncate flex-1">{movement.product.name}</span>
      <span className="text-xs text-muted shrink-0">{movement.quantity} u.</span>
      <span className="text-xs text-muted shrink-0">{timeAgo(movement.date)}</span>
    </div>
  )
}

function IconCycle() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2.5 9A6.5 6.5 0 0 1 9 2.5M15.5 9A6.5 6.5 0 0 1 9 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 2.5L11.5 4.5M9 2.5L6.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 15.5L11.5 13.5M9 15.5L6.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 3L16 14.5H2L9 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 8v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="12.5" r="0.8" fill="currentColor" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 5h12M7 5V3.5h4V5M13 5l-1 10H6L5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function minStockBadge(stock: number) {
  if (stock === 0)
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">Sin stock</span>
  if (stock < 10)
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-50 text-accent-600 border border-accent-100">Bajo</span>
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Ok</span>
}

function rotationBadge(value: number) {
  if (value >= 1.5)
    return <span className="mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Buena rotación</span>
  if (value >= 0.5)
    return <span className="mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-50 text-accent-600 border border-accent-100">Rotación media</span>
  return <span className="mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">Rotación baja</span>
}

function damagedBadge(value: number) {
  if (value <= 2)
    return <span className="mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Nivel óptimo</span>
  if (value <= 5)
    return <span className="mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-50 text-accent-600 border border-accent-100">Nivel medio</span>
  return <span className="mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">Nivel alto</span>
}

function discardBadge(value: number) {
  if (value <= 1)
    return <span className="mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Descarte bajo</span>
  if (value <= 3)
    return <span className="mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-50 text-accent-600 border border-accent-100">Descarte medio</span>
  return <span className="mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">Descarte alto</span>
}

export default function DashboardClient({ user }: { user: DashboardUser }) {
  const { toast } = useToast()
  const [period, setPeriod] = useState<Period>('today')
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [movements, setMovements] = useState<RecentMovement[] | null>(null)
  const [greeting, setGreeting] = useState<string | null>(null)

  useEffect(() => {
    setGreeting(getGreeting(user.nombre))
  }, [user.nombre])

  useEffect(() => {
    fetch('/api/v1/movements?limit=5')
      .then<MovementsResponse>((r) => r.json())
      .then((data) => {
        const sorted = [...(data.data ?? [])].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        setMovements(sorted.slice(0, 5))
      })
      .catch(() => setMovements([]))
  }, [])

  useEffect(() => {
    setKpis(null)
    const { startDate, endDate } = getPeriodDates(period)
    fetch(
      `/api/v1/dashboard?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
    )
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<DashboardKpis>
      })
      .then(setKpis)
      .catch(() => {
        toast('Error al cargar indicadores', 'error')
        setKpis(DEFAULT_KPIS)
      })
  }, [period, toast])

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">{greeting ?? `Hola, ${user.nombre}`}</h2>
          <p className="text-sm text-muted mt-0.5">Aquí tienes el resumen operativo de hoy</p>
        </div>
        <PeriodSelector active={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis === null ? (
          <>
            <KpiSkeleton delay={0} />
            <KpiSkeleton delay={80} />
            <KpiSkeleton delay={160} />
            <KpiSkeleton delay={240} />
          </>
        ) : (
          <>
            <KpiCard icon={<IconBoxOut />} label="Unidades despachadas" value={kpis.dispatchedUnits.toLocaleString('es-CO')} delay={0} />
            <KpiCard icon={<IconDocument />} label="Despachos realizados" value={kpis.dispatchCount.toLocaleString('es-CO')} delay={80} />
            <KpiCard icon={<IconBoxIn />} label="Entradas registradas" value={kpis.entryCount.toLocaleString('es-CO')} delay={160} />
            <KpiCard icon={<IconGauge />} label="Productos con stock" value={`${kpis.stockPercentage.toFixed(1)}%`} delay={240}>
              <ArcProgress value={kpis.stockPercentage} />
            </KpiCard>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {kpis === null ? (
          <>
            <DataSkeleton delay={0} />
            <DataSkeleton delay={80} />
            <DataSkeleton delay={160} />
            <DataSkeleton delay={240} />
          </>
        ) : (
          <>
            <DataCard
              icon={<IconStar />}
              label="Top cliente"
              title={kpis.topClient?.clientName ?? 'Sin datos para el periodo'}
              subtitle={kpis.topClient ? `${kpis.topClient.totalPurchases.toLocaleString('es-CO')} unidades compradas` : undefined}
              delay={0}
            />
            <DataCard
              icon={<IconRotate />}
              label="Rotación destacada"
              title={kpis.topRotationProduct?.productName ?? 'Sin datos'}
              subtitle={kpis.topRotationProduct ? `${kpis.topRotationProduct.totalDispatched.toLocaleString('es-CO')} unidades despachadas` : undefined}
              delay={80}
            />
            <DataCard
              icon={<IconTrendUp />}
              iconBg="bg-emerald-50 text-emerald-600"
              label="Mayor stock"
              title={kpis.maxStockProduct?.productName ?? 'Sin datos'}
              subtitle={kpis.maxStockProduct ? `${kpis.maxStockProduct.stock.toLocaleString('es-CO')} unidades` : undefined}
              badge={kpis.maxStockProduct
                ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Alto</span>
                : undefined}
              delay={160}
            />
            <DataCard
              icon={<IconTrendDown />}
              iconBg={kpis.minStockProduct
                ? kpis.minStockProduct.stock === 0
                  ? 'bg-red-50 text-red-500'
                  : kpis.minStockProduct.stock < 10
                    ? 'bg-accent-50 text-accent-500'
                    : 'bg-emerald-50 text-emerald-600'
                : 'bg-brand-50 text-brand-500'}
              label="Menor stock"
              title={kpis.minStockProduct?.productName ?? 'Sin datos'}
              subtitle={kpis.minStockProduct ? `${kpis.minStockProduct.stock.toLocaleString('es-CO')} unidades` : undefined}
              badge={kpis.minStockProduct ? minStockBadge(kpis.minStockProduct.stock) : undefined}
              delay={240}
            />
          </>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3 animate-fade-in-up" style={{ animationDelay: '280ms' }}>
          Indicadores de calidad
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis === null ? (
            <>
              <KpiSkeleton delay={280} />
              <KpiSkeleton delay={340} />
              <KpiSkeleton delay={400} />
            </>
          ) : (
            <>
              <KpiCard icon={<IconCycle />} label="Índice de rotación" value={kpis.rotationIndex.toFixed(2)} delay={280}>
                {rotationBadge(kpis.rotationIndex)}
              </KpiCard>
              <KpiCard icon={<IconAlert />} label="Índice de dañados" value={`${kpis.damagedIndex.toFixed(2)}%`} delay={340}>
                {damagedBadge(kpis.damagedIndex)}
              </KpiCard>
              <KpiCard icon={<IconTrash />} label="Tasa de descarte" value={`${kpis.discardRate.toFixed(2)}%`} delay={400}>
                {discardBadge(kpis.discardRate)}
              </KpiCard>
            </>
          )}
        </div>
      </div>

      <div className="animate-fade-in-up bg-white rounded-2xl shadow-card-sm p-5" style={{ animationDelay: '460ms' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Actividad reciente</p>
          <Link href="/dashboard/movements" className="text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors">
            Ver todo →
          </Link>
        </div>
        {movements === null ? (
          <ActivitySkeleton />
        ) : movements.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">Sin movimientos recientes</p>
        ) : (
          <div>
            {movements.map((m, i) => (
              <ActivityItem key={m.id} movement={m} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
