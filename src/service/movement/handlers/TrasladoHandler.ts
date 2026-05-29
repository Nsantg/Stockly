import { QueryRunner } from 'typeorm';
import { Movement } from '../../../entity/Movement';
import { Product } from '../../../entity/Product';
import { LocationType } from '../../../entity/LocationType';
import type { CreateMovementDto } from '../../MovementService';
import { BaseMovementHandler } from './BaseMovementHandler';

export class TrasladoHandler extends BaseMovementHandler {
  async validate(): Promise<void> {}

  async execute(
    dto: CreateMovementDto,
    _product: Product,
    queryRunner: QueryRunner,
  ): Promise<Movement> {
    return this.persist(
      queryRunner,
      this.buildMovement(dto, {
        sourceLocation: LocationType.BODEGA,
        targetLocation: LocationType.VITRINA,
      }),
    );
  }
}
