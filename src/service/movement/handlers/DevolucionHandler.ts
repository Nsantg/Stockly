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
    if (!dto.sourceMovementId) {
      throw new Error('La devolución requiere una venta de origen (sourceMovementId)');
    }
    if (!dto.returnCause) {
      throw new Error('La devolución requiere la causa (returnCause)');
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
    if (!sourceMovement) throw new Error('Movimiento de venta no encontrado en la transacción');
    if (sourceMovement.isAnnulled) throw new Error('La venta ya fue anulada');
    if (dto.quantity > sourceMovement.quantity) {
      throw new Error(
        `No se pueden devolver más unidades de las vendidas (máx. ${sourceMovement.quantity})`,
      );
    }

    const freshProduct = await queryRunner.manager.findOne(Product, {
      where: { id: dto.productId! },
    });
    if (!freshProduct) throw new Error('Producto no encontrado en la transacción');

    freshProduct.stockBodega += dto.quantity;
    freshProduct.stock = freshProduct.stockBodega + freshProduct.stockVitrina;
    await queryRunner.manager.save(Product, freshProduct);

    if (dto.quantity === sourceMovement.quantity) {
      sourceMovement.isAnnulled = true;
      sourceMovement.annulledAt = new Date();
      sourceMovement.annulledById = dto.userId;
      sourceMovement.annulledReason = `Devolución completa: ${dto.returnCause}`;
      await queryRunner.manager.save(Movement, sourceMovement);
    } else {
      sourceMovement.quantity = sourceMovement.quantity - dto.quantity;
      await queryRunner.manager.save(Movement, sourceMovement);
    }

    return this.persist(
      queryRunner,
      this.buildMovement(dto, {
        clientId: sourceMovement.clientId,
        returnCause: dto.returnCause ?? null,
        returnDescription: dto.returnDescription ?? null,
      }),
    );
  }
}
