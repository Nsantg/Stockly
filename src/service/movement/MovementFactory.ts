import { QueryRunner } from 'typeorm';
import { MovementType } from '../../entity/MovementType';
import { Movement } from '../../entity/Movement';
import { Product } from '../../entity/Product';
import type { CreateMovementDto } from '../MovementService';
import { EntradaHandler } from './handlers/EntradaHandler';
import { VentaHandler } from './handlers/VentaHandler';
import { DanoHandler } from './handlers/DanoHandler';
import { VencimientoHandler } from './handlers/VencimientoHandler';
import { DevolucionHandler } from './handlers/DevolucionHandler';
import { AjusteIngresoHandler } from './handlers/AjusteIngresoHandler';
import { AjusteSalidaHandler } from './handlers/AjusteSalidaHandler';
import { TrasladoHandler } from './handlers/TrasladoHandler';

export interface MovementHandler {
  validate(dto: CreateMovementDto, product: Product): Promise<void>;
  execute(dto: CreateMovementDto, product: Product, queryRunner: QueryRunner): Promise<Movement>;
}

const handlers: Record<MovementType, MovementHandler> = {
  [MovementType.ENTRADA]: new EntradaHandler(),
  [MovementType.VENTA]: new VentaHandler(),
  [MovementType.DAÑO]: new DanoHandler(),
  [MovementType.VENCIMIENTO]: new VencimientoHandler(),
  [MovementType.DEVOLUCION]: new DevolucionHandler(),
  [MovementType.AJUSTE_INGRESO]: new AjusteIngresoHandler(),
  [MovementType.AJUSTE_SALIDA]: new AjusteSalidaHandler(),
  [MovementType.TRASLADO]: new TrasladoHandler(),
};

export class MovementFactory {
  static getHandler(type: MovementType): MovementHandler {
    const handler = handlers[type];
    if (!handler) {
      throw new Error(`Tipo de movimiento no válido: ${type}`);
    }
    return handler;
  }
}
