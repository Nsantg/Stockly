import { inventoryService } from '../../src/service/InventoryService';
import { productRepository } from '../../src/repository/ProductRepository';
import { lotRepository } from '../../src/repository/LotRepository';

jest.mock('../../src/repository/ProductRepository');
jest.mock('../../src/repository/LotRepository');

describe('InventoryService - Lógica de Negocio (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Alertas de Stock - N2026-30 / CP-27', () => {
    it('Debe generar alerta CRÍTICA si el stock es menor o igual al stock mínimo', async () => {
      const mockLowStockProducts = [
        { id: 'uuid-1', name: 'Jeringas 5ml', stock: 50, minStock: 100 },
        { id: 'uuid-2', name: 'Gasa Estéril', stock: 10, minStock: 10 },
      ];
      (productRepository.findBelowMinStock as jest.Mock).mockResolvedValue(mockLowStockProducts);

      const alertas = await inventoryService.checkStockAlerts();

      expect(productRepository.findBelowMinStock).toHaveBeenCalledTimes(1);
      expect(alertas).toHaveLength(2);
      expect(alertas[0]).toMatchObject({
        productId: 'uuid-1',
        productName: 'Jeringas 5ml',
        stock: 50,
        minStock: 100,
        level: 'CRITICAL',
      });
      expect(alertas[0].message).toContain('Jeringas 5ml');
      expect(alertas[0].message).toContain('50');
      expect(alertas[0].message).toContain('100');
    });

    it('No debe generar alertas si todos los productos están por encima del stock mínimo', async () => {
      (productRepository.findBelowMinStock as jest.Mock).mockResolvedValue([]);

      const alertas = await inventoryService.checkStockAlerts();

      expect(alertas).toHaveLength(0);
    });
  });

  describe('Rotación FEFO - N2026-4', () => {
    it('Debe devolver el lote con la fecha de vencimiento más próxima', async () => {
      const mockLots = [
        { id: 'L-002', expirationDate: new Date('2027-12-31'), stock: 500 },
        { id: 'L-001', expirationDate: new Date('2026-06-01'), stock: 200 },
        { id: 'L-003', expirationDate: new Date('2026-08-15'), stock: 100 },
      ];
      (lotRepository.findByProductId as jest.Mock).mockResolvedValue(mockLots);

      const loteSeleccionado = await inventoryService.getNextLotForDispatch('prod-uuid');

      expect(lotRepository.findByProductId).toHaveBeenCalledWith('prod-uuid');
      expect(loteSeleccionado).not.toBeNull();
      expect(loteSeleccionado!.id).toBe('L-001');
    });

    it('Debe ignorar lotes sin stock disponible', async () => {
      const mockLots = [
        { id: 'L-001', expirationDate: new Date('2026-06-01'), stock: 0 },
        { id: 'L-002', expirationDate: new Date('2026-09-01'), stock: 50 },
      ];
      (lotRepository.findByProductId as jest.Mock).mockResolvedValue(mockLots);

      const loteSeleccionado = await inventoryService.getNextLotForDispatch('prod-uuid');

      expect(loteSeleccionado!.id).toBe('L-002');
    });

    it('Debe ignorar lotes sin fecha de vencimiento', async () => {
      const mockLots = [
        { id: 'L-001', expirationDate: null, stock: 100 },
        { id: 'L-002', expirationDate: new Date('2026-12-01'), stock: 50 },
      ];
      (lotRepository.findByProductId as jest.Mock).mockResolvedValue(mockLots);

      const loteSeleccionado = await inventoryService.getNextLotForDispatch('prod-uuid');

      expect(loteSeleccionado!.id).toBe('L-002');
    });

    it('Debe retornar null si no hay lotes elegibles para despacho', async () => {
      (lotRepository.findByProductId as jest.Mock).mockResolvedValue([
        { id: 'L-001', expirationDate: null, stock: 0 },
      ]);

      const loteSeleccionado = await inventoryService.getNextLotForDispatch('prod-uuid');

      expect(loteSeleccionado).toBeNull();
    });
  });
});
