import { AjusteSalidaHandler } from '../../../src/service/movement/handlers/AjusteSalidaHandler';
import { MovementType } from '../../../src/entity/MovementType';
import {
  buildMovementDto,
  buildProduct,
  createMockQueryRunner,
} from '../../helpers/movementTestHelpers';

describe('AjusteSalidaHandler - CP-18 (RN-06)', () => {
  const handler = new AjusteSalidaHandler();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate()', () => {
    it('CP-18: debe permitir ajuste de salida cuando hay stock suficiente', async () => {
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

    it('CP-18 / RN-06: debe rechazar ajuste de salida que dejaría stock negativo', async () => {
      const dto = buildMovementDto({
        type: MovementType.AJUSTE_SALIDA,
        quantity: 10,
        observations: 'Ajuste por pérdida',
        clientId: undefined,
        clientType: undefined,
      });
      const product = buildProduct({ stock: 3, name: 'PROD-004' });

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'Stock insuficiente para "PROD-004": disponible 3, requerido 10',
      );
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
    it('CP-18: debe descontar stock sin dejar valores negativos', async () => {
      const dto = buildMovementDto({
        type: MovementType.AJUSTE_SALIDA,
        quantity: 3,
        observations: 'Ajuste por conteo',
        clientId: undefined,
        clientType: undefined,
      });
      const product = buildProduct({ stock: 3 });
      const queryRunner = createMockQueryRunner();

      await handler.execute(dto, product, queryRunner);

      expect(product.stock).toBe(0);
      expect(product.stock).toBeGreaterThanOrEqual(0);
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
    });
  });
});
