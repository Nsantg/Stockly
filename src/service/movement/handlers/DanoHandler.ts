import { QueryRunner } from 'typeorm';
import { Movement } from '../../../entity/Movement';
import { Product } from '../../../entity/Product';
import type { CreateMovementDto } from '../../MovementService';
import { BaseMovementHandler } from './BaseMovementHandler';

export class DanoHandler extends BaseMovementHandler {
  async validate(dto: CreateMovementDto, product: Product): Promise<void> {
    this.assertSufficientStock(product, dto.quantity);
  }

  async execute(
    dto: CreateMovementDto,
    product: Product,
    queryRunner: QueryRunner,
  ): Promise<Movement> {
    await this.applyStockDelta(queryRunner, product, -dto.quantity, 'auto');
    return this.persist(queryRunner, this.buildMovement(dto));
  }
}
