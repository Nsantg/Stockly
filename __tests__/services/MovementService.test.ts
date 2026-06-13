import { movementService } from '../../src/service/MovementService';
import { productRepository } from '../../src/repository/ProductRepository';
import { movementRepository } from '../../src/repository/MovementRepository';
import { getDataSource } from '../../src/lib/database';
import { MovementType } from '../../src/entity/MovementType';
import { ClientType } from '../../src/entity/ClientType';
import { ZodError } from 'zod';
import { MovementFactory } from '../../src/service/movement/MovementFactory';
import { uploadImage } from '../../src/lib/cloudinary';
import { Product } from '../../src/entity/Product';

jest.mock('../../src/repository/ProductRepository', () => ({
  productRepository: {
    findById: jest.fn(),
  },
}));

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

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn(() => mockQueryRunner),
};

jest.mock('../../src/lib/database', () => ({
  getDataSource: jest.fn(async () => mockDataSource),
}));

const mockHandler = {
  validate: jest.fn(),
  execute: jest.fn(),
};

jest.mock('../../src/service/movement/MovementFactory', () => ({
  MovementFactory: {
    getHandler: jest.fn(() => mockHandler),
  },
}));

jest.mock('../../src/lib/cloudinary', () => ({
  uploadImage: jest.fn(),
}));

