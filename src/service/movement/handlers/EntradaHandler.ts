import { QueryRunner } from 'typeorm';
import { Movement } from '../../../entity/Movement';
import { Product } from '../../../entity/Product';
import type { CreateMovementDto } from '../../MovementService';
import { BaseMovementHandler } from './BaseMovementHandler';

export class EntradaHandler extends BaseMovementHandler {
  async validate(_dto: CreateMovementDto, _product: Product): Promise<void> {}

  async execute(
    dto: CreateMovementDto,
    product: Product,
    queryRunner: QueryRunner,
  ): Promise<Movement> {
    await this.applyStockDelta(queryRunner, product, dto.quantity);
    return this.persist(queryRunner, this.buildMovement(dto));
  }
}
