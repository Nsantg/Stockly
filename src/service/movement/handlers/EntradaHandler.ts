import { QueryRunner } from 'typeorm';
import { Movement } from '../../../entity/Movement';
import { Product } from '../../../entity/Product';
import { Lot } from '../../../entity/Lot';
import type { CreateMovementDto } from '../../MovementService';
import { BaseMovementHandler } from './BaseMovementHandler';

export class EntradaHandler extends BaseMovementHandler {
  async validate(_dto: CreateMovementDto, _product: Product): Promise<void> {}

  async execute(
    dto: CreateMovementDto,
    product: Product,
    queryRunner: QueryRunner,
  ): Promise<Movement> {
    await this.applyStockDelta(queryRunner, product, dto.quantity, 'bodega');

    if (dto.lotNumber) {
      await queryRunner.manager.insert(Lot, {
        lotNumber: dto.lotNumber,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
        stock: dto.quantity,
        productId: product.id,
      });
    }

    return this.persist(queryRunner, this.buildMovement(dto));
  }
}
