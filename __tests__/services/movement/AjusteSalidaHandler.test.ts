import { AjusteSalidaHandler } from '../../../src/service/movement/handlers/AjusteSalidaHandler';
import { MovementType } from '../../../src/entity/MovementType';
import { Movement } from '../../../src/entity/Movement';
import { Product } from '../../../src/entity/Product';
import { QueryRunner } from 'typeorm';
import {
  buildMovementDto,
  buildProduct,
  TEST_PRODUCT_ID,
} from '../../helpers/movementTestHelpers';

const SOURCE_ID = 'source-uuid-1111-2222-3333-444444444444';

function buildSourceMovement(overrides: Partial<Movement> = {}): Movement {
  return {
    id: SOURCE_ID,
    type: MovementType.VENTA,
    quantity: 7,
    productId: TEST_PRODUCT_ID,
    isAnnulled: false,
    annulledAt: null,
    annulledById: null,
    annulledReason: null,
    clientId: null,
    clientType: null,
    totalWeight: null,
    evidenceUrls: null,
    ...overrides,
  } as unknown as Movement;
}

function buildMockQueryRunner(sourceMovement: Movement | null, freshProduct: Product | null): QueryRunner {
  return {
    manager: {
      findOne: jest.fn().mockImplementation(async (entity: unknown) => {
        if (entity === Movement) return sourceMovement ? { ...sourceMovement } : null;
        if (entity === Product) return freshProduct ? { ...freshProduct } : null;
        return null;
      }),
      save: jest.fn().mockImplementation(async (_entity: unknown, data: unknown) => ({
        id: 'movement-uuid',
        ...(data as object),
      })),
    },
  } as unknown as QueryRunner;
}

describe('AjusteSalidaHandler - CP-18 (RN-06)', () => {
  const handler = new AjusteSalidaHandler();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate()', () => {
    it('CP-18: debe permitir ajuste de salida con observations', async () => {
      const dto = buildMovementDto({
        type: MovementType.AJUSTE_SALIDA,
        quantity: 3,
        observations: 'Diferencia conteo físico',
        clientId: undefined,
        clientType: undefined,
      });
      const product = buildProduct({ stock: 3 });

      await expect(handler.validate(dto, product)).resolves.toBeUndefined();
    });

    it('debe exigir motivo en observations', async () => {
      const dto = buildMovementDto({
        type: MovementType.AJUSTE_SALIDA,
        quantity: 1,
        observations: undefined,
        clientId: undefined,
        clientType: undefined,
      });
      const product = buildProduct({ stock: 10 });

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'El ajuste de salida requiere un motivo en observations',
      );
    });
  });

  describe('execute()', () => {
    it('CP-18: anula la venta fuente y aplica el ajuste de salida', async () => {
      const dto = buildMovementDto({
        type: MovementType.AJUSTE_SALIDA,
        quantity: 3,
        observations: 'Ajuste por conteo',
        sourceMovementId: SOURCE_ID,
        clientId: undefined,
        clientType: undefined,
      });
      const sourceMovement = buildSourceMovement({ quantity: 7 });
      const freshProduct = buildProduct({ stock: 43 });
      const queryRunner = buildMockQueryRunner(sourceMovement, freshProduct);

      const result = await handler.execute(dto, freshProduct, queryRunner);

      expect(queryRunner.manager.save).toHaveBeenCalledTimes(4);
      expect(result.type).toBe(MovementType.AJUSTE_SALIDA);
      expect(result.quantity).toBe(3);
    });

    it('CP-18 / RN-06: execute rechaza ajuste que dejaría stock negativo tras revertir la venta', async () => {
      const dto = buildMovementDto({
        type: MovementType.AJUSTE_SALIDA,
        quantity: 10,
        observations: 'Ajuste por pérdida',
        sourceMovementId: SOURCE_ID,
        clientId: undefined,
        clientType: undefined,
      });
      const sourceMovement = buildSourceMovement({ quantity: 2 });
      const freshProduct = buildProduct({ stock: 3, name: 'PROD-004' });
      const queryRunner = buildMockQueryRunner(sourceMovement, freshProduct);

      await expect(handler.execute(dto, freshProduct, queryRunner)).rejects.toThrow(
        'Stock insuficiente para "PROD-004": disponible 5, requerido 10',
      );
    });

    it('debe lanzar error si no se encuentra el movimiento fuente', async () => {
      const dto = buildMovementDto({
        type: MovementType.AJUSTE_SALIDA,
        quantity: 1,
        observations: 'Test',
        sourceMovementId: 'invalid-id',
      });
      const queryRunner = buildMockQueryRunner(null, buildProduct());

      await expect(handler.execute(dto, buildProduct(), queryRunner)).rejects.toThrow(
        'Movimiento fuente no encontrado en la transacción'
      );
    });

    it('debe lanzar error si no se encuentra el producto', async () => {
      const dto = buildMovementDto({
        type: MovementType.AJUSTE_SALIDA,
        quantity: 1,
        observations: 'Test',
        sourceMovementId: SOURCE_ID,
      });
      const queryRunner = buildMockQueryRunner(buildSourceMovement(), null);

      await expect(handler.execute(dto, buildProduct(), queryRunner)).rejects.toThrow(
        'Producto no encontrado en la transacción'
      );
    });
  });
});