describe('1. MovementService - Pruebas Unitarias', () => {
  const originalGetHours = Date.prototype.getHours;
  let mockHours: number | null = null;
  let getHoursSpy: jest.SpyInstance;

  beforeAll(() => {
    getHoursSpy = jest.spyOn(Date.prototype, 'getHours').mockImplementation(function (this: Date) {
      if (mockHours !== null) return mockHours;
      return originalGetHours.call(this);
    });
  });

  afterAll(() => {
    getHoursSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockHours = null;
  });

  describe('1.1 createMovement', () => {
    it('Debe fallar si DTO es invalido por esquema Zod', async () => {
      const invalidDto = {
        type: MovementType.VENTA,
        productId: 'invalido',
        quantity: -1,
        userId: 'no-uuid',
      };
      await expect(movementService.createMovement(invalidDto as any)).rejects.toThrow(ZodError);
    });

    it('Debe fallar si es tipo ajuste y falta sourceMovementId', async () => {
      const dto = {
        type: MovementType.AJUSTE_INGRESO,
        productId: '11111111-2222-3333-4444-555555555555',
        quantity: 10,
        userId: '11111111-2222-3333-4444-555555555555',
      };
      await expect(movementService.createMovement(dto as any)).rejects.toThrow(ZodError);
    });

    it('Debe fallar si es tipo entrada y falta productId', async () => {
      const dto = {
        type: MovementType.ENTRADA,
        quantity: 10,
        userId: '11111111-2222-3333-4444-555555555555',
      };
      await expect(movementService.createMovement(dto as any)).rejects.toThrow(ZodError);
    });

    it('Debe fallar si es tipo ajuste y el movimiento fuente no existe', async () => {
      const dto = {
        type: MovementType.AJUSTE_INGRESO,
        sourceMovementId: '11111111-2222-3333-4444-555555555555',
        quantity: 10,
        userId: '11111111-2222-3333-4444-555555555555',
      };
      (movementRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(movementService.createMovement(dto)).rejects.toThrow('Movimiento fuente no encontrado');
    });

    it('Debe fallar si es tipo ajuste y el movimiento fuente ya fue anulado', async () => {
      const dto = {
        type: MovementType.AJUSTE_INGRESO,
        sourceMovementId: '11111111-2222-3333-4444-555555555555',
        quantity: 10,
        userId: '11111111-2222-3333-4444-555555555555',
      };
      (movementRepository.findById as jest.Mock).mockResolvedValue({ id: '1', isAnnulled: true });
      await expect(movementService.createMovement(dto)).rejects.toThrow('El movimiento fuente ya fue anulado');
    });

    it('Debe fallar si es ajuste de ingreso y fuente no es entrada', async () => {
      const dto = {
        type: MovementType.AJUSTE_INGRESO,
        sourceMovementId: '11111111-2222-3333-4444-555555555555',
        quantity: 10,
        userId: '11111111-2222-3333-4444-555555555555',
      };
      (movementRepository.findById as jest.Mock).mockResolvedValue({ id: '1', isAnnulled: false, type: MovementType.VENTA });
      await expect(movementService.createMovement(dto)).rejects.toThrow('El ajuste de ingreso requiere un movimiento de tipo ENTRADA como fuente');
    });

    it('Debe fallar si es ajuste de salida y fuente no es venta', async () => {
      const dto = {
        type: MovementType.AJUSTE_SALIDA,
        sourceMovementId: '11111111-2222-3333-4444-555555555555',
        quantity: 10,
        userId: '11111111-2222-3333-4444-555555555555',
      };
      (movementRepository.findById as jest.Mock).mockResolvedValue({ id: '1', isAnnulled: false, type: MovementType.ENTRADA });
      await expect(movementService.createMovement(dto)).rejects.toThrow('El ajuste de salida requiere un movimiento de tipo VENTA como fuente');
    });

    it('Debe copiar el productId del movimiento fuente si es tipo ajuste', async () => {
      const dto = {
        type: MovementType.AJUSTE_INGRESO,
        sourceMovementId: '11111111-2222-3333-4444-555555555555',
        quantity: 10,
        userId: '11111111-2222-3333-4444-555555555555',
      };
      const sourceMovement = { id: 'm-src', type: MovementType.ENTRADA, isAnnulled: false, productId: '11111111-2222-3333-4444-555555555555' };
      const product = { id: '11111111-2222-3333-4444-555555555555', requiresRefrigeration: false };
      const createdMovement = { id: 'm-new', type: MovementType.AJUSTE_INGRESO };

      (movementRepository.findById as jest.Mock).mockResolvedValueOnce(sourceMovement).mockResolvedValueOnce(createdMovement);
      (productRepository.findById as jest.Mock).mockResolvedValue(product);
      mockHandler.execute.mockResolvedValue(createdMovement);

      const result = await movementService.createMovement(dto);
      expect(result.movement).toEqual(createdMovement);
      expect(productRepository.findById).toHaveBeenCalledWith('11111111-2222-3333-4444-555555555555');
    });

    it('Debe fallar si el producto no existe o esta inactivo', async () => {
      const dto = {
        type: MovementType.VENTA,
        productId: '11111111-2222-3333-4444-555555555555',
        quantity: 10,
        userId: '11111111-2222-3333-4444-555555555555',
      };
      (productRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(movementService.createMovement(dto)).rejects.toThrow('Producto no encontrado o inactivo');
    });

    it('Debe crear un movimiento exitosamente y retornar warning si el producto requiere refrigeracion', async () => {
      const dto = {
        type: MovementType.VENTA,
        productId: '11111111-2222-3333-4444-555555555555',
        quantity: 10,
        userId: '11111111-2222-3333-4444-555555555555',
      };
      const product = { id: 'p1', requiresRefrigeration: true };
      const createdMovement = { id: 'm1', type: MovementType.VENTA };

      (productRepository.findById as jest.Mock).mockResolvedValue(product);
      mockHandler.execute.mockResolvedValue(createdMovement);
      (movementRepository.findById as jest.Mock).mockResolvedValue(createdMovement);

      const result = await movementService.createMovement(dto);

      expect(result.movement).toEqual(createdMovement);
      expect(result.warning).toContain('requiere refrigeración');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('Debe hacer rollback si ocurre un error durante la ejecucion de la transaccion', async () => {
      const dto = {
        type: MovementType.VENTA,
        productId: '11111111-2222-3333-4444-555555555555',
        quantity: 10,
        userId: '11111111-2222-3333-4444-555555555555',
      };
      const product = { id: 'p1', requiresRefrigeration: false };

      (productRepository.findById as jest.Mock).mockResolvedValue(product);
      mockHandler.execute.mockRejectedValue(new Error('Internal DB failure'));

      await expect(movementService.createMovement(dto)).rejects.toThrow('Internal DB failure');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('1.2 annulMovement', () => {
    it('Debe fallar si el movimiento no existe', async () => {
      (movementRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(movementService.annulMovement('m1', { reason: 'Motivo valido', userId: '11111111-2222-3333-4444-555555555555' })).rejects.toThrow('Movimiento no encontrado');
    });

    it('Debe fallar si el movimiento ya esta anulado', async () => {
      (movementRepository.findById as jest.Mock).mockResolvedValue({ id: 'm1', isAnnulled: true });
      await expect(movementService.annulMovement('m1', { reason: 'Motivo valido', userId: '11111111-2222-3333-4444-555555555555' })).rejects.toThrow('Este movimiento ya fue anulado');
    });

    it('Debe revertir el stock de bodega y vitrina para tipo TRASLADO', async () => {
      const movement = { id: 'm1', type: MovementType.TRASLADO, quantity: 10, productId: 'p1', isAnnulled: false };
      const product = { id: 'p1', stockBodega: 20, stockVitrina: 15, stock: 35 };

      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      mockQueryRunner.manager.findOne.mockResolvedValue(product);

      await movementService.annulMovement('m1', { reason: 'Anulacion traslados', userId: '11111111-2222-3333-4444-555555555555' });

      expect(product.stockBodega).toBe(30);
      expect(product.stockVitrina).toBe(5);
      expect(product.stock).toBe(35);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(Product, product);
      expect(mockQueryRunner.manager.update).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('Debe revertir stock restando de bodega para tipo ENTRADA', async () => {
      const movement = { id: 'm1', type: MovementType.ENTRADA, quantity: 10, productId: 'p1', isAnnulled: false };
      const product = { id: 'p1', stockBodega: 20, stockVitrina: 5, stock: 25 };

      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      mockQueryRunner.manager.findOne.mockResolvedValue(product);

      await movementService.annulMovement('m1', { reason: 'Anulacion entrada', userId: '11111111-2222-3333-4444-555555555555' });

      expect(product.stockBodega).toBe(10);
      expect(product.stock).toBe(15);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(Product, product);
    });

    it('Debe revertir stock sumando a bodega para tipo VENTA', async () => {
      const movement = { id: 'm1', type: MovementType.VENTA, quantity: 10, productId: 'p1', isAnnulled: false };
      const product = { id: 'p1', stockBodega: 20, stockVitrina: 5, stock: 25 };

      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      mockQueryRunner.manager.findOne.mockResolvedValue(product);

      await movementService.annulMovement('m1', { reason: 'Anulacion venta', userId: '11111111-2222-3333-4444-555555555555' });

      expect(product.stockBodega).toBe(30);
      expect(product.stock).toBe(35);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(Product, product);
    });

    it('Debe hacer rollback si ocurre un error durante la anulacion', async () => {
      const movement = { id: 'm1', type: MovementType.VENTA, quantity: 10, productId: 'p1', isAnnulled: false };
      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      mockQueryRunner.manager.findOne.mockRejectedValue(new Error('DB Query Error'));

      await expect(movementService.annulMovement('m1', { reason: 'Anulacion error', userId: '11111111-2222-3333-4444-555555555555' })).rejects.toThrow('DB Query Error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('1.3 editDispatch', () => {
    it('Debe fallar si el movimiento no existe', async () => {
      (movementRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(movementService.editDispatch('11111111-2222-3333-4444-555555555555', {}, 'u1')).rejects.toThrow('Movimiento no encontrado');
    });

    it('Debe fallar si el movimiento no es de tipo VENTA', async () => {
      (movementRepository.findById as jest.Mock).mockResolvedValue({ id: 'm1', type: MovementType.ENTRADA });
      await expect(movementService.editDispatch('11111111-2222-3333-4444-555555555555', {}, 'u1')).rejects.toThrow('Solo se pueden editar despachos de tipo venta');
    });

    it('Debe fallar si el movimiento ya fue anulado', async () => {
      (movementRepository.findById as jest.Mock).mockResolvedValue({ id: 'm1', type: MovementType.VENTA, isAnnulled: true });
      await expect(movementService.editDispatch('11111111-2222-3333-4444-555555555555', {}, 'u1')).rejects.toThrow('No se puede editar un despacho anulado');
    });

    it('Debe fallar si el turno del despacho es diferente al turno actual', async () => {
      const movement = { id: 'm1', type: MovementType.VENTA, isAnnulled: false, date: new Date() };
      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);

      mockHours = 10;
      const getShiftSpy = jest.spyOn(movementService as any, 'getShift');
      getShiftSpy.mockReturnValueOnce('MAÑANA').mockReturnValueOnce('TARDE');

      await expect(movementService.editDispatch('11111111-2222-3333-4444-555555555555', {}, 'u1')).rejects.toThrow('Solo se puede editar un despacho dentro del mismo turno');
      getShiftSpy.mockRestore();
    });

    it('Debe fallar si el producto no se encuentra al editar con mismo producto', async () => {
      const movement = { id: 'm1', type: MovementType.VENTA, isAnnulled: false, date: new Date(), productId: '11111111-2222-3333-4444-555555555555', quantity: 5 };
      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      mockHours = 10;
      await expect(movementService.editDispatch('11111111-2222-3333-4444-555555555555', {}, 'u1')).rejects.toThrow('Producto no encontrado');
    });

    it('Debe fallar si el stock proyectado es insuficiente al editar con mismo producto', async () => {
      const movement = { id: 'm1', type: MovementType.VENTA, isAnnulled: false, date: new Date(), productId: '11111111-2222-3333-4444-555555555555', quantity: 5 };
      const product = { id: '11111111-2222-3333-4444-555555555555', name: 'Prod1', stock: 2, stockBodega: 2, stockVitrina: 0 };

      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      mockQueryRunner.manager.findOne.mockResolvedValue(product);

      mockHours = 10;
      await expect(movementService.editDispatch('11111111-2222-3333-4444-555555555555', { quantity: 10 }, 'u1')).rejects.toThrow('Stock insuficiente');
    });

    it('Debe actualizar el stock restando de vitrina y bodega si el delta es positivo', async () => {
      const movement = { id: 'm1', type: MovementType.VENTA, isAnnulled: false, date: new Date(), productId: '11111111-2222-3333-4444-555555555555', quantity: 5 };
      const product = { id: '11111111-2222-3333-4444-555555555555', name: 'Prod1', stock: 20, stockBodega: 15, stockVitrina: 5 };

      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      mockQueryRunner.manager.findOne.mockResolvedValue(product);

      mockHours = 10;
      await movementService.editDispatch('11111111-2222-3333-4444-555555555555', { quantity: 8 }, 'u1');

      expect(product.stockVitrina).toBe(2);
      expect(product.stockBodega).toBe(15);
      expect(product.stock).toBe(17);
    });

    it('Debe actualizar el stock sumando a bodega si el delta es negativo', async () => {
      const movement = { id: 'm1', type: MovementType.VENTA, isAnnulled: false, date: new Date(), productId: '11111111-2222-3333-4444-555555555555', quantity: 5 };
      const product = { id: '11111111-2222-3333-4444-555555555555', name: 'Prod1', stock: 20, stockBodega: 15, stockVitrina: 5 };

      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      mockQueryRunner.manager.findOne.mockResolvedValue(product);

      mockHours = 10;
      await movementService.editDispatch('11111111-2222-3333-4444-555555555555', { quantity: 2 }, 'u1');

      expect(product.stockBodega).toBe(18);
      expect(product.stockVitrina).toBe(5);
      expect(product.stock).toBe(23);
    });

    it('Debe actualizar a un nuevo producto correctamente y revertir el anterior', async () => {
      const movement = { id: 'm1', type: MovementType.VENTA, isAnnulled: false, date: new Date(), productId: '11111111-2222-3333-4444-555555555555', quantity: 5 };
      const oldProduct = { id: '11111111-2222-3333-4444-555555555555', stockBodega: 10, stockVitrina: 5, stock: 15 };
      const newProduct = { id: '22222222-3333-4444-5555-666666666666', name: 'Prod2', stockBodega: 10, stockVitrina: 5, stock: 15 };

      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(oldProduct)
        .mockResolvedValueOnce(newProduct);

      mockHours = 10;
      await movementService.editDispatch(
        '11111111-2222-3333-4444-555555555555',
        {
          productId: '22222222-3333-4444-5555-666666666666',
          quantity: 4,
          clientId: '99999999-8888-7777-6666-555555555555',
          clientType: ClientType.DETAL,
          totalWeight: 12
        },
        'u1'
      );

      expect(oldProduct.stockBodega).toBe(15);
      expect(oldProduct.stock).toBe(20);
      expect(newProduct.stockVitrina).toBe(1);
      expect(newProduct.stockBodega).toBe(10);
      expect(newProduct.stock).toBe(11);
    });

    it('Debe fallar al cambiar a otro producto si el nuevo no existe', async () => {
      const movement = { id: 'm1', type: MovementType.VENTA, isAnnulled: false, date: new Date(), productId: '11111111-2222-3333-4444-555555555555', quantity: 5 };
      const oldProduct = { id: '11111111-2222-3333-4444-555555555555', stockBodega: 10, stockVitrina: 5, stock: 15 };

      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(oldProduct)
        .mockResolvedValueOnce(null);

      mockHours = 10;
      await expect(
        movementService.editDispatch(
          '11111111-2222-3333-4444-555555555555',
          { productId: '22222222-3333-4444-5555-666666666666', quantity: 4 },
          'u1'
        )
      ).rejects.toThrow('Producto no encontrado');
    });

    it('Debe fallar al cambiar a otro producto si tiene stock insuficiente', async () => {
      const movement = { id: 'm1', type: MovementType.VENTA, isAnnulled: false, date: new Date(), productId: '11111111-2222-3333-4444-555555555555', quantity: 5 };
      const oldProduct = { id: '11111111-2222-3333-4444-555555555555', stockBodega: 10, stockVitrina: 5, stock: 15 };
      const newProduct = { id: '22222222-3333-4444-5555-666666666666', name: 'Prod2', stock: 2, stockBodega: 2, stockVitrina: 0 };

      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(oldProduct)
        .mockResolvedValueOnce(newProduct);

      mockHours = 10;
      await expect(
        movementService.editDispatch(
          '11111111-2222-3333-4444-555555555555',
          { productId: '22222222-3333-4444-5555-666666666666', quantity: 4 },
          'u1'
        )
      ).rejects.toThrow('Stock insuficiente');
    });
  });

  describe('1.4 Consultas y Listado', () => {
    it('Debe retornar movimientos paginados', async () => {
      const mockResult = { data: [], total: 0 };
      (movementRepository.findAll as jest.Mock).mockResolvedValue(mockResult);
      const res = await movementService.getMovements({});
      expect(res).toEqual(mockResult);
    });

    it('Debe retornar movimientos para exportar', async () => {
      const mockResult: any[] = [];
      (movementRepository.findAllForExport as jest.Mock).mockResolvedValue(mockResult);
      const res = await movementService.getMovementsForExport({});
      expect(res).toEqual(mockResult);
    });

    it('Debe fallar en getMovementById si no se encuentra', async () => {
      (movementRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(movementService.getMovementById('m1')).rejects.toThrow('Movimiento no encontrado');
    });

    it('Debe retornar movimientos por producto', async () => {
      const mockResult: any[] = [];
      (movementRepository.findByProductId as jest.Mock).mockResolvedValue(mockResult);
      const res = await movementService.getMovementsByProduct('p1');
      expect(res).toEqual(mockResult);
    });

    it('Debe retornar movimientos por usuario', async () => {
      const mockResult: any[] = [];
      (movementRepository.findByUserId as jest.Mock).mockResolvedValue(mockResult);
      const res = await movementService.getMovementsByUser('u1');
      expect(res).toEqual(mockResult);
    });
  });

  describe('1.5 uploadEvidence', () => {
    it('Debe fallar si no es movimiento de tipo salida', async () => {
      const movement = { id: 'm1', type: MovementType.ENTRADA };
      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      await expect(movementService.uploadEvidence('m1', Buffer.from([]), 'image/jpeg')).rejects.toThrow('La evidencia fotográfica solo aplica para movimientos de tipo salida');
    });

    it('Debe fallar si el movimiento esta anulado', async () => {
      const movement = { id: 'm1', type: MovementType.VENTA, isAnnulled: true };
      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      await expect(movementService.uploadEvidence('m1', Buffer.from([]), 'image/jpeg')).rejects.toThrow('No se puede agregar evidencia a un movimiento anulado');
    });

    it('Debe fallar si el formato mime no esta permitido', async () => {
      const movement = { id: 'm1', type: MovementType.VENTA, isAnnulled: false };
      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      await expect(movementService.uploadEvidence('m1', Buffer.from([]), 'application/pdf')).rejects.toThrow('Formato de imagen no permitido');
    });

    it('Debe fallar si excede el limite maximo de imagenes', async () => {
      const movement = { id: 'm1', type: MovementType.VENTA, isAnnulled: false, evidenceUrls: ['u1', 'u2', 'u3', 'u4'] };
      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      await expect(movementService.uploadEvidence('m1', Buffer.from([]), 'image/jpeg')).rejects.toThrow('No se pueden agregar más de 4 imágenes');
    });

    it('Debe subir la evidencia correctamente y guardar el movimiento', async () => {
      const movement = { id: 'm1', type: MovementType.VENTA, isAnnulled: false, evidenceUrls: ['u1'] };
      (movementRepository.findById as jest.Mock).mockResolvedValue(movement);
      (uploadImage as jest.Mock).mockResolvedValue('cloudinary_url');

      const result = await movementService.uploadEvidence('m1', Buffer.from([]), 'image/jpeg');

      expect(uploadImage).toHaveBeenCalledWith(expect.any(Buffer), 'stockly/movements');
      expect(movement.evidenceUrls).toEqual(['u1', 'cloudinary_url']);
      expect(movementRepository.save).toHaveBeenCalledWith(movement);
    });
  });

  describe('1.6 getShift y assertSameShift edge cases', () => {
    it('Debe clasificar correctamente los turnos', () => {
      const morningDate = new Date();
      morningDate.setHours(9);
      expect((movementService as any).getShift(morningDate)).toBe('MAÑANA');

      const afternoonDate = new Date();
      afternoonDate.setHours(15);
      expect((movementService as any).getShift(afternoonDate)).toBe('TARDE');

      const nightDate = new Date();
      nightDate.setHours(23);
      expect((movementService as any).getShift(nightDate)).toBeNull();
    });

    it('Debe fallar assertSameShift si alguno de los turnos es null', () => {
      mockHours = 23;
      const createdAt = new Date();
      createdAt.setHours(9);
      expect(() => (movementService as any).assertSameShift(createdAt)).toThrow('Solo se puede editar un despacho dentro del mismo turno');
    });
  });
});
