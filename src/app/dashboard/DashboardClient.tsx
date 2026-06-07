'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'

export type UserRole = 'Admin' | 'Almacenista' | 'Despachador' | 'Visualizador'

type Period = 'today' | 'week' | 'month' | 'year'

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

export default function DashboardClient({ user }: { user: DashboardUser }) {
  const { toast } = useToast()
  const [period, setPeriod] = useState<Period>('today')
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)

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
          <h2 className="text-xl font-semibold text-ink">{getGreeting(user.nombre)}</h2>
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
    </div>
  )
}
