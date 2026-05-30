'use client';

import { useState, useEffect } from 'react';
import { Client, ClientFormData, ClientType } from './types';
import { useToast } from '@/components/ui/Toast';

const EMPTY_FORM: ClientFormData = {
  name: '',
  clientType: 'Detal',
  phone: '',
  address: '',
  city: '',
  email: '',
};

interface Errors {
  name?: string;
  email?: string;
}

export default function ClientModal({
  open,
  client,
  onClose,
  onSaved,
}: {
  open: boolean;
  client: Client | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<ClientFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      client
        ? {
            name: client.name,
            clientType: client.clientType,
            phone: client.phone ?? '',
            address: client.address ?? '',
            city: client.city ?? '',
            email: client.email ?? '',
          }
        : EMPTY_FORM,
    );
    setErrors({});
  }, [open, client]);

  const validate = (): boolean => {
    const next: Errors = {};
    if (!form.name.trim()) next.name = 'El nombre es requerido';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email inválido';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const url = client ? `/api/v1/clients/${client.id}` : '/api/v1/clients';
      const res = await fetch(url, {
        method: client ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          clientType: form.clientType,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          email: form.email.trim() || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Error al guardar', 'error'); return; }
      toast(client ? 'Cliente actualizado' : 'Cliente creado');
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
          <h3 className="text-base font-semibold text-ink">{client ? 'Editar cliente' : 'Nuevo cliente'}</h3>
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
              onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setErrors((p) => ({ ...p, name: undefined })); }}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.name ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'}`}
              placeholder="Nombre del cliente"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Tipo de cliente</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Detal', 'Mayorista'] as ClientType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, clientType: type }))}
                  className={`py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${
                    form.clientType === type
                      ? type === 'Detal'
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'bg-accent-600 border-accent-600 text-white'
                      : 'bg-white border-line text-muted hover:border-brand-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all"
                placeholder="+57 300 000 0000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all"
                placeholder="Ciudad"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Dirección</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all"
              placeholder="Dirección completa"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setErrors((p) => ({ ...p, email: undefined })); }}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.email ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'}`}
              placeholder="correo@ejemplo.com"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium border border-line rounded-xl hover:bg-subtle transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-medium bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl transition-colors"
            >
              {saving ? 'Guardando…' : client ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
