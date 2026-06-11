import { QueryRunner } from 'typeorm';
import { Movement } from '../../../entity/Movement';
import { Product } from '../../../entity/Product';
import type { CreateMovementDto } from '../../MovementService';
import { BaseMovementHandler } from './BaseMovementHandler';

export class AjusteSalidaHandler extends BaseMovementHandler {
  async validate(dto: CreateMovementDto, _product: Product): Promise<void> {
    if (!dto.observations) {
      throw new Error('El ajuste de salida requiere un motivo en observations');
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
    if (!sourceMovement) throw new Error('Movimiento fuente no encontrado en la transacción');

    const freshProduct = await queryRunner.manager.findOne(Product, {
      where: { id: dto.productId! },
    });
    if (!freshProduct) throw new Error('Producto no encontrado en la transacción');

    freshProduct.stockBodega += sourceMovement.quantity;
    freshProduct.stock = freshProduct.stockBodega + freshProduct.stockVitrina;
    await queryRunner.manager.save(Product, freshProduct);

    this.assertSufficientStock(freshProduct, dto.quantity);

    sourceMovement.isAnnulled = true;
    sourceMovement.annulledAt = new Date();
    sourceMovement.annulledById = dto.userId;
    await queryRunner.manager.save(Movement, sourceMovement);

    const fromVitrina = Math.min(freshProduct.stockVitrina, dto.quantity);
    freshProduct.stockVitrina -= fromVitrina;
    freshProduct.stockBodega -= dto.quantity - fromVitrina;
    freshProduct.stock = freshProduct.stockBodega + freshProduct.stockVitrina;
    await queryRunner.manager.save(Product, freshProduct);

    return this.persist(
      queryRunner,
      this.buildMovement(dto, {
        clientId: sourceMovement.clientId,
        clientType: sourceMovement.clientType,
        totalWeight: sourceMovement.totalWeight,
        evidenceUrls: sourceMovement.evidenceUrls,
      }),
    );
  }
}
