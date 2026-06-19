import { movementService } from '../../src/service/MovementService';
import { productRepository } from '../../src/repository/ProductRepository';
import { movementRepository } from '../../src/repository/MovementRepository';
import { getDataSource } from '../../src/lib/database';
import { uploadImage } from '../../src/lib/cloudinary';
import { MovementType } from '../../src/entity/MovementType';
import { ClientType } from '../../src/entity/ClientType';
import { BusinessError } from '../../src/lib/errors';
import { MovementFactory } from '../../src/service/movement/MovementFactory';
import * as alertNotifier from '../../src/lib/realtime/alertNotifier';
import { entryIssueService } from '../../src/service/EntryIssueService';

jest.mock('../../src/repository/ProductRepository');
jest.mock('../../src/repository/MovementRepository', () => ({
  movementRepository: {
    findById: jest.fn(),
    findAll: jest.fn(),
    findAllForExport: jest.fn(),
    findByProductId: jest.fn(),
    findByUserId: jest.fn(),
    save: jest.fn(),
  },
}));
jest.mock('../../src/lib/database');
jest.mock('../../src/lib/cloudinary', () => ({ uploadImage: jest.fn() }));
jest.mock('../../src/lib/realtime/alertNotifier', () => ({
  broadcastSummary: jest.fn().mockResolvedValue(undefined),
  notifyStockChange: jest.fn().mockResolvedValue(undefined),
  notifyExpirationIfNear: jest.fn().mockResolvedValue(undefined),
  notifyEntryIssue: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../src/lib/realtime/socketServer', () => ({
  initSocketServer: jest.fn(),
  getIO: jest.fn().mockReturnValue(null),
}));
jest.mock('../../src/service/movement/MovementFactory', () => ({
  MovementFactory: { getHandler: jest.fn() },
}));
jest.mock('../../src/service/EntryIssueService', () => ({
  entryIssueService: {
    create: jest.fn().mockResolvedValue({ id: 'issue-uuid-001' }),
  },
}));

// ─── UUIDs válidos ────────────────────────────────────────────────────────────

const PRODUCT_UUID = 'aaaaaaaa-0000-4000-8000-000000000001';
const USER_UUID    = 'aaaaaaaa-0000-4000-8000-000000000002';
const CLIENT_UUID  = 'aaaaaaaa-0000-4000-8000-000000000003';
const MOVEMENT_UUID = 'aaaaaaaa-0000-4000-8000-000000000004';
const SOURCE_UUID   = 'aaaaaaaa-0000-4000-8000-000000000005';
const NEW_PRODUCT_UUID = 'aaaaaaaa-0000-4000-8000-000000000006';

// ─── Datos base ───────────────────────────────────────────────────────────────

const MOCK_PRODUCT = {
  id: PRODUCT_UUID,
  name: 'Electrodo TENS',
  stock: 50,
  stockBodega: 50,
  stockVitrina: 0,
  minStock: 5,
  requiresRefrigeration: false,
  subcategory: { category: { allowsSerialNumber: false } },
};

const MOCK_MOVEMENT = {
  id: MOVEMENT_UUID,
  type: MovementType.VENTA,
  quantity: 5,
  productId: PRODUCT_UUID,
  userId: USER_UUID,
  isAnnulled: false,
  date: new Date(2026, 5, 19, 10, 0, 0),
  evidenceUrls: [] as string[],
};

// ─── Mock del handler de MovementFactory ─────────────────────────────────────

const mockHandler = {
  validate: jest.fn().mockResolvedValue(undefined),
  execute: jest.fn().mockResolvedValue({ id: MOVEMENT_UUID }),
};

// ─── Mock del queryRunner de TypeORM ─────────────────────────────────────────

