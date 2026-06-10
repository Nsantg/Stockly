import { Product } from '../../src/entity/Product';
import { MovementType } from '../../src/entity/MovementType';
import { ClientType } from '../../src/entity/ClientType';
import type { CreateMovementDto } from '../../src/service/MovementService';
import { QueryRunner } from 'typeorm';

export const TEST_PRODUCT_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
export const TEST_USER_ID = '11111111-2222-3333-4444-555555555555';
export const TEST_CLIENT_ID = '99999999-8888-7777-6666-555555555555';

export function buildProduct(overrides: Partial<Product> & { allowsSerialNumber?: boolean } = {}): Product {
  const { allowsSerialNumber = false, subcategory, ...rest } = overrides;

  return {
    id: TEST_PRODUCT_ID,
    code: 'PROD-001',
    name: 'Producto de prueba',
    stock: 50,
    stockBodega: 50,
    stockVitrina: 0,
    minStock: 10,
    isActive: true,
    subcategory: subcategory ?? {
      id: 'sub-uuid',
      category: {
        id: 'cat-uuid',
        name: allowsSerialNumber ? 'Electroterapia' : 'Masoterapia',
        allowsSerialNumber,
      },
    },
    ...rest,
  } as Product;
}

export function buildMovementDto(overrides: Partial<CreateMovementDto> = {}): CreateMovementDto {
  return {
    type: MovementType.VENTA,
    productId: TEST_PRODUCT_ID,
    quantity: 5,
    userId: TEST_USER_ID,
    clientId: TEST_CLIENT_ID,
    clientType: ClientType.DETAL,
    ...overrides,
  };
}

export function createMockQueryRunner(): QueryRunner {
  return {
    manager: {
      save: jest.fn().mockImplementation(async (_entity, data) => ({
        id: 'movement-uuid',
        ...data,
      })),
    },
  } as unknown as QueryRunner;
}
