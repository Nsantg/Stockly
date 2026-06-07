import { QueryRunner } from 'typeorm';
import { Movement } from '@/entity/Movement';
import { BDD_MOVEMENT_ID } from './productFactory';

export function createQueryRunnerMock(movementId = BDD_MOVEMENT_ID): QueryRunner {
  return {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn().mockImplementation(async (_entity, data: Movement) => ({
        ...data,
        id: movementId,
      })),
      findOne: jest.fn(),
    },
  } as unknown as QueryRunner;
}
