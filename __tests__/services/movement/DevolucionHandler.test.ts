import { DevolucionHandler } from '../../../src/service/movement/handlers/DevolucionHandler';
import { Movement } from '../../../src/entity/Movement';
import { Product } from '../../../src/entity/Product';
import { MovementType } from '../../../src/entity/MovementType';
import {
  buildMovementDto,
  buildProduct,
  createMockQueryRunner,
  TEST_CLIENT_ID,
} from '../../helpers/movementTestHelpers';

const TEST_SOURCE_MOVEMENT_ID = 'source-movement-uuid-1234-5678';

function buildSourceMovement(overrides: Partial<Movement> = {}): Movement {
  return {
    id: TEST_SOURCE_MOVEMENT_ID,
    type: MovementType.VENTA,
    quantity: 5,
    clientId: TEST_CLIENT_ID,
    isAnnulled: false,
    ...overrides,
  } as Movement;
}

function createMockQueryRunnerWithFindOne(sourceMovement: Movement, freshProduct: Product): any {
  return {
    manager: {
      save: jest.fn().mockImplementation(async (_entity: unknown, data: unknown) => ({
        id: 'movement-uuid',
        ...(data as object),
      })),
      find: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      findOne: jest.fn()
        .mockResolvedValueOnce(sourceMovement)
        .mockResolvedValueOnce(freshProduct),
    },
  };
}

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
        sourceMovementId: TEST_SOURCE_MOVEMENT_ID,
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
        returnCause: 'Defecto',
      });
      const product = buildProduct();
      product.subcategory = undefined as unknown as Product['subcategory'];

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'Solo se pueden registrar devoluciones de productos eléctricos (con número de serie habilitado)',
      );
    });

    it('debe fallar si falta sourceMovementId en la devolución', async () => {
      const dto = buildMovementDto({
        type: MovementType.DEVOLUCION,
        sourceMovementId: undefined,
        returnCause: 'Defecto',
      });
      const product = buildProduct({ allowsSerialNumber: true });

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'La devolución requiere una venta de origen (sourceMovementId)',
      );
    });

    it('debe fallar si falta returnCause en la devolución', async () => {
      const dto = buildMovementDto({
        type: MovementType.DEVOLUCION,
        sourceMovementId: TEST_SOURCE_MOVEMENT_ID,
        returnCause: undefined,
      });
      const product = buildProduct({ allowsSerialNumber: true });

      await expect(handler.validate(dto, product)).rejects.toThrow(
        'La devolución requiere la causa (returnCause)',
      );
    });
  });

  describe('execute()', () => {
    it('CP-15: debe reducir cantidad de venta y restaurar stock en devolución parcial', async () => {
      const dto = buildMovementDto({
        type: MovementType.DEVOLUCION,
        quantity: 1,
        sourceMovementId: TEST_SOURCE_MOVEMENT_ID,
        returnCause: 'Producto defectuoso',
        returnDescription: 'No enciende',
      });
      const product = buildProduct({ allowsSerialNumber: true, stock: 10 });
      const sourceMovement = buildSourceMovement({ quantity: 5 });
      const freshProduct = buildProduct({ allowsSerialNumber: true, stock: 10, stockBodega: 10 });
      const queryRunner = createMockQueryRunnerWithFindOne(sourceMovement, freshProduct);

      const movement = await handler.execute(dto, product, queryRunner);

      expect(freshProduct.stockBodega).toBe(11);
      expect(sourceMovement.quantity).toBe(4);
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(3);
      expect(movement.returnCause).toBe('Producto defectuoso');
      expect(movement.clientId).toBe(TEST_CLIENT_ID);
    });

    it('debe anular la venta si se devuelve la cantidad total', async () => {
      const dto = buildMovementDto({
        type: MovementType.DEVOLUCION,
        quantity: 5,
        sourceMovementId: TEST_SOURCE_MOVEMENT_ID,
        returnCause: 'Producto defectuoso',
      });
      const product = buildProduct({ allowsSerialNumber: true, stock: 10 });
      const sourceMovement = buildSourceMovement({ quantity: 5 });
      const freshProduct = buildProduct({ allowsSerialNumber: true, stock: 10, stockBodega: 10 });
      const queryRunner = createMockQueryRunnerWithFindOne(sourceMovement, freshProduct);

      await handler.execute(dto, product, queryRunner);

      expect(sourceMovement.isAnnulled).toBe(true);
      expect(sourceMovement.annulledReason).toContain('Devolución completa');
    });

    it('execute persiste null en returnDescription cuando no se envía', async () => {
      const dto = buildMovementDto({
        type: MovementType.DEVOLUCION,
        quantity: 1,
        sourceMovementId: TEST_SOURCE_MOVEMENT_ID,
        returnCause: 'Producto defectuoso',
        returnDescription: undefined,
      });
      const product = buildProduct({ allowsSerialNumber: true, stock: 10 });
      const sourceMovement = buildSourceMovement({ quantity: 5 });
      const freshProduct = buildProduct({ allowsSerialNumber: true, stock: 10, stockBodega: 10 });
      const queryRunner = createMockQueryRunnerWithFindOne(sourceMovement, freshProduct);

      const movement = await handler.execute(dto, product, queryRunner);

      expect(movement.returnDescription).toBeNull();
    });
  });
});
