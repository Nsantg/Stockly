import { EntradaHandler } from '../../../src/service/movement/handlers/EntradaHandler';
import { DanoHandler } from '../../../src/service/movement/handlers/DanoHandler';
import { VencimientoHandler } from '../../../src/service/movement/handlers/VencimientoHandler';
import { AjusteIngresoHandler } from '../../../src/service/movement/handlers/AjusteIngresoHandler';
import { TrasladoHandler } from '../../../src/service/movement/handlers/TrasladoHandler';
import { BaseMovementHandler } from '../../../src/service/movement/handlers/BaseMovementHandler';
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

class TestMovementHandler extends BaseMovementHandler {
  async validate(dto: any, product: any): Promise<void> {}
  async execute(dto: any, product: any, queryRunner: any): Promise<Movement> {
    return {} as any;
  }
  public testAssertSufficientStock(product: Product, quantity: number): void {
    this.assertSufficientStock(product, quantity);
  }
  public async testApplyStockDelta(
    queryRunner: QueryRunner,
    product: Product,
    delta: number,
    locationMode: 'bodega' | 'auto' | null = null,
  ): Promise<void> {
    await this.applyStockDelta(queryRunner, product, delta, locationMode);
  }
}

describe('Handlers restantes de movimiento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('BaseMovementHandler', () => {
    const handler = new TestMovementHandler();

    it('assertSufficientStock debe lanzar error si el stock es insuficiente', () => {
      const product = buildProduct({ stock: 5, name: 'Prod' });
      expect(() => handler.testAssertSufficientStock(product, 10)).toThrow(
        'Stock insuficiente para "Prod": disponible 5, requerido 10'
      );
    });

    it('applyStockDelta con delta > 0 y locationMode = bodega', async () => {
      const product = buildProduct({ stockBodega: 10, stockVitrina: 5 });
      const queryRunner = createMockQueryRunner();

      await handler.testApplyStockDelta(queryRunner, product, 5, 'bodega');

      expect(product.stockBodega).toBe(15);
      expect(product.stock).toBe(20);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(Product, product);
    });

    it('applyStockDelta con delta > 0 y locationMode = auto (no hace nada)', async () => {
      const product = buildProduct({ stockBodega: 10, stockVitrina: 5 });
      const queryRunner = createMockQueryRunner();

      await handler.testApplyStockDelta(queryRunner, product, 5, 'auto');

      expect(product.stockBodega).toBe(10);
      expect(product.stock).toBe(15);
    });

    it('applyStockDelta con delta < 0 y locationMode = auto', async () => {
      const product = buildProduct({ stockBodega: 10, stockVitrina: 5 });
      const queryRunner = createMockQueryRunner();

      await handler.testApplyStockDelta(queryRunner, product, -7, 'auto');

      // Resta 5 de vitrina y 2 de bodega
      expect(product.stockVitrina).toBe(0);
      expect(product.stockBodega).toBe(8);
      expect(product.stock).toBe(8);
    });

    it('applyStockDelta con delta < 0 y locationMode = bodega (no hace nada)', async () => {
      const product = buildProduct({ stockBodega: 10, stockVitrina: 5 });
      const queryRunner = createMockQueryRunner();

      await handler.testApplyStockDelta(queryRunner, product, -5, 'bodega');

      expect(product.stockBodega).toBe(10);
      expect(product.stock).toBe(15);
    });
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

    it('execute crea un lote cuando se provee lotNumber y expirationDate', async () => {
      const dto = buildMovementDto({
        type: MovementType.ENTRADA,
        quantity: 30,
        lotNumber: 'LOTE-001',
        expirationDate: '2027-06-01',
      });
      const product = buildProduct({ stock: 20 });
      const queryRunner = createMockQueryRunner();

      const movement = await handler.execute(dto, product, queryRunner);

      expect(product.stock).toBe(50);
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
      expect(queryRunner.manager.insert).toHaveBeenCalledTimes(1);
      expect(movement.type).toBe(MovementType.ENTRADA);
    });

    it('execute crea un lote cuando se provee lotNumber pero no expirationDate', async () => {
      const dto = buildMovementDto({
        type: MovementType.ENTRADA,
        quantity: 30,
        lotNumber: 'LOTE-001',
        expirationDate: undefined,
      });
      const product = buildProduct({ stock: 20 });
      const queryRunner = createMockQueryRunner();

      await handler.execute(dto, product, queryRunner);

      expect(queryRunner.manager.insert).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ expirationDate: null })
      );
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

    it('debe lanzar error si no se encuentra el movimiento fuente', async () => {
      const dto = buildMovementDto({
        type: MovementType.AJUSTE_INGRESO,
        quantity: 5,
        observations: 'Test',
        sourceMovementId: 'invalid-id',
      });

      const queryRunner: QueryRunner = {
        manager: {
          findOne: jest.fn().mockResolvedValue(null),
        },
      } as unknown as QueryRunner;

      await expect(handler.execute(dto, buildProduct(), queryRunner)).rejects.toThrow(
        'Movimiento fuente no encontrado en la transacción'
      );
    });

    it('debe lanzar error si no se encuentra el producto', async () => {
      const dto = buildMovementDto({
        type: MovementType.AJUSTE_INGRESO,
        quantity: 5,
        observations: 'Test',
        sourceMovementId: 'source-id',
      });

      const queryRunner: QueryRunner = {
        manager: {
          findOne: jest.fn().mockImplementation(async (entity: unknown) => {
            if (entity === Movement) return { id: 'source-id' };
            if (entity === Product) return null;
            return null;
          }),
        },
      } as unknown as QueryRunner;

      await expect(handler.execute(dto, buildProduct(), queryRunner)).rejects.toThrow(
        'Producto no encontrado en la transacción'
      );
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
