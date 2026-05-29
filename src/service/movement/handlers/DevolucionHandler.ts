import { QueryRunner } from 'typeorm';
import { Movement } from '../../../entity/Movement';
import { Product } from '../../../entity/Product';
import type { CreateMovementDto } from '../../MovementService';
import { BaseMovementHandler } from './BaseMovementHandler';

export class DevolucionHandler extends BaseMovementHandler {
  async validate(dto: CreateMovementDto, product: Product): Promise<void> {
    if (!product.subcategory?.category?.allowsSerialNumber) {
      throw new Error(
        'Solo se pueden registrar devoluciones de productos eléctricos (con número de serie habilitado)',
      );
    }
    if (!dto.clientId) {
      throw new Error('La devolución requiere un cliente (clientId)');
    }
    if (!dto.returnCause) {
      throw new Error('La devolución requiere la causa (returnCause)');
    }
  }

  async execute(
    dto: CreateMovementDto,
    product: Product,
    queryRunner: QueryRunner,
  ): Promise<Movement> {
    await this.applyStockDelta(queryRunner, product, dto.quantity);
    return this.persist(
      queryRunner,
      this.buildMovement(dto, {
        clientId: dto.clientId ?? null,
        returnCause: dto.returnCause ?? null,
        returnDescription: dto.returnDescription ?? null,
      }),
    );
  }
}
