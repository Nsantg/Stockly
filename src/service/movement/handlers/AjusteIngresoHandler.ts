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

    freshProduct.stock -= sourceMovement.quantity;
    await queryRunner.manager.save(Product, freshProduct);

    sourceMovement.isAnnulled = true;
    sourceMovement.annulledAt = new Date();
    sourceMovement.annulledById = dto.userId;
    await queryRunner.manager.save(Movement, sourceMovement);

    freshProduct.stock += dto.quantity;
    await queryRunner.manager.save(Product, freshProduct);

    return this.persist(queryRunner, this.buildMovement(dto));
  }
}
