import { EntradaHandler } from '../../../src/service/movement/handlers/EntradaHandler';
import { DanoHandler } from '../../../src/service/movement/handlers/DanoHandler';
import { VencimientoHandler } from '../../../src/service/movement/handlers/VencimientoHandler';
import { AjusteIngresoHandler } from '../../../src/service/movement/handlers/AjusteIngresoHandler';
import { TrasladoHandler } from '../../../src/service/movement/handlers/TrasladoHandler';
import { MovementType } from '../../../src/entity/MovementType';
import { LocationType } from '../../../src/entity/LocationType';
import { Movement } from '../../../src/entity/Movement';
import { Product } from '../../../src/entity/Product';
import { QueryRunner } from 'typeorm';
import {
  buildMovementDto,
  buildProduct,
  createMockQueryRunner,
  TEST_PRODUCT_ID,
} from '../../helpers/movementTestHelpers';

describe('Handlers restantes de movimiento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EntradaHandler - CP-07', () => {
    const handler = new EntradaHandler();

    it('validate no impone restricciones adicionales', async () => {
      const dto = buildMovementDto({ type: MovementType.ENTRADA, quantity: 20 });
      const product = buildProduct({ stock: 50 });

      await expect(handler.validate(dto, product)).resolves.toBeUndefined();
    });

    it('execute incrementa el stock y persiste el movimiento', async () => {
      const dto = buildMovementDto({
        type: MovementType.ENTRADA,
        quantity: 20,
        clientId: undefined,
        clientType: undefined,
      });
      const product = buildProduct({ stock: 50 });
      const queryRunner = createMockQueryRunner();

      const movement = await handler.execute(dto, product, queryRunner);

      expect(product.stock).toBe(70);
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
      expect(movement.type).toBe(MovementType.ENTRADA);
      expect(movement.quantity).toBe(20);
    });
  });

  describe('DanoHandler - CP-12', () => {
    const handler = new DanoHandler();

    it('validate permite salida cuando hay stock suficiente', async () => {
      const dto = buildMovementDto({ type: MovementType.DAÑO, quantity: 2 });
      const product = buildProduct({ stock: 10 });

      await expect(handler.validate(dto, product)).resolves.toBeUndefined();
    });

    it('validate rechaza salida por daño si el stock es insuficiente', async () => {
      const dto = buildMovementDto({ type: MovementType.DAÑO, quantity: 5 });
      const product = buildProduct({ stock: 2, name: 'PROD-001' });

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'Stock insuficiente para "PROD-001": disponible 2, requerido 5',
      );
    });

    it('execute descuenta stock sin solicitar datos de cliente', async () => {
      const dto = buildMovementDto({
        type: MovementType.DAÑO,
        quantity: 2,
        clientId: undefined,
        clientType: undefined,
      });
      const product = buildProduct({ stock: 10 });
      const queryRunner = createMockQueryRunner();

      const movement = await handler.execute(dto, product, queryRunner);

      expect(product.stock).toBe(8);
      expect(movement.type).toBe(MovementType.DAÑO);
      expect(movement.clientId).toBeUndefined();
    });
  });

  describe('VencimientoHandler - CP-12', () => {
    const handler = new VencimientoHandler();

    it('validate permite salida cuando hay stock suficiente', async () => {
      const dto = buildMovementDto({ type: MovementType.VENCIMIENTO, quantity: 1 });
      const product = buildProduct({ stock: 10 });

      await expect(handler.validate(dto, product)).resolves.toBeUndefined();
    });

    it('validate rechaza salida por vencimiento si el stock es insuficiente', async () => {
      const dto = buildMovementDto({ type: MovementType.VENCIMIENTO, quantity: 4 });
      const product = buildProduct({ stock: 1, name: 'PROD-003' });

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'Stock insuficiente para "PROD-003": disponible 1, requerido 4',
      );
    });

    it('execute descuenta stock por vencimiento', async () => {
      const dto = buildMovementDto({
        type: MovementType.VENCIMIENTO,
        quantity: 1,
        clientId: undefined,
        clientType: undefined,
      });
      const product = buildProduct({ stock: 10 });
      const queryRunner = createMockQueryRunner();

      const movement = await handler.execute(dto, product, queryRunner);

      expect(product.stock).toBe(9);
      expect(movement.type).toBe(MovementType.VENCIMIENTO);
    });
  });

  describe('AjusteIngresoHandler - CP-17', () => {
    const handler = new AjusteIngresoHandler();

    it('validate exige motivo en observations', async () => {
      const dto = buildMovementDto({
        type: MovementType.AJUSTE_INGRESO,
        observations: undefined,
      });

      await expect(handler.validate(dto, buildProduct())).rejects.toThrow(
        'El ajuste de ingreso requiere un motivo en observations',
      );
    });

    it('validate permite ajuste de ingreso con motivo', async () => {
      const dto = buildMovementDto({
        type: MovementType.AJUSTE_INGRESO,
        observations: 'Diferencia conteo físico',
      });

      await expect(handler.validate(dto, buildProduct())).resolves.toBeUndefined();
    });

    it('execute anula la entrada fuente y aplica el ajuste', async () => {
      const SOURCE_ID = 'source-uuid-aaaa-bbbb-cccc-dddddddddddd';
      const sourceMovement = {
        id: SOURCE_ID,
        type: MovementType.ENTRADA,
        quantity: 10,
        productId: TEST_PRODUCT_ID,
        isAnnulled: false,
        annulledAt: null,
        annulledById: null,
        annulledReason: null,
      } as unknown as Movement;

      const dto = buildMovementDto({
        type: MovementType.AJUSTE_INGRESO,
        quantity: 5,
        observations: 'Diferencia conteo físico',
        sourceMovementId: SOURCE_ID,
        clientId: undefined,
        clientType: undefined,
      });

      const queryRunner: QueryRunner = {
        manager: {
          findOne: jest.fn().mockImplementation(async (entity: unknown) => {
            if (entity === Movement) return { ...sourceMovement };
            if (entity === Product) return buildProduct({ stock: 50 });
            return null;
          }),
          save: jest.fn().mockImplementation(async (_entity: unknown, data: unknown) => ({
            id: 'movement-uuid',
            ...(data as object),
          })),
        },
      } as unknown as QueryRunner;

      const result = await handler.execute(dto, buildProduct({ stock: 50 }), queryRunner);

      expect(queryRunner.manager.save).toHaveBeenCalledTimes(4);
      expect(result.type).toBe(MovementType.AJUSTE_INGRESO);
      expect(result.quantity).toBe(5);
    });
  });

  describe('TrasladoHandler - CP-14', () => {
    const handler = new TrasladoHandler();

    it('validate permite traslado cuando hay stock suficiente en bodega', async () => {
      const dto = buildMovementDto({ type: MovementType.TRASLADO, quantity: 10 });
      const product = buildProduct({ stock: 45, stockBodega: 45, stockVitrina: 0 });

      await expect(handler.validate(dto, product)).resolves.toBeUndefined();
    });

    it('validate rechaza traslado si el stock en bodega es insuficiente', async () => {
      const dto = buildMovementDto({ type: MovementType.TRASLADO, quantity: 20 });
      const product = buildProduct({ stock: 45, stockBodega: 5, stockVitrina: 40, name: 'PROD-001' });

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'Stock insuficiente en bodega para "PROD-001": disponible 5, requerido 20',
      );
    });

    it('execute mueve stock de bodega a vitrina sin cambiar el total', async () => {
      const dto = buildMovementDto({
        type: MovementType.TRASLADO,
        quantity: 10,
        clientId: undefined,
        clientType: undefined,
      });
      const product = buildProduct({ stock: 45, stockBodega: 45, stockVitrina: 0 });
      const queryRunner = createMockQueryRunner();

      const movement = await handler.execute(dto, product, queryRunner);

      expect(product.stock).toBe(45);
      expect(product.stockBodega).toBe(35);
      expect(product.stockVitrina).toBe(10);
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
      expect(movement.sourceLocation).toBe(LocationType.BODEGA);
      expect(movement.targetLocation).toBe(LocationType.VITRINA);
      expect(movement.type).toBe(MovementType.TRASLADO);
    });
  });
});