const mockQr = {
  connect:             jest.fn().mockResolvedValue(undefined),
  startTransaction:    jest.fn().mockResolvedValue(undefined),
  commitTransaction:   jest.fn().mockResolvedValue(undefined),
  rollbackTransaction: jest.fn().mockResolvedValue(undefined),
  release:             jest.fn().mockResolvedValue(undefined),
  manager: {
    save:    jest.fn().mockResolvedValue({}),
    find:    jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    update:  jest.fn().mockResolvedValue({}),
    insert:  jest.fn().mockResolvedValue({}),
  },
};

const mockDataSource = { createQueryRunner: jest.fn().mockReturnValue(mockQr) };

function resetMocks() {
  jest.clearAllMocks();
  (MovementFactory.getHandler as jest.Mock).mockReturnValue(mockHandler);
  mockHandler.validate.mockResolvedValue(undefined);
  mockHandler.execute.mockResolvedValue({ id: MOVEMENT_UUID });
  (productRepository.findById as jest.Mock).mockResolvedValue({ ...MOCK_PRODUCT });
  (movementRepository.findById as jest.Mock).mockResolvedValue({ ...MOCK_MOVEMENT });
  (getDataSource as jest.Mock).mockResolvedValue(mockDataSource);
  mockDataSource.createQueryRunner.mockReturnValue(mockQr);
  mockQr.connect.mockResolvedValue(undefined);
  mockQr.startTransaction.mockResolvedValue(undefined);
  mockQr.commitTransaction.mockResolvedValue(undefined);
  mockQr.rollbackTransaction.mockResolvedValue(undefined);
  mockQr.release.mockResolvedValue(undefined);
  mockQr.manager.save.mockResolvedValue({});
  mockQr.manager.findOne.mockResolvedValue({ ...MOCK_PRODUCT });
  mockQr.manager.update.mockResolvedValue({});
}

// ═══════════════════════════════════════════════════════════════════════════════
// createMovement
// ═══════════════════════════════════════════════════════════════════════════════

