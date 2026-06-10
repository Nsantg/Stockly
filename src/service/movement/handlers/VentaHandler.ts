import { QueryRunner, MoreThan } from 'typeorm';
import { Movement } from '../../../entity/Movement';
import { Product } from '../../../entity/Product';
import { Lot } from '../../../entity/Lot';
import type { CreateMovementDto } from '../../MovementService';
import { BaseMovementHandler } from './BaseMovementHandler';

export class VentaHandler extends BaseMovementHandler {
  async validate(dto: CreateMovementDto, product: Product): Promise<void> {
    if (!dto.clientId) {
      throw new Error('La venta requiere un cliente (clientId)');
    }
    if (!dto.clientType) {
      throw new Error('La venta requiere el tipo de cliente (clientType)');
    }
    this.assertSufficientStock(product, dto.quantity);
  }

  async execute(
    dto: CreateMovementDto,
    product: Product,
    queryRunner: QueryRunner,
  ): Promise<Movement> {
    await this.applyStockDelta(queryRunner, product, -dto.quantity, 'auto');

    const lots = await queryRunner.manager.find(Lot, {
      where: { productId: product.id, stock: MoreThan(0) },
      order: { expirationDate: 'ASC' },
    });

    if (lots.length > 0) {
      const lot = lots[0];
      lot.stock = Math.max(0, lot.stock - dto.quantity);
      await queryRunner.manager.save(Lot, lot);
    }

    return this.persist(
      queryRunner,
      this.buildMovement(dto, {
        clientId: dto.clientId ?? null,
        clientType: dto.clientType ?? null,
        totalWeight: dto.totalWeight ?? null,
      }),
    );
  }
}
