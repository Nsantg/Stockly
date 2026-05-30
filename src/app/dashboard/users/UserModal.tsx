'use client';

import { useState, useEffect } from 'react';
import { User, UserFormData, UserRole } from './types';
import { useToast } from '@/components/ui/Toast';

interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
}

const ROLES: RoleOption[] = [
  { value: 'Admin', label: 'Admin', description: 'Acceso completo al sistema' },
  { value: 'Almacenista', label: 'Almacenista', description: 'Gestión de inventario y movimientos' },
  { value: 'Despachador', label: 'Despachador', description: 'Registro de ventas y despachos' },
  { value: 'Visualizador', label: 'Visualizador', description: 'Solo lectura del sistema' },
];

function roleButtonClass(role: UserRole, selected: boolean): string {
  if (!selected) return 'bg-white border-line hover:border-brand-200 text-ink';
  const map: Record<UserRole, string> = {
    Admin: 'bg-brand-500 border-brand-500 text-white',
    Almacenista: 'bg-accent-600 border-accent-600 text-white',
    Despachador: 'bg-emerald-600 border-emerald-600 text-white',
    Visualizador: 'bg-ink border-ink text-white',
  };
  return map[role];
}

const EMPTY_FORM: UserFormData = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  rol: 'Despachador',
};

interface Errors {
  nombre?: string;
  apellido?: string;
  email?: string;
  password?: string;
}

export default function UserModal({
  open,
  user,
  onClose,
  onSaved,
}: {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      user
        ? { nombre: user.nombre, apellido: user.apellido, email: user.email, password: '', rol: user.rol }
        : EMPTY_FORM,
    );
    setErrors({});
    setShowPassword(false);
  }, [open, user]);

  const validate = (): boolean => {
    const next: Errors = {};
    if (!form.nombre.trim()) next.nombre = 'El nombre es requerido';
    if (!form.apellido.trim()) next.apellido = 'El apellido es requerido';
    if (!form.email.trim()) next.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email inválido';
    if (!user && !form.password) next.password = 'La contraseña es requerida';
    else if (!user && form.password.length < 6) next.password = 'Mínimo 6 caracteres';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const url = user ? `/api/v1/users/${user.id}` : '/api/v1/users';
      const body: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        rol: form.rol,
      };
      if (!user) body.password = form.password;

      const res = await fetch(url, {
        method: user ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Error al guardar', 'error'); return; }
      toast(user ? 'Usuario actualizado' : 'Usuario creado');
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
          <h3 className="text-base font-semibold text-ink">{user ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-subtle text-muted hover:text-ink transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Nombre *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => { setForm((p) => ({ ...p, nombre: e.target.value })); setErrors((p) => ({ ...p, nombre: undefined })); }}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.nombre ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'}`}
                placeholder="Nombre"
              />
              {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Apellido *</label>
              <input
                type="text"
                value={form.apellido}
                onChange={(e) => { setForm((p) => ({ ...p, apellido: e.target.value })); setErrors((p) => ({ ...p, apellido: undefined })); }}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.apellido ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'}`}
                placeholder="Apellido"
              />
              {errors.apellido && <p className="text-xs text-red-500">{errors.apellido}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setErrors((p) => ({ ...p, email: undefined })); }}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.email ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'}`}
              placeholder="correo@empresa.com"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {!user && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Contraseña *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setErrors((p) => ({ ...p, password: undefined })); }}
                  className={`w-full px-3 py-2.5 pr-10 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.password ? 'border-red-300 focus:ring-red-100' : 'border-line focus:ring-brand-100 focus:border-brand-400'}`}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8C2 8 4.5 3 8 3s6 5 6 5-2.5 5-6 5-6-5-6-5Z" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M2 2L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8C2 8 4.5 3 8 3s6 5 6 5-2.5 5-6 5-6-5-6-5Z" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Rol *</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => {
                const selected = form.rol === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, rol: role.value }))}
                    className={`text-left px-3 py-3 rounded-xl border-2 transition-all ${roleButtonClass(role.value, selected)}`}
                  >
                    <p className="text-xs font-semibold">{role.label}</p>
                    <p className={`text-xs mt-0.5 ${selected ? 'opacity-80' : 'text-muted'}`}>{role.description}</p>
                  </button>
                );
              })}
            </div>
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
              {saving ? 'Guardando…' : user ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
