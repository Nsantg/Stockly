'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface StockAlert {
  type: 'STOCK_CRITICAL'
  productId: string
  productName: string
  stock: number
  minStock: number
  message: string
  level: 'CRITICAL'
}

interface ExpirationAlert {
  type: 'EXPIRATION_WARNING'
  lotId: string
  lotNumber: string
  productId: string
  productName: string
  expirationDate: string
  daysUntilExpiration: number
  stock: number
  level: 'CRITICAL' | 'WARNING'
}

interface AlertSummary {
  stockAlerts: StockAlert[]
  expirationAlerts: ExpirationAlert[]
  totalCritical: number
  totalWarnings: number
}

const DEFAULT_SUMMARY: AlertSummary = {
  stockAlerts: [],
  expirationAlerts: [],
  totalCritical: 0,
  totalWarnings: 0,
}

const EXPIRATION_DAYS = [7, 15, 30, 60] as const
type ExpirationDays = (typeof EXPIRATION_DAYS)[number]

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function IconBell() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 3C7.686 3 5 5.686 5 9V14L3 16H19L17 14V9C17 5.686 14.314 3 11 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 17C9 18.105 9.895 19 11 19C12.105 19 13 18.105 13 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconWarning() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 3L16.5 15.5H1.5L9 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 8V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="13" r="0.8" fill="currentColor" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 7H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 2V4M12 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 10H6.01M9 10H9.01M12 10H12.01M6 13H6.01M9 13H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconRefresh({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={spinning ? 'animate-spin' : ''}
    >
      <path d="M2 8C2 4.686 4.686 2 8 2C10.2 2 12.1 3.2 13.2 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M14 8C14 11.314 11.314 14 8 14C5.8 14 3.9 12.8 2.8 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M13 1.5V5H9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 14.5V11H6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0, 80, 160].map((delay) => (
        <div key={delay} className="bg-white rounded-2xl shadow-card-sm p-5 animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
          <div className="h-2.5 bg-subtle rounded animate-pulse w-20 mb-3" />
          <div className="h-8 bg-subtle rounded animate-pulse w-12 mb-1.5" />
          <div className="h-2.5 bg-subtle rounded animate-pulse w-28" />
        </div>
      ))}
    </div>
  )
}

function SummaryCard({ label, value, description, color, delay }: {
  label: string
  value: number
  description: string
  color: string
  delay: number
}) {
  return (
    <div
      className="animate-fade-in bg-white rounded-2xl shadow-card-sm p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">{label}</p>
      <p className={`text-3xl font-bold tracking-tight leading-none mb-1 ${color}`}>{value}</p>
      <p className="text-xs text-muted">{description}</p>
    </div>
  )
}

function StockAlertsSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-subtle rounded-xl h-16 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  )
}

