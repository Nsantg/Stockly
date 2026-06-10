import { QueryRunner } from 'typeorm';
import { Movement } from '../../../entity/Movement';
import { Product } from '../../../entity/Product';
import type { CreateMovementDto } from '../../MovementService';
import type { MovementHandler } from '../MovementFactory';

export abstract class BaseMovementHandler implements MovementHandler {
  abstract validate(dto: CreateMovementDto, product: Product): Promise<void>;

  abstract execute(
    dto: CreateMovementDto,
    product: Product,
    queryRunner: QueryRunner,
  ): Promise<Movement>;

  protected assertSufficientStock(product: Product, quantity: number): void {
    if (product.stock < quantity) {
      throw new Error(
        `Stock insuficiente para "${product.name}": disponible ${product.stock}, requerido ${quantity}`,
      );
    }
  }

  protected async applyStockDelta(
    queryRunner: QueryRunner,
    product: Product,
    delta: number,
    locationMode: 'bodega' | 'auto' | null = null,
  ): Promise<void> {
    product.stock += delta;

    if (delta > 0 && locationMode === 'bodega') {
      product.stockBodega += delta;
    } else if (delta < 0 && locationMode === 'auto') {
      const qty = Math.abs(delta);
      const fromVitrina = Math.min(product.stockVitrina, qty);
      product.stockVitrina -= fromVitrina;
      product.stockBodega -= qty - fromVitrina;
    }

    await queryRunner.manager.save(Product, product);
  }

  protected buildMovement(dto: CreateMovementDto, overrides: Partial<Movement> = {}): Movement {
    const movement = new Movement();
    movement.type = dto.type;
    movement.productId = dto.productId;
    movement.quantity = dto.quantity;
    movement.userId = dto.userId;
    movement.observations = dto.observations ?? null;
    movement.date = new Date();
    Object.assign(movement, overrides);
    return movement;
  }

  protected persist(queryRunner: QueryRunner, movement: Movement): Promise<Movement> {
    return queryRunner.manager.save(Movement, movement);
  }
}