describe('MovementService.createMovement (líneas 88-162)', () => {
  beforeEach(resetMocks);

  // ─── Rutas de error tempranas (pre-transacción) ───────────────────────────

  it('producto no encontrado → BusinessError', async () => {
    (productRepository.findById as jest.Mock).mockResolvedValue(null);
    await expect(
      movementService.createMovement({
        type: MovementType.VENTA,
        productId: PRODUCT_UUID,
        quantity: 5,
        userId: USER_UUID,
      }),
    ).rejects.toThrow(BusinessError);
    expect(getDataSource).not.toHaveBeenCalled();
  });

  it('tipo DEVOLUCION sin sourceMovementId → ZodError (refine)', async () => {
    await expect(
      movementService.createMovement({
        type: MovementType.DEVOLUCION,
        productId: PRODUCT_UUID,
        quantity: 3,
        userId: USER_UUID,
      } as never),
    ).rejects.toThrow();
  });

  it('sourceMovement no encontrado → BusinessError', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue(null);
    await expect(
      movementService.createMovement({
        type: MovementType.DEVOLUCION,
        sourceMovementId: SOURCE_UUID,
        quantity: 3,
        userId: USER_UUID,
      }),
    ).rejects.toThrow('Movimiento fuente no encontrado');
  });

  it('sourceMovement anulado → BusinessError', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({
      ...MOCK_MOVEMENT,
      id: SOURCE_UUID,
      type: MovementType.VENTA,
      isAnnulled: true,
      productId: PRODUCT_UUID,
    });
    await expect(
      movementService.createMovement({
        type: MovementType.DEVOLUCION,
        sourceMovementId: SOURCE_UUID,
        quantity: 3,
        userId: USER_UUID,
      }),
    ).rejects.toThrow('fue anulado');
  });

  it('AJUSTE_INGRESO requiere fuente de tipo ENTRADA', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({
      ...MOCK_MOVEMENT,
      id: SOURCE_UUID,
      type: MovementType.VENTA,
      isAnnulled: false,
      productId: PRODUCT_UUID,
    });
    await expect(
      movementService.createMovement({
        type: MovementType.AJUSTE_INGRESO,
        sourceMovementId: SOURCE_UUID,
        quantity: 3,
        userId: USER_UUID,
      }),
    ).rejects.toThrow('tipo ENTRADA');
  });

  it('AJUSTE_SALIDA requiere fuente de tipo VENTA', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({
      ...MOCK_MOVEMENT,
      id: SOURCE_UUID,
      type: MovementType.ENTRADA,
      isAnnulled: false,
      productId: PRODUCT_UUID,
    });
    await expect(
      movementService.createMovement({
        type: MovementType.AJUSTE_SALIDA,
        sourceMovementId: SOURCE_UUID,
        quantity: 3,
        userId: USER_UUID,
      }),
    ).rejects.toThrow('tipo VENTA');
  });

  it('DEVOLUCION requiere fuente de tipo VENTA', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({
      ...MOCK_MOVEMENT,
      id: SOURCE_UUID,
      type: MovementType.ENTRADA,
      isAnnulled: false,
      productId: PRODUCT_UUID,
    });
    await expect(
      movementService.createMovement({
        type: MovementType.DEVOLUCION,
        sourceMovementId: SOURCE_UUID,
        quantity: 3,
        userId: USER_UUID,
      }),
    ).rejects.toThrow('tipo VENTA');
  });

  // ─── Camino feliz VENTA ───────────────────────────────────────────────────

  it('VENTA: realiza commit, llama notifyStockChange y retorna movimiento', async () => {
    const { movement, warning } = await movementService.createMovement({
      type: MovementType.VENTA,
      productId: PRODUCT_UUID,
      quantity: 5,
      userId: USER_UUID,
    });

    expect(mockQr.commitTransaction).toHaveBeenCalled();
    expect(mockQr.release).toHaveBeenCalled();
    expect(alertNotifier.notifyStockChange).toHaveBeenCalled();
    expect(movement).toBeDefined();
    expect(warning).toBeNull();
  });

  it('producto con refrigeración → retorna warning', async () => {
    (productRepository.findById as jest.Mock).mockResolvedValue({
      ...MOCK_PRODUCT,
      requiresRefrigeration: true,
    });

    const { warning } = await movementService.createMovement({
      type: MovementType.VENTA,
      productId: PRODUCT_UUID,
      quantity: 5,
      userId: USER_UUID,
    });

    expect(warning).toMatch(/refriger/i);
  });

  it('error en handler.execute → rollback y release, relanza error', async () => {
    mockHandler.execute.mockRejectedValue(new BusinessError('Stock insuficiente'));

    await expect(
      movementService.createMovement({
        type: MovementType.VENTA,
        productId: PRODUCT_UUID,
        quantity: 5,
        userId: USER_UUID,
      }),
    ).rejects.toThrow('Stock insuficiente');

    expect(mockQr.rollbackTransaction).toHaveBeenCalled();
    expect(mockQr.release).toHaveBeenCalled();
    expect(mockQr.commitTransaction).not.toHaveBeenCalled();
  });

  // ─── DEVOLUCION: sourceMovement válido → productId tomado de fuente ───────

  it('DEVOLUCION: productId copiado de sourceMovement y transacción exitosa', async () => {
    (movementRepository.findById as jest.Mock)
      .mockResolvedValueOnce({
        ...MOCK_MOVEMENT,
        id: SOURCE_UUID,
        type: MovementType.VENTA,
        isAnnulled: false,
        productId: PRODUCT_UUID,
      })
      .mockResolvedValue({ ...MOCK_MOVEMENT });

    const result = await movementService.createMovement({
      type: MovementType.DEVOLUCION,
      sourceMovementId: SOURCE_UUID,
      quantity: 3,
      userId: USER_UUID,
    });

    expect(mockQr.commitTransaction).toHaveBeenCalled();
    expect(result.movement).toBeDefined();
  });

  // ─── ENTRADA: notificaciones adicionales ─────────────────────────────────

  it('ENTRADA con expirationDate → llama notifyExpirationIfNear', async () => {
    await movementService.createMovement({
      type: MovementType.ENTRADA,
      productId: PRODUCT_UUID,
      quantity: 10,
      userId: USER_UUID,
      expirationDate: '2027-12-31',
      lotNumber: 'LOT-001',
    });

    await Promise.resolve();
    expect(alertNotifier.notifyExpirationIfNear).toHaveBeenCalled();
  });

  it('ENTRADA con observations "Producto dañado" → crea EntryIssue', async () => {
    await movementService.createMovement({
      type: MovementType.ENTRADA,
      productId: PRODUCT_UUID,
      quantity: 10,
      userId: USER_UUID,
      observations: 'Producto dañado',
    });

    await Promise.resolve();
    expect(entryIssueService.create).toHaveBeenCalledWith(
      expect.objectContaining({ issueType: 'DAMAGED' }),
    );
  });

  it('ENTRADA con observations "Cantidad incorrecta" → crea EntryIssue MISSING', async () => {
    await movementService.createMovement({
      type: MovementType.ENTRADA,
      productId: PRODUCT_UUID,
      quantity: 5,
      userId: USER_UUID,
      observations: 'Cantidad incorrecta',
    });

    await Promise.resolve();
    expect(entryIssueService.create).toHaveBeenCalledWith(
      expect.objectContaining({ issueType: 'MISSING' }),
    );
  });

  it('ENTRADA con observations genérico → no crea EntryIssue', async () => {
    await movementService.createMovement({
      type: MovementType.ENTRADA,
      productId: PRODUCT_UUID,
      quantity: 5,
      userId: USER_UUID,
      observations: 'Todo bien',
    });

    await Promise.resolve();
    expect(entryIssueService.create).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// annulMovement
// ═══════════════════════════════════════════════════════════════════════════════

describe('MovementService.annulMovement (líneas 164-223)', () => {
  beforeEach(resetMocks);

  const ANNUL_DTO = { reason: 'Error de registro', userId: USER_UUID };

  it('movimiento no encontrado → BusinessError', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue(null);
    await expect(movementService.annulMovement(MOVEMENT_UUID, ANNUL_DTO)).rejects.toThrow(
      'Movimiento no encontrado',
    );
  });

  it('movimiento ya anulado → BusinessError', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({
      ...MOCK_MOVEMENT,
      isAnnulled: true,
    });
    await expect(movementService.annulMovement(MOVEMENT_UUID, ANNUL_DTO)).rejects.toThrow(
      'ya fue anulado',
    );
  });

  it('Zod: reason demasiado corta → lanza error', async () => {
    await expect(movementService.annulMovement(MOVEMENT_UUID, { reason: 'No', userId: USER_UUID })).rejects.toThrow();
  });

  it('anulación VENTA: ajusta stock y hace commit', async () => {
    (movementRepository.findById as jest.Mock)
      .mockResolvedValueOnce({ ...MOCK_MOVEMENT, type: MovementType.VENTA, quantity: 5 })
      .mockResolvedValue({ ...MOCK_MOVEMENT, isAnnulled: true });

    mockQr.manager.findOne.mockResolvedValue({ ...MOCK_PRODUCT });

    const result = await movementService.annulMovement(MOVEMENT_UUID, ANNUL_DTO);

    expect(mockQr.commitTransaction).toHaveBeenCalled();
    expect(mockQr.manager.update).toHaveBeenCalledWith(
      expect.anything(),
      MOVEMENT_UUID,
      expect.objectContaining({ isAnnulled: true }),
    );
    expect(alertNotifier.notifyStockChange).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('anulación TRASLADO: ajusta stockBodega y stockVitrina', async () => {
    (movementRepository.findById as jest.Mock)
      .mockResolvedValueOnce({ ...MOCK_MOVEMENT, type: MovementType.TRASLADO, quantity: 5 })
      .mockResolvedValue({ ...MOCK_MOVEMENT, isAnnulled: true });

    mockQr.manager.findOne.mockResolvedValue({
      ...MOCK_PRODUCT,
      stockBodega: 30,
      stockVitrina: 10,
    });

    await movementService.annulMovement(MOVEMENT_UUID, ANNUL_DTO);

    expect(mockQr.commitTransaction).toHaveBeenCalled();
  });

  it('anulación ENTRADA: reduce stockBodega (reversal ingreso)', async () => {
    (movementRepository.findById as jest.Mock)
      .mockResolvedValueOnce({ ...MOCK_MOVEMENT, type: MovementType.ENTRADA, quantity: 10 })
      .mockResolvedValue({ ...MOCK_MOVEMENT, isAnnulled: true });

    mockQr.manager.findOne.mockResolvedValue({ ...MOCK_PRODUCT, stockBodega: 60 });

    await movementService.annulMovement(MOVEMENT_UUID, ANNUL_DTO);

    expect(mockQr.commitTransaction).toHaveBeenCalled();
  });

  it('producto no encontrado en DB → salta stock update pero hace commit', async () => {
    (movementRepository.findById as jest.Mock)
      .mockResolvedValueOnce({ ...MOCK_MOVEMENT })
      .mockResolvedValue({ ...MOCK_MOVEMENT, isAnnulled: true });

    mockQr.manager.findOne.mockResolvedValue(null);

    await movementService.annulMovement(MOVEMENT_UUID, ANNUL_DTO);

    expect(mockQr.manager.save).not.toHaveBeenCalled();
    expect(mockQr.commitTransaction).toHaveBeenCalled();
  });

  it('error en transacción → rollback y release', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({ ...MOCK_MOVEMENT });
    mockQr.manager.findOne.mockResolvedValue({ ...MOCK_PRODUCT });
    mockQr.commitTransaction.mockRejectedValue(new Error('DB error'));

    await expect(movementService.annulMovement(MOVEMENT_UUID, ANNUL_DTO)).rejects.toThrow('DB error');

    expect(mockQr.rollbackTransaction).toHaveBeenCalled();
    expect(mockQr.release).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// editDispatch
// ═══════════════════════════════════════════════════════════════════════════════

describe('MovementService.editDispatch (líneas 225-334)', () => {
  beforeEach(resetMocks);

  it('movimiento no encontrado → BusinessError', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue(null);
    await expect(movementService.editDispatch(MOVEMENT_UUID, {}, USER_UUID)).rejects.toThrow(
      'Movimiento no encontrado',
    );
  });

  it('tipo distinto de VENTA → BusinessError', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({
      ...MOCK_MOVEMENT,
      type: MovementType.ENTRADA,
    });
    await expect(movementService.editDispatch(MOVEMENT_UUID, {}, USER_UUID)).rejects.toThrow(
      'tipo venta',
    );
  });

  it('movimiento anulado → BusinessError', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({
      ...MOCK_MOVEMENT,
      isAnnulled: true,
    });
    await expect(movementService.editDispatch(MOVEMENT_UUID, {}, USER_UUID)).rejects.toThrow(
      'anulado',
    );
  });

  it('turno diferente → BusinessError', async () => {
    jest.useFakeTimers({ now: new Date(2026, 5, 19, 15, 30, 0) }); // TARDE (15:30)
    (movementRepository.findById as jest.Mock).mockResolvedValue({
      ...MOCK_MOVEMENT,
      date: new Date(2026, 5, 19, 10, 0, 0), // MAÑANA
    });

    await expect(movementService.editDispatch(MOVEMENT_UUID, { quantity: 3 }, USER_UUID)).rejects.toThrow(
      'mismo turno',
    );
    jest.useRealTimers();
  });

  describe('con turno activo MAÑANA (10:00)', () => {
    const SHIFT_TIME = new Date(2026, 5, 19, 10, 0, 0);

    beforeAll(() => jest.useFakeTimers({ now: SHIFT_TIME }));
    afterAll(() => jest.useRealTimers());

    beforeEach(() => {
      (movementRepository.findById as jest.Mock)
        .mockResolvedValueOnce({ ...MOCK_MOVEMENT, date: SHIFT_TIME })
        .mockResolvedValue({ ...MOCK_MOVEMENT });

      mockQr.manager.findOne.mockResolvedValue({
        ...MOCK_PRODUCT,
        id: PRODUCT_UUID,
        stock: 50,
        stockBodega: 50,
        stockVitrina: 0,
      });
    });

    it('mismo producto: ajusta stock con nueva cantidad y hace commit', async () => {
      await movementService.editDispatch(MOVEMENT_UUID, { quantity: 3 }, USER_UUID);

      expect(mockQr.commitTransaction).toHaveBeenCalled();
      expect(alertNotifier.notifyStockChange).toHaveBeenCalled();
    });

    it('mismo producto con stock insuficiente → BusinessError', async () => {
      mockQr.manager.findOne.mockResolvedValue({
        ...MOCK_PRODUCT,
        stock: 2,
        stockBodega: 2,
        stockVitrina: 0,
      });
      (movementRepository.findById as jest.Mock).mockResolvedValue({
        ...MOCK_MOVEMENT,
        quantity: 5,
        date: SHIFT_TIME,
      });

      await expect(
        movementService.editDispatch(MOVEMENT_UUID, { quantity: 20 }, USER_UUID),
      ).rejects.toThrow(/[Ss]tock insuficiente/);

      expect(mockQr.rollbackTransaction).toHaveBeenCalled();
    });

    it('diferente producto: ajusta ambos productos y hace commit', async () => {
      (movementRepository.findById as jest.Mock)
        .mockResolvedValueOnce({ ...MOCK_MOVEMENT, date: SHIFT_TIME })
        .mockResolvedValue({ ...MOCK_MOVEMENT });

      mockQr.manager.findOne
        .mockResolvedValueOnce({ ...MOCK_PRODUCT, id: PRODUCT_UUID, stock: 50, stockBodega: 50, stockVitrina: 0 })
        .mockResolvedValueOnce({ id: NEW_PRODUCT_UUID, name: 'Nuevo Prod', stock: 30, stockBodega: 30, stockVitrina: 0 });

      await movementService.editDispatch(
        MOVEMENT_UUID,
        { productId: NEW_PRODUCT_UUID, quantity: 3 },
        USER_UUID,
      );

      expect(mockQr.commitTransaction).toHaveBeenCalled();
      expect(alertNotifier.notifyStockChange).toHaveBeenCalledTimes(2);
    });

    it('diferente producto no encontrado → BusinessError', async () => {
      (movementRepository.findById as jest.Mock).mockResolvedValue({
        ...MOCK_MOVEMENT,
        date: SHIFT_TIME,
      });

      mockQr.manager.findOne
        .mockResolvedValueOnce({ ...MOCK_PRODUCT }) // oldProduct existe
        .mockResolvedValueOnce(null);               // newProduct no existe

      await expect(
        movementService.editDispatch(
          MOVEMENT_UUID,
          { productId: NEW_PRODUCT_UUID, quantity: 3 },
          USER_UUID,
        ),
      ).rejects.toThrow('Producto no encontrado');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Métodos de consulta
// ═══════════════════════════════════════════════════════════════════════════════

describe('MovementService - consultas (líneas 336-358)', () => {
  beforeEach(resetMocks);

  it('getMovements → delega a movementRepository.findAll', async () => {
    const expected = { data: [], total: 0, page: 1, limit: 20 };
    (movementRepository.findAll as jest.Mock).mockResolvedValue(expected);

    const result = await movementService.getMovements({ page: 1, limit: 20 });

    expect(movementRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(result).toBe(expected);
  });

  it('getMovementsForExport → delega a movementRepository.findAllForExport', async () => {
    const expected = [{ id: MOVEMENT_UUID }];
    (movementRepository.findAllForExport as jest.Mock).mockResolvedValue(expected);

    const result = await movementService.getMovementsForExport({ type: MovementType.VENTA });

    expect(movementRepository.findAllForExport).toHaveBeenCalledWith({ type: MovementType.VENTA });
    expect(result).toBe(expected);
  });

  it('getMovementById: encontrado → retorna movimiento', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({ ...MOCK_MOVEMENT });

    const result = await movementService.getMovementById(MOVEMENT_UUID);

    expect(result.id).toBe(MOVEMENT_UUID);
  });

  it('getMovementById: no encontrado → BusinessError', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(movementService.getMovementById(MOVEMENT_UUID)).rejects.toThrow(
      'Movimiento no encontrado',
    );
  });

  it('getMovementsByProduct → delega a movementRepository.findByProductId', async () => {
    (movementRepository.findByProductId as jest.Mock).mockResolvedValue([{ ...MOCK_MOVEMENT }]);

    const result = await movementService.getMovementsByProduct(PRODUCT_UUID);

    expect(movementRepository.findByProductId).toHaveBeenCalledWith(PRODUCT_UUID);
    expect(result).toHaveLength(1);
  });

  it('getMovementsByUser → delega a movementRepository.findByUserId', async () => {
    (movementRepository.findByUserId as jest.Mock).mockResolvedValue([{ ...MOCK_MOVEMENT }]);

    const result = await movementService.getMovementsByUser(USER_UUID);

    expect(movementRepository.findByUserId).toHaveBeenCalledWith(USER_UUID);
    expect(result).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// uploadEvidence
// ═══════════════════════════════════════════════════════════════════════════════

describe('MovementService.uploadEvidence (líneas 360-384)', () => {
  const buffer = Buffer.from('fake-image');
  const mimetype = 'image/jpeg';
  const imageUrl = 'https://res.cloudinary.com/test/image1.jpg';

  beforeEach(() => {
    resetMocks();
    (uploadImage as jest.Mock).mockResolvedValue(imageUrl);
    (movementRepository.save as jest.Mock).mockResolvedValue({});
  });

  it('agrega evidencia exitosamente a movimiento VENTA', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({ ...MOCK_MOVEMENT });

    const result = await movementService.uploadEvidence(MOVEMENT_UUID, buffer, mimetype);

    expect(uploadImage).toHaveBeenCalledWith(buffer, 'stockly/movements');
    expect(movementRepository.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('tipo no es SALIDA → BusinessError', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({
      ...MOCK_MOVEMENT,
      type: MovementType.ENTRADA,
    });

    await expect(movementService.uploadEvidence(MOVEMENT_UUID, buffer, mimetype)).rejects.toThrow(
      'tipo salida',
    );
  });

  it('movimiento anulado → BusinessError', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({
      ...MOCK_MOVEMENT,
      isAnnulled: true,
    });

    await expect(movementService.uploadEvidence(MOVEMENT_UUID, buffer, mimetype)).rejects.toThrow(
      'anulado',
    );
  });

  it('mimetype no permitido → BusinessError', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({ ...MOCK_MOVEMENT });

    await expect(
      movementService.uploadEvidence(MOVEMENT_UUID, buffer, 'image/gif'),
    ).rejects.toThrow('Formato de imagen');
  });

  it('ya tiene 4 imágenes → BusinessError', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({
      ...MOCK_MOVEMENT,
      evidenceUrls: ['u1', 'u2', 'u3', 'u4'],
    });

    await expect(movementService.uploadEvidence(MOVEMENT_UUID, buffer, mimetype)).rejects.toThrow(
      /4 imágenes/,
    );
  });

  it('evidenceUrls nulo se trata como array vacío', async () => {
    (movementRepository.findById as jest.Mock).mockResolvedValue({
      ...MOCK_MOVEMENT,
      evidenceUrls: null,
    });

    await movementService.uploadEvidence(MOVEMENT_UUID, buffer, mimetype);

    expect(uploadImage).toHaveBeenCalled();
  });
});
