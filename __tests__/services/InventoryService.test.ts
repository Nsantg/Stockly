// Nota de QA: Estos imports fallarán (RED) porque los archivos aún no existen.
// Esto guiará al equipo a crear las clases y DTOs exactos.

import { inventoryService } from '../../src/service/InventoryService';
import { productRepository } from '../../src/repository/ProductRepository';
import { lotRepository } from '../../src/repository/LotRepository';

jest.mock('../../src/repository/ProductRepository');
jest.mock('../../src/repository/LotRepository');

describe('InventoryService - Lógica de Negocio (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Alertas de Stock (Historia N2026-30)', () => {
    it('Debe generar una alerta crítica si el stock de un producto es menor o igual a su stock mínimo', async () => {
      const mockLowStockProducts = [
        { id: 1, name: 'Jeringas 5ml', stock: 50, minStock: 100 },
        { id: 2, name: 'Gasa Estéril', stock: 10, minStock: 10 }
      ];
      (productRepository.findBelowMinStock as jest.Mock).mockResolvedValue(mockLowStockProducts);

      const alertas = await inventoryService.checkStockAlerts();

      expect(productRepository.findBelowMinStock).toHaveBeenCalledTimes(1);
      expect(alertas.length).toBe(2);
      expect(alertas[0].message).toContain('Jeringas 5ml');
      expect(alertas[0].level).toBe('CRITICAL');
    });

    it('No debe generar alertas si todos los productos están por encima del stock mínimo', async () => {
      (productRepository.findBelowMinStock as jest.Mock).mockResolvedValue([]);

      const alertas = await inventoryService.checkStockAlerts();

      expect(alertas.length).toBe(0);
    });
  });

  describe('Rotación FEFO (Historia N2026-4)', () => {
    it('Debe devolver el lote con la fecha de vencimiento más próxima para un producto', async () => {
      const mockLots = [
        { id: 'L-002', expirationDate: new Date('2027-12-31'), stock: 500 },
        { id: 'L-001', expirationDate: new Date('2026-06-01'), stock: 200 }
      ];
      (lotRepository.findByProductId as jest.Mock).mockResolvedValue(mockLots);

      const loteSeleccionado = await inventoryService.getNextLotForDispatch('1');

      expect(lotRepository.findByProductId).toHaveBeenCalledWith('1');
      expect(loteSeleccionado).not.toBeNull();
      expect(loteSeleccionado!.id).toBe('L-001');
    });
  });
});
