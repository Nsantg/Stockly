import { MovementType } from '@/entity/MovementType';
import { ClientType } from '@/entity/ClientType';
import type { CreateMovementDto } from '@/service/MovementService';
import { BDD_CLIENT_ID, BDD_PRODUCT_ID, BDD_USER_ID } from './productFactory';

export function buildVentaDto(quantity: number): CreateMovementDto {
  return {
    type: MovementType.VENTA,
    productId: BDD_PRODUCT_ID,
    quantity,
    userId: BDD_USER_ID,
    clientId: BDD_CLIENT_ID,
    clientType: ClientType.DETAL,
  };
}

export function buildDevolucionDto(returnCause: string): CreateMovementDto {
  return {
    type: MovementType.DEVOLUCION,
    productId: BDD_PRODUCT_ID,
    quantity: 1,
    userId: BDD_USER_ID,
    clientId: BDD_CLIENT_ID,
    returnCause,
  };
}
