import { QueryRunner } from 'typeorm';
import { Movement } from '../../../entity/Movement';
import { Product } from '../../../entity/Product';
import type { CreateMovementDto } from '../../MovementService';
import { BaseMovementHandler } from './BaseMovementHandler';

export class AjusteIngresoHandler extends BaseMovementHandler {
  async validate(dto: CreateMovementDto, _product: Product): Promise<void> {
    if (!dto.observations) {
      throw new Error('El ajuste de ingreso requiere un motivo en observations');
    }
  }

  async execute(
    dto: CreateMovementDto,
    product: Product,
    queryRunner: QueryRunner,
  ): Promise<Movement> {
    await this.applyStockDelta(queryRunner, product, dto.quantity);
    return this.persist(queryRunner, this.buildMovement(dto));
  }
}
