import { movementService } from '../../src/service/MovementService';
import { productRepository } from '../../src/repository/ProductRepository';
import { getDataSource } from '../../src/lib/database';
import { MovementType } from '../../src/entity/MovementType';
import { ZodError } from 'zod';
import {
  TEST_PRODUCT_ID,
  TEST_USER_ID,
} from '../helpers/movementTestHelpers';

jest.mock('../../src/repository/ProductRepository');
jest.mock('../../src/repository/MovementRepository', () => ({
  movementRepository: {
    findById: jest.fn(),
  },
}));
jest.mock('../../src/lib/database');

describe('MovementService - Validación Zod (sandboxing)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe rechazar DTO inválido antes de consultar productRepository', async () => {
    const invalidDto = {
      type: MovementType.VENTA,
      productId: 'no-es-uuid',
      quantity: -5,
      userId: TEST_USER_ID,
    };

    await expect(movementService.createMovement(invalidDto as never)).rejects.toThrow(ZodError);
    expect(productRepository.findById).not.toHaveBeenCalled();
    expect(getDataSource).not.toHaveBeenCalled();
  });

  it('Debe rechazar cantidad no entera positiva sin abrir transacción', async () => {
    const invalidDto = {
      type: MovementType.VENTA,
      productId: TEST_PRODUCT_ID,
      quantity: 0,
      userId: TEST_USER_ID,
    };

    await expect(movementService.createMovement(invalidDto as never)).rejects.toThrow(ZodError);
    expect(productRepository.findById).not.toHaveBeenCalled();
  });
});
