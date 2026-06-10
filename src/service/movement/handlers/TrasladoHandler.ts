import { QueryRunner } from 'typeorm';
import { Movement } from '../../../entity/Movement';
import { Product } from '../../../entity/Product';
import { LocationType } from '../../../entity/LocationType';
import type { CreateMovementDto } from '../../MovementService';
import { BaseMovementHandler } from './BaseMovementHandler';

export class TrasladoHandler extends BaseMovementHandler {
  async validate(dto: CreateMovementDto, product: Product): Promise<void> {
    if (product.stockBodega < dto.quantity) {
      throw new Error(
        `Stock insuficiente en bodega para "${product.name}": disponible ${product.stockBodega}, requerido ${dto.quantity}`,
      );
    }
  }

  async execute(
    dto: CreateMovementDto,
    product: Product,
    queryRunner: QueryRunner,
  ): Promise<Movement> {
    product.stockBodega -= dto.quantity;
    product.stockVitrina += dto.quantity;
    await queryRunner.manager.save(Product, product);

    return this.persist(
      queryRunner,
      this.buildMovement(dto, {
        sourceLocation: LocationType.BODEGA,
        targetLocation: LocationType.VITRINA,
      }),
    );
  }
}
