import { DevolucionHandler } from '../../../src/service/movement/handlers/DevolucionHandler';
import { Product } from '../../../src/entity/Product';
import { MovementType } from '../../../src/entity/MovementType';
import {
  buildMovementDto,
  buildProduct,
  createMockQueryRunner,
  TEST_CLIENT_ID,
} from '../../helpers/movementTestHelpers';

describe('DevolucionHandler - CP-15 / CP-16 (RN-04)', () => {
  const handler = new DevolucionHandler();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate()', () => {
    it('CP-15: debe permitir devolución de producto eléctrico con datos completos', async () => {
      const dto = buildMovementDto({
        type: MovementType.DEVOLUCION,
        quantity: 1,
        clientId: TEST_CLIENT_ID,
        returnCause: 'Producto defectuoso',
        returnDescription: 'Falla eléctrica intermitente',
      });
      const product = buildProduct({ allowsSerialNumber: true, stock: 10 });

      await expect(handler.validate(dto, product)).resolves.toBeUndefined();
    });

    it('CP-16 / RN-04: debe rechazar devolución de producto no eléctrico', async () => {
      const dto = buildMovementDto({
        type: MovementType.DEVOLUCION,
        quantity: 1,
        clientId: TEST_CLIENT_ID,
        returnCause: 'Cliente insatisfecho',
      });
      const product = buildProduct({ allowsSerialNumber: false, name: 'MASO-001' });

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'Solo se pueden registrar devoluciones de productos eléctricos (con número de serie habilitado)',
      );
    });

    it('CP-16: debe rechazar si el producto no tiene subcategoría/categoría cargada', async () => {
      const dto = buildMovementDto({
        type: MovementType.DEVOLUCION,
        clientId: TEST_CLIENT_ID,
        returnCause: 'Defecto',
      });
      const product = buildProduct();
      product.subcategory = undefined as unknown as Product['subcategory'];

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'Solo se pueden registrar devoluciones de productos eléctricos (con número de serie habilitado)',
      );
    });

    it('debe fallar si falta clientId en la devolución', async () => {
      const dto = buildMovementDto({
        type: MovementType.DEVOLUCION,
        clientId: undefined,
        returnCause: 'Defecto',
      });
      const product = buildProduct({ allowsSerialNumber: true });

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'La devolución requiere un cliente (clientId)',
      );
    });

    it('debe fallar si falta returnCause en la devolución', async () => {
      const dto = buildMovementDto({
        type: MovementType.DEVOLUCION,
        returnCause: undefined,
      });
      const product = buildProduct({ allowsSerialNumber: true });

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'La devolución requiere la causa (returnCause)',
      );
    });
  });

  describe('execute()', () => {
    it('CP-15: debe incrementar stock y persistir la devolución', async () => {
      const dto = buildMovementDto({
        type: MovementType.DEVOLUCION,
        quantity: 1,
        clientId: TEST_CLIENT_ID,
        returnCause: 'Producto defectuoso',
        returnDescription: 'No enciende',
      });
      const product = buildProduct({ allowsSerialNumber: true, stock: 10 });
      const queryRunner = createMockQueryRunner();

      const movement = await handler.execute(dto, product, queryRunner);

      expect(product.stock).toBe(11);
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
      expect(movement.returnCause).toBe('Producto defectuoso');
      expect(movement.clientId).toBe(TEST_CLIENT_ID);
    });

    it('execute persiste null en returnDescription cuando no se envía', async () => {
      const dto = buildMovementDto({
        type: MovementType.DEVOLUCION,
        quantity: 1,
        clientId: TEST_CLIENT_ID,
        returnCause: 'Producto defectuoso',
        returnDescription: undefined,
      });
      const product = buildProduct({ allowsSerialNumber: true, stock: 10 });
      const queryRunner = createMockQueryRunner();

      const movement = await handler.execute(dto, product, queryRunner);

      expect(movement.returnDescription).toBeNull();
    });

    it('execute directamente con clientId y returnCause undefined debe poner null', async () => {
      const dto = buildMovementDto({
        type: MovementType.DEVOLUCION,
        quantity: 1,
        clientId: undefined,
        returnCause: undefined,
        returnDescription: undefined,
      });
      const product = buildProduct({ allowsSerialNumber: true, stock: 10 });
      const queryRunner = createMockQueryRunner();

      const movement = await handler.execute(dto, product, queryRunner);

      expect(movement.clientId).toBeNull();
      expect(movement.returnCause).toBeNull();
    });
  });
});
