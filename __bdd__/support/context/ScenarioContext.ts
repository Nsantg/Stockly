import { Product } from '@/entity/Product';
import { Movement } from '@/entity/Movement';
import type { CreateMovementDto } from '@/service/MovementService';
import { QueryRunner } from 'typeorm';

export interface ScenarioContext {
  product: Product;
  movementDto: CreateMovementDto;
  queryRunner: QueryRunner;
  movement: Movement | null;
  error: Error | null;
  adminUserId: string;
  annulReason: string;
  annulledMovement: Movement | null;
}

export function createEmptyContext(): ScenarioContext {
  return {
    product: null as unknown as Product,
    movementDto: null as unknown as CreateMovementDto,
    queryRunner: null as unknown as QueryRunner,
    movement: null,
    error: null,
    adminUserId: '',
    annulReason: '',
    annulledMovement: null,
  };
}
