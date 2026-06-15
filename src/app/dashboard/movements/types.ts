export type MovementType =
  | 'ENTRADA'
  | 'VENTA'
  | 'DAÑO'
  | 'VENCIMIENTO'
  | 'DEVOLUCION'
  | 'AJUSTE_INGRESO'
  | 'AJUSTE_SALIDA'
  | 'TRASLADO';

export type ClientType = 'Detal' | 'Mayorista';
export type LocationType = 'BODEGA' | 'VITRINA';

export interface ProductOption {
  id: string;
  code: string;
  name: string;
}

export interface ProductDetail {
  id: string;
  code: string;
  name: string;
  stock: number;
  stockBodega: number;
  stockVitrina: number;
  minStock: number;
  allowsSerialNumber: boolean;
}

export interface ClientOption {
  id: string;
  name: string;
  clientType: ClientType;
}

export interface MovementUser {
  id: string;
  nombre: string;
  apellido: string;
}

export interface MovementProduct {
  id: string;
  code: string;
  name: string;
  stock: number;
}

export interface MovementClient {
  id: string;
  name: string;
}

export interface Movement {
  id: string;
  type: MovementType;
  productId: string;
  product: MovementProduct;
  quantity: number;
  userId: string;
  user: MovementUser;
  date: string;
  observations: string | null;
  isAnnulled: boolean;
  annulledAt: string | null;
  annulledById: string | null;
  annulledBy: MovementUser | null;
  annulledReason: string | null;
  clientId: string | null;
  client: MovementClient | null;
  clientType: ClientType | null;
  totalWeight: number | null;
  returnCause: string | null;
  returnDescription: string | null;
  sourceLocation: LocationType | null;
  targetLocation: LocationType | null;
  evidenceUrls: string[] | null;
  sourceMovementId: string | null;
  createdAt: string;
}

export interface MovementsPage {
  data: Movement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ALL_MOVEMENT_TYPES: MovementType[] = [
  'ENTRADA', 'VENTA', 'DAÑO', 'VENCIMIENTO', 'DEVOLUCION', 'AJUSTE_INGRESO', 'AJUSTE_SALIDA', 'TRASLADO',
];

export const TYPE_LABELS: Record<MovementType, string> = {
  ENTRADA: 'Entrada',
  VENTA: 'Venta',
  DAÑO: 'Daño',
  VENCIMIENTO: 'Vencimiento',
  DEVOLUCION: 'Devolución',
  AJUSTE_INGRESO: 'Aj. Ingreso',
  AJUSTE_SALIDA: 'Aj. Salida',
  TRASLADO: 'Traslado',
};

export const TYPE_BADGE: Record<MovementType, string> = {
  ENTRADA: 'bg-brand-50 text-brand-500 border-brand-100',
  VENTA: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  DAÑO: 'bg-red-50 text-red-600 border-red-100',
  VENCIMIENTO: 'bg-orange-50 text-orange-600 border-orange-100',
  DEVOLUCION: 'bg-purple-50 text-purple-600 border-purple-100',
  AJUSTE_INGRESO: 'bg-teal-50 text-teal-600 border-teal-100',
  AJUSTE_SALIDA: 'bg-amber-50 text-amber-700 border-amber-100',
  TRASLADO: 'bg-slate-50 text-slate-600 border-slate-100',
};