function StockProgressBar({ stock, minStock }: { stock: number; minStock: number }) {
  const pct = minStock === 0 ? 100 : Math.min((stock / minStock) * 100, 100)
  const color = stock === 0 ? 'bg-red-500' : stock <= minStock ? 'bg-accent-500' : 'bg-brand-500'
  return (
    <div className="mt-2 h-1.5 bg-subtle rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function AlertsClient({ userName }: { userName: string }) {
  const { toast } = useToast()
  const [summary, setSummary] = useState<AlertSummary | null>(null)
  const [reloading, setReloading] = useState(false)
  const [expirationDays, setExpirationDays] = useState<ExpirationDays>(30)
  const [expAlerts, setExpAlerts] = useState<ExpirationAlert[] | null>(null)
  const [expLoading, setExpLoading] = useState(false)

  const loadAll = useCallback(async () => {
    setReloading(true)
    setSummary(null)
    try {
      const [summaryRes, expRes] = await Promise.all([
        fetch('/api/v1/alerts/stock'),
        fetch(`/api/v1/alerts/expiration?days=${expirationDays}`),
      ])
      if (!summaryRes.ok || !expRes.ok) throw new Error()
      const [stockAlerts, expirationAlerts]: [StockAlert[], ExpirationAlert[]] = await Promise.all([
        summaryRes.json(),
        expRes.json(),
      ])
      const totalCritical = stockAlerts.filter((a) => a.level === 'CRITICAL').length
        + expirationAlerts.filter((a) => a.level === 'CRITICAL').length
      const totalWarnings = expirationAlerts.filter((a) => a.level === 'WARNING').length
      setSummary({ stockAlerts, expirationAlerts, totalCritical, totalWarnings })
      setExpAlerts(
        [...expirationAlerts].sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration),
      )
    } catch {
      toast('Error al cargar alertas', 'error')
      setSummary(DEFAULT_SUMMARY)
      setExpAlerts([])
    } finally {
      setReloading(false)
    }
  }, [expirationDays, toast])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const loadExpiration = useCallback(async (days: ExpirationDays) => {
    setExpLoading(true)
    setExpAlerts(null)
    try {
      const res = await fetch(`/api/v1/alerts/expiration?days=${days}`)
      if (!res.ok) throw new Error()
      const alerts: ExpirationAlert[] = await res.json()
      setExpAlerts([...alerts].sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration))
    } catch {
      toast('Error al cargar alertas de vencimiento', 'error')
      setExpAlerts([])
    } finally {
      setExpLoading(false)
    }
  }, [toast])

  const handleDaysChange = (days: ExpirationDays) => {
    setExpirationDays(days)
    loadExpiration(days)
  }

  const criticalCount = summary?.totalCritical ?? 0

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
              <IconBell />
            </div>
            <h2 className="text-xl font-semibold text-ink">Centro de alertas</h2>
            {criticalCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                {criticalCount} crítica{criticalCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-muted mt-1.5 ml-0">
            Monitoreo de stock bajo mínimo y lotes próximos a vencer
          </p>
        </div>
        <button
          onClick={loadAll}
          disabled={reloading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-ink hover:bg-subtle transition-colors disabled:opacity-50 shrink-0"
        >
          <IconRefresh spinning={reloading} />
          Actualizar
        </button>
      </div>

      {summary === null ? (
        <SummarySkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Críticas totales"
            value={summary.totalCritical}
            description="Requieren atención inmediata"
            color={summary.totalCritical > 0 ? 'text-red-600' : 'text-ink'}
            delay={0}
          />
          <SummaryCard
            label="Alertas de vencimiento"
            value={summary.expirationAlerts.length}
            description={`En los próximos ${expirationDays} días`}
            color={summary.expirationAlerts.length > 0 ? 'text-accent-600' : 'text-ink'}
            delay={80}
          />
          <SummaryCard
            label="Stock bajo"
            value={summary.stockAlerts.length}
            description="Productos bajo el mínimo"
            color={summary.stockAlerts.length > 0 ? 'text-brand-500' : 'text-ink'}
            delay={160}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-card-sm p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="text-accent-500">
            <IconWarning />
          </div>
          <h3 className="text-sm font-semibold text-ink">Alertas de stock bajo</h3>
          {summary !== null && (
            <span className="text-xs text-muted">({summary.stockAlerts.length})</span>
          )}
        </div>

        {summary === null ? (
          <StockAlertsSkeleton />
        ) : summary.stockAlerts.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
              <IconCheck />
            </div>
            <p className="text-sm font-semibold text-ink">Todo el stock está en niveles saludables</p>
            <p className="text-xs text-muted mt-1">No hay productos por debajo del mínimo configurado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {summary.stockAlerts.map((alert, i) => (
              <div
                key={alert.productId}
                className="flex items-start gap-4 p-4 rounded-xl border border-red-100 bg-red-50/50 animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-ink truncate">{alert.productName}</p>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200 uppercase tracking-wide">
                      Crítico
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {alert.stock} unidades · mínimo {alert.minStock}
                  </p>
                  <StockProgressBar stock={alert.stock} minStock={alert.minStock} />
                </div>
                <Link
                  href={`/dashboard/movements?tab=new&type=ENTRADA&productId=${alert.productId}&minStock=${alert.minStock}`}
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                >
                  Registrar entrada
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-2 flex-1">
            <div className="text-brand-500">
              <IconCalendar />
            </div>
            <h3 className="text-sm font-semibold text-ink">Alertas de vencimiento</h3>
            {expAlerts !== null && (
              <span className="text-xs text-muted">({expAlerts.length})</span>
            )}
          </div>
          <div className="flex gap-1 p-1 bg-subtle rounded-xl">
            {EXPIRATION_DAYS.map((d) => (
              <button
                key={d}
                onClick={() => handleDaysChange(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                  expirationDays === d
                    ? 'bg-accent-500 text-white shadow-sm'
                    : 'text-muted hover:text-ink hover:bg-white/60'
                }`}
              >
                {d} días
              </button>
            ))}
          </div>
        </div>

        {expLoading || expAlerts === null ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 bg-subtle rounded-lg animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : expAlerts.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
              <IconCheck />
            </div>
            <p className="text-sm font-semibold text-ink">
              No hay productos próximos a vencer en los próximos {expirationDays} días
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted pb-2.5 pr-4">Producto</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted pb-2.5 pr-4">Lote</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted pb-2.5 pr-4">Vencimiento</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted pb-2.5 pr-4">Días rest.</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-muted pb-2.5">Stock</th>
                </tr>
              </thead>
              <tbody>
                {expAlerts.map((alert, i) => {
                  const isCritical = alert.daysUntilExpiration <= 7
                  const daysBadge = alert.daysUntilExpiration <= 7
                    ? 'bg-red-50 text-red-600 border-red-100'
                    : alert.daysUntilExpiration <= 30
                      ? 'bg-orange-50 text-orange-600 border-orange-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  return (
                    <tr
                      key={alert.lotId}
                      className={`border-b border-subtle last:border-0 animate-fade-in-up ${isCritical ? 'bg-red-50/40' : ''}`}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="py-3 pr-4 font-medium text-ink">{alert.productName}</td>
                      <td className="py-3 pr-4 text-muted text-xs font-mono">{alert.lotNumber}</td>
                      <td className="py-3 pr-4 text-muted">{fmtDate(alert.expirationDate)}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${daysBadge}`}>
                          {alert.daysUntilExpiration} días
                        </span>
                      </td>
                      <td className="py-3 text-right text-muted">{alert.stock} u.</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
