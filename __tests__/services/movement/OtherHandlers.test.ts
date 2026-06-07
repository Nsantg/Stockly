import { EntradaHandler } from '../../../src/service/movement/handlers/EntradaHandler';
import { DanoHandler } from '../../../src/service/movement/handlers/DanoHandler';
import { VencimientoHandler } from '../../../src/service/movement/handlers/VencimientoHandler';
import { AjusteIngresoHandler } from '../../../src/service/movement/handlers/AjusteIngresoHandler';
import { TrasladoHandler } from '../../../src/service/movement/handlers/TrasladoHandler';
import { MovementType } from '../../../src/entity/MovementType';
import { LocationType } from '../../../src/entity/LocationType';
import {
  buildMovementDto,
  buildProduct,
  createMockQueryRunner,
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

    it('execute incrementa el stock', async () => {
      const dto = buildMovementDto({
        type: MovementType.AJUSTE_INGRESO,
        quantity: 5,
        observations: 'Diferencia conteo físico',
        clientId: undefined,
        clientType: undefined,
      });
      const product = buildProduct({ stock: 50 });
      const queryRunner = createMockQueryRunner();

      await handler.execute(dto, product, queryRunner);

      expect(product.stock).toBe(55);
    });
  });

  describe('TrasladoHandler - CP-14', () => {
    const handler = new TrasladoHandler();

    it('validate no impone restricciones adicionales', async () => {
      const dto = buildMovementDto({ type: MovementType.TRASLADO, quantity: 10 });

      await expect(handler.validate(dto, buildProduct())).resolves.toBeUndefined();
    });

    it('execute registra traslado sin descontar stock total', async () => {
      const dto = buildMovementDto({
        type: MovementType.TRASLADO,
        quantity: 10,
        clientId: undefined,
        clientType: undefined,
      });
      const product = buildProduct({ stock: 45 });
      const queryRunner = createMockQueryRunner();

      const movement = await handler.execute(dto, product, queryRunner);

      expect(product.stock).toBe(45);
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(1);
      expect(movement.sourceLocation).toBe(LocationType.BODEGA);
      expect(movement.targetLocation).toBe(LocationType.VITRINA);
      expect(movement.type).toBe(MovementType.TRASLADO);
    });
  });
});
