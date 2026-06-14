import { QueryRunner } from 'typeorm';
import { Movement } from '../../../entity/Movement';
import { Product } from '../../../entity/Product';
import type { CreateMovementDto } from '../../MovementService';
import { BaseMovementHandler } from './BaseMovementHandler';
import { BusinessError } from '../../../lib/errors';

export class AjusteIngresoHandler extends BaseMovementHandler {
  async validate(dto: CreateMovementDto, _product: Product): Promise<void> {
    if (!dto.observations) {
      throw new BusinessError('El ajuste de ingreso requiere un motivo en observations');
    }
  }

  async execute(
    dto: CreateMovementDto,
    _product: Product,
    queryRunner: QueryRunner,
  ): Promise<Movement> {
    const sourceMovement = await queryRunner.manager.findOne(Movement, {
      where: { id: dto.sourceMovementId! },
    });
    if (!sourceMovement) throw new BusinessError('Movimiento fuente no encontrado en la transacción');

    const freshProduct = await queryRunner.manager.findOne(Product, {
      where: { id: dto.productId! },
    });
    if (!freshProduct) throw new BusinessError('Producto no encontrado en la transacción');

    freshProduct.stockBodega = Math.max(0, freshProduct.stockBodega - sourceMovement.quantity);
    freshProduct.stock = freshProduct.stockBodega + freshProduct.stockVitrina;
    await queryRunner.manager.save(Product, freshProduct);

    sourceMovement.isAnnulled = true;
    sourceMovement.annulledAt = new Date();
    sourceMovement.annulledById = dto.userId;
    await queryRunner.manager.save(Movement, sourceMovement);

    freshProduct.stockBodega += dto.quantity;
    freshProduct.stock = freshProduct.stockBodega + freshProduct.stockVitrina;
    await queryRunner.manager.save(Product, freshProduct);

    return this.persist(queryRunner, this.buildMovement(dto));
  }
}
