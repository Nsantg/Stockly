import { alertService } from '../../src/service/AlertService';
import * as inventoryServiceModule from '../../src/service/InventoryService';
import * as lotRepoModule from '../../src/repository/LotRepository';

jest.mock('../../src/service/InventoryService');
jest.mock('../../src/repository/LotRepository');

describe('AlertService', () => {
  let service: typeof alertService;
  let mockInventoryService: jest.Mocked<typeof inventoryServiceModule.inventoryService>;
  let mockLotRepo: jest.Mocked<typeof lotRepoModule.lotRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInventoryService = inventoryServiceModule.inventoryService as jest.Mocked<typeof inventoryServiceModule.inventoryService>;
    mockLotRepo = lotRepoModule.lotRepository as jest.Mocked<typeof lotRepoModule.lotRepository>;
    service = alertService;
  });

  describe('getStockAlerts', () => {
    it('debe retornar alertas de stock crítico', async () => {
      mockInventoryService.checkStockAlerts.mockResolvedValue([
        {
          productId: '1',
          productName: 'Equipo Masaje',
          stock: 5,
          minStock: 10,
          message: 'Stock crítico en Equipo Masaje',
        },
      ] as any);

      const result = await service.getStockAlerts();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('STOCK_CRITICAL');
      expect(result[0].productId).toBe('1');
      expect(result[0].level).toBe('CRITICAL');
      expect(mockInventoryService.checkStockAlerts).toHaveBeenCalled();
    });

    it('debe retornar lista vacía si no hay alertas', async () => {
      mockInventoryService.checkStockAlerts.mockResolvedValue([]);

      const result = await service.getStockAlerts();

      expect(result).toEqual([]);
    });

    it('debe mapear correctamente los campos de alerta', async () => {
      mockInventoryService.checkStockAlerts.mockResolvedValue([
        {
          productId: 'prod-1',
          productName: 'Equipo Test',
          stock: 3,
          minStock: 15,
          message: 'Producto con stock muy bajo',
        },
      ] as any);

      const result = await service.getStockAlerts();
      const alert = result[0];

      expect(alert.productName).toBe('Equipo Test');
      expect(alert.stock).toBe(3);
      expect(alert.minStock).toBe(15);
      expect(alert.message).toBe('Producto con stock muy bajo');
    });
  });

  describe('getExpirationAlerts', () => {
    it('debe retornar alertas de vencimiento próximo', async () => {
      const today = new Date();
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 10);

      mockLotRepo.findExpiringBefore.mockResolvedValue([
        {
          id: 'lot-1',
          lotNumber: 'LOT-001',
          expirationDate: expiringDate,
          stock: 50,
          productId: 'prod-1',
          product: { id: 'prod-1', name: 'Equipo Test' },
        },
      ] as any);

      const result = await service.getExpirationAlerts(30);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('EXPIRATION_WARNING');
      expect(result[0].level).toBe('WARNING');
    });

    it('debe marcar como CRITICAL si vence en 7 días o menos', async () => {
      const today = new Date();
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 5);

      mockLotRepo.findExpiringBefore.mockResolvedValue([
        {
          id: 'lot-1',
          lotNumber: 'LOT-001',
          expirationDate: expiringDate,
          stock: 50,
          productId: 'prod-1',
          product: { id: 'prod-1', name: 'Equipo Test' },
        },
      ] as any);

      const result = await service.getExpirationAlerts(30);

      expect(result[0].level).toBe('CRITICAL');
    });

    it('debe calcular correctamente los días hasta vencimiento', async () => {
      const today = new Date();
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 15);

      mockLotRepo.findExpiringBefore.mockResolvedValue([
        {
          id: 'lot-1',
          lotNumber: 'LOT-001',
          expirationDate: expiringDate,
          stock: 50,
          productId: 'prod-1',
          product: { id: 'prod-1', name: 'Equipo Test' },
        },
      ] as any);

      const result = await service.getExpirationAlerts(30);

      expect(result[0].daysUntilExpiration).toBeGreaterThanOrEqual(14);
      expect(result[0].daysUntilExpiration).toBeLessThanOrEqual(16);
    });

    it('debe pasar el daysAhead correcto al repositorio', async () => {
      mockLotRepo.findExpiringBefore.mockResolvedValue([]);

      await service.getExpirationAlerts(60);

      expect(mockLotRepo.findExpiringBefore).toHaveBeenCalled();
      const callArg = mockLotRepo.findExpiringBefore.mock.calls[0][0];
      const today = new Date();
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 60);

      expect(callArg.getTime()).toBeGreaterThanOrEqual(expectedDate.getTime() - 1000);
      expect(callArg.getTime()).toBeLessThanOrEqual(expectedDate.getTime() + 1000);
    });

    it('debe retornar lista vacía si no hay lotes próximos a vencer', async () => {
      mockLotRepo.findExpiringBefore.mockResolvedValue([]);

      const result = await service.getExpirationAlerts(30);

      expect(result).toEqual([]);
    });

    it('debe ordenar alertas por días hasta vencimiento', async () => {
      const today = new Date();
      const exp1 = new Date();
      exp1.setDate(exp1.getDate() + 5);
      const exp2 = new Date();
      exp2.setDate(exp2.getDate() + 15);

      mockLotRepo.findExpiringBefore.mockResolvedValue([
        {
          id: 'lot-2',
          lotNumber: 'LOT-002',
          expirationDate: exp2,
          stock: 30,
          productId: 'prod-2',
          product: { id: 'prod-2', name: 'Equipo 2' },
        },
        {
          id: 'lot-1',
          lotNumber: 'LOT-001',
          expirationDate: exp1,
          stock: 50,
          productId: 'prod-1',
          product: { id: 'prod-1', name: 'Equipo 1' },
        },
      ] as any);

      const result = await service.getExpirationAlerts(30);

      expect(result[0].daysUntilExpiration).toBeLessThan(result[1].daysUntilExpiration);
    });

    it('debe usar producto vacío si el lote no tiene producto', async () => {
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 10);

      mockLotRepo.findExpiringBefore.mockResolvedValue([
        {
          id: 'lot-1',
          lotNumber: 'LOT-001',
          expirationDate: expiringDate,
          stock: 50,
          productId: 'prod-1',
          product: null,
        },
      ] as any);

      const result = await service.getExpirationAlerts(30);

      expect(result[0].productName).toBe('');
      expect(result[0].productId).toBe('prod-1');
    });
  });

  describe('getAllAlerts', () => {
    it('debe retornar alertas de stock y vencimiento combinadas', async () => {
      mockInventoryService.checkStockAlerts.mockResolvedValue([
        {
          productId: '1',
          productName: 'Equipo Masaje',
          stock: 5,
          minStock: 10,
          message: 'Stock crítico',
        },
      ] as any);

      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 10);
      mockLotRepo.findExpiringBefore.mockResolvedValue([
        {
          id: 'lot-1',
          lotNumber: 'LOT-001',
          expirationDate: expiringDate,
          stock: 50,
          productId: 'prod-1',
          product: { id: 'prod-1', name: 'Equipo Test' },
        },
      ] as any);

      const result = await service.getAllAlerts(30);

      expect(result.stockAlerts).toHaveLength(1);
      expect(result.expirationAlerts).toHaveLength(1);
      expect(result.totalCritical).toBeGreaterThan(0);
    });

    it('debe calcular totalCritical correctamente', async () => {
      mockInventoryService.checkStockAlerts.mockResolvedValue([
        {
          productId: '1',
          productName: 'Equipo 1',
          stock: 5,
          minStock: 10,
          message: 'Stock crítico',
        },
      ] as any);

      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 3);
      mockLotRepo.findExpiringBefore.mockResolvedValue([
        {
          id: 'lot-1',
          lotNumber: 'LOT-001',
          expirationDate: expiringDate,
          stock: 50,
          productId: 'prod-1',
          product: { id: 'prod-1', name: 'Equipo Test' },
        },
      ] as any);

      const result = await service.getAllAlerts(30);

      expect(result.totalCritical).toBe(2);
    });

    it('debe calcular totalWarnings correctamente', async () => {
      mockInventoryService.checkStockAlerts.mockResolvedValue([]);

      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 10);
      mockLotRepo.findExpiringBefore.mockResolvedValue([
        {
          id: 'lot-1',
          lotNumber: 'LOT-001',
          expirationDate: expiringDate,
          stock: 50,
          productId: 'prod-1',
          product: { id: 'prod-1', name: 'Equipo Test' },
        },
      ] as any);

      const result = await service.getAllAlerts(30);

      expect(result.totalWarnings).toBe(1);
    });

    it('debe ejecutar ambas búsquedas en paralelo', async () => {
      mockInventoryService.checkStockAlerts.mockResolvedValue([]);
      mockLotRepo.findExpiringBefore.mockResolvedValue([]);

      await service.getAllAlerts(30);

      expect(mockInventoryService.checkStockAlerts).toHaveBeenCalled();
      expect(mockLotRepo.findExpiringBefore).toHaveBeenCalled();
    });
  });
});
