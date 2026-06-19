import { VentaHandler } from '../../../src/service/movement/handlers/VentaHandler';
import { MovementType } from '../../../src/entity/MovementType';
import { ClientType } from '../../../src/entity/ClientType';
import {
  buildMovementDto,
  buildProduct,
  createMockQueryRunner,
  TEST_CLIENT_ID,
} from '../../helpers/movementTestHelpers';

describe('VentaHandler - CP-10 / CP-11 (RN-06)', () => {
  const handler = new VentaHandler();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate()', () => {
    it('CP-10: debe permitir una venta válida con clientId y clientType', async () => {
      const dto = buildMovementDto({
        type: MovementType.VENTA,
        quantity: 5,
        clientId: TEST_CLIENT_ID,
        clientType: ClientType.DETAL,
        totalWeight: 2.5,
      });
      const product = buildProduct({ stock: 50 });

      await expect(handler.validate(dto, product)).resolves.toBeUndefined();
    });

    it('CP-10: debe fallar si no se envía clientId', async () => {
      const dto = buildMovementDto({
        clientId: undefined,
        clientType: ClientType.DETAL,
      });
      const product = buildProduct({ stock: 50 });

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'La venta requiere un cliente (clientId)',
      );
    });

    it('CP-10: debe fallar si no se envía clientType', async () => {
      const dto = buildMovementDto({
        clientId: TEST_CLIENT_ID,
        clientType: undefined,
      });
      const product = buildProduct({ stock: 50 });

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'La venta requiere el tipo de cliente (clientType)',
      );
    });

    it('CP-11 / RN-06: debe rechazar la venta cuando el stock es insuficiente', async () => {
      const dto = buildMovementDto({ quantity: 10 });
      const product = buildProduct({ stock: 3, name: 'PROD-002' });

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'Stock insuficiente para "PROD-002": disponible 3, requerido 10',
      );
    });

    it('CP-11 / RN-06: debe permitir una salida con cantidad exacta al stock disponible', async () => {
      const dto = buildMovementDto({ quantity: 3 });
      const product = buildProduct({ stock: 3 });

      await expect(handler.validate(dto, product)).resolves.toBeUndefined();
    });
  });

  describe('execute()', () => {
    it('CP-10: debe descontar stock y persistir el movimiento con datos del cliente', async () => {
      const dto = buildMovementDto({
        quantity: 5,
        clientId: TEST_CLIENT_ID,
        clientType: ClientType.MAYORISTA,
        totalWeight: 2.5,
      });
      const product = buildProduct({ stock: 50 });
      const queryRunner = createMockQueryRunner();

      const movement = await handler.execute(dto, product, queryRunner);

      expect(product.stock).toBe(45);
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
      expect(movement.clientId).toBe(TEST_CLIENT_ID);
      expect(movement.clientType).toBe(ClientType.MAYORISTA);
      expect(movement.totalWeight).toBe(2.5);
    });

    it('execute persiste null en campos opcionales no enviados', async () => {
      const dto = buildMovementDto({
        quantity: 1,
        totalWeight: undefined,
      });
      const product = buildProduct({ stock: 50 });
      const queryRunner = createMockQueryRunner();

      const movement = await handler.execute(dto, product, queryRunner);

      expect(movement.totalWeight).toBeNull();
    });

    it('líneas 33-34: descuenta stock del lote FEFO cuando existen lotes con stock', async () => {
      const dto = buildMovementDto({ quantity: 3, clientId: TEST_CLIENT_ID, clientType: ClientType.DETAL });
      const product = buildProduct({ stock: 50, stockBodega: 50, stockVitrina: 0 });

      const mockLot = { id: 'lot-uuid', stock: 10 };
      const queryRunnerWithLots = {
        manager: {
          save: jest.fn().mockImplementation(async (_entity: unknown, data: unknown) => ({
            id: 'movement-uuid',
            ...(data as object),
          })),
          find: jest.fn().mockResolvedValue([mockLot]),
          insert: jest.fn().mockResolvedValue({}),
          update: jest.fn().mockResolvedValue({}),
        },
      } as unknown as import('typeorm').QueryRunner;

      await handler.execute(dto, product, queryRunnerWithLots);

      expect(queryRunnerWithLots.manager.update).toHaveBeenCalledWith(
        expect.anything(),
        'lot-uuid',
        { stock: 7 },
      );
    });

    it('líneas 33-34: no actualiza lotes cuando no hay lotes disponibles', async () => {
      const dto = buildMovementDto({ quantity: 2, clientId: TEST_CLIENT_ID, clientType: ClientType.DETAL });
      const product = buildProduct({ stock: 50 });
      const queryRunner = createMockQueryRunner();

      await handler.execute(dto, product, queryRunner);

      expect(queryRunner.manager.update).not.toHaveBeenCalled();
    });
  });
});
