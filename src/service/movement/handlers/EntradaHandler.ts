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
      const lot = new Lot();
      lot.lotNumber = dto.lotNumber;
      lot.expirationDate = dto.expirationDate ? new Date(dto.expirationDate) : null;
      lot.stock = dto.quantity;
      lot.productId = product.id;
      await queryRunner.manager.save(Lot, lot);
    }

    return this.persist(queryRunner, this.buildMovement(dto));
  }
}
