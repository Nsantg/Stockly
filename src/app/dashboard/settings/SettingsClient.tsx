'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { SystemSettings } from './types';

const EXPIRATION_OPTIONS = [7, 15, 30, 60];

interface NotificationToggles {
  notifyStockAlerts: boolean;
  notifyExpirationAlerts: boolean;
  notifyEntryIssueAlerts: boolean;
}

function Toggle({ label, description, value, onChange }: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative shrink-0 rounded-full transition-colors"
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

export default function SettingsClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [generalMinStock, setGeneralMinStock] = useState('0');
  const [expirationAlertDays, setExpirationAlertDays] = useState(7);
  const [notifications, setNotifications] = useState<NotificationToggles>({
    notifyStockAlerts: true,
    notifyExpirationAlerts: true,
    notifyEntryIssueAlerts: true,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/settings')
      .then((r) => r.json())
      .then((data: SystemSettings) => {
        setCompanyName(data.companyName ?? '');
        setGeneralMinStock(String(data.generalMinStock));
        setExpirationAlertDays(data.expirationAlertDays);
        setNotifications({
          notifyStockAlerts: data.notifyStockAlerts,
          notifyExpirationAlerts: data.notifyExpirationAlerts,
          notifyEntryIssueAlerts: data.notifyEntryIssueAlerts,
        });
      })
      .catch(() => toast('Error al cargar la configuración', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number.isNaN(Number(generalMinStock)) || Number(generalMinStock) < 0) {
      setError('Debe ser un número mayor o igual a 0');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim() || null,
          generalMinStock: Number(generalMinStock),
          expirationAlertDays,
          ...notifications,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast(d.error ?? 'Error al guardar', 'error');
        return;
      }
      toast('Configuración actualizada');
    } catch {
      toast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="h-8 w-48 bg-subtle rounded animate-pulse" />
        <div className="h-80 bg-white rounded-2xl shadow-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="animate-fade-in-up">
        <h2 className="text-xl font-semibold text-ink">Configuración</h2>
        <p className="text-sm text-muted mt-0.5">Ajustes generales del sistema</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="animate-fade-in-up animation-delay-80 bg-white rounded-2xl shadow-card p-6 space-y-6"
      >
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-ink">Nombre de la empresa</label>
          <p className="text-xs text-muted">
            Aparece en el encabezado y pie de página de los reportes PDF exportados.
          </p>
          <input
            type="text"
            maxLength={100}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Stockly"
            className="w-full max-w-[320px] px-3 py-2.5 text-sm border border-line rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all"
          />
        </div>

        <div className="space-y-1.5 pt-2 border-t border-line">
          <label className="block text-sm font-semibold text-ink">Stock mínimo general recomendado</label>
          <p className="text-xs text-muted">
            Se sugiere automáticamente al crear un producto nuevo, en vez de partir desde 0.
          </p>
          <input
            type="number"
            min="0"
            value={generalMinStock}
            onChange={(e) => { setGeneralMinStock(e.target.value); setError(''); }}
            className={`w-full max-w-[180px] px-3 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 transition-all ${
              error
                ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                : 'border-line focus:ring-brand-100 focus:border-brand-400'
            }`}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="space-y-1.5 pt-2 border-t border-line">
          <label className="block text-sm font-semibold text-ink">Intervalo de alertas de vencimiento</label>
          <p className="text-xs text-muted">
            Los lotes que estén a esta cantidad de días o menos de vencer generan una notificación en tiempo real.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {EXPIRATION_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setExpirationAlertDays(days)}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                  expirationAlertDays === days
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'border-line text-ink hover:bg-subtle'
                }`}
              >
                {days} días
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1 pt-2 border-t border-line">
          <label className="block text-sm font-semibold text-ink mb-1">Notificaciones en tiempo real</label>
          <p className="text-xs text-muted mb-1">
            Activa o desactiva cada tipo de notificación emergente. Las alertas siguen visibles en el panel de Alertas aunque estén desactivadas aquí.
          </p>
          <div className="divide-y divide-subtle">
            <Toggle
              label="Stock crítico"
              description="Avisar cuando un producto llega o cae por debajo de su stock mínimo."
              value={notifications.notifyStockAlerts}
              onChange={(v) => setNotifications((p) => ({ ...p, notifyStockAlerts: v }))}
            />
            <Toggle
              label="Vencimiento próximo"
              description="Avisar cuando un lote entra en el intervalo de vencimiento configurado arriba."
              value={notifications.notifyExpirationAlerts}
              onChange={(v) => setNotifications((p) => ({ ...p, notifyExpirationAlerts: v }))}
            />
            <Toggle
              label="Incidencias de entrada"
              description="Avisar cuando se registra un producto dañado o faltante al recibir una entrada."
              value={notifications.notifyEntryIssueAlerts}
              onChange={(v) => setNotifications((p) => ({ ...p, notifyEntryIssueAlerts: v }))}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-line">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 text-sm font-medium bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
