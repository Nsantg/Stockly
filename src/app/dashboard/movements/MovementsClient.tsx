'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import NewMovementClient from './NewMovementClient';
import MovementHistoryClient from './MovementHistoryClient';
import type { MovementType } from './types';

type Tab = 'new' | 'history';

const REGISTER_ROLES = ['Admin', 'Almacenista', 'Despachador'];

export default function MovementsClient({ rol }: { rol: string }) {
  const canRegister = REGISTER_ROLES.includes(rol);
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as MovementType | null;
  const tabParam = searchParams.get('tab');
  const productIdParam = searchParams.get('productId');
  const minStockParam = searchParams.get('minStock');
  const [activeTab, setActiveTab] = useState<Tab>(
    canRegister && tabParam === 'new' ? 'new' : canRegister ? 'new' : 'history',
  );

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="text-xl font-semibold text-ink">Movimientos</h2>
        <p className="text-sm text-muted mt-0.5">Registro y auditoría de movimientos de inventario</p>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        <div className="flex border-b border-line gap-1">
          {canRegister && (
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'new'
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              Registrar movimiento
            </button>
          )}
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'history'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Historial / Auditoría
          </button>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '90ms' }}>
        {activeTab === 'new' && canRegister && (
          <NewMovementClient
            rol={rol}
            initialType={typeParam}
            initialProductId={productIdParam}
            initialMinStock={minStockParam ? parseInt(minStockParam, 10) : null}
          />
        )}
        {activeTab === 'history' && <MovementHistoryClient rol={rol} />}
      </div>
    </div>
  );
}
