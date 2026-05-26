import { NextRequest } from 'next/server';
import { inventoryController } from '../../src/controller/InventoryController';
import { inventoryService } from '../../src/service/InventoryService';

jest.mock('../../src/service/InventoryService');

describe('InventoryController - Integración (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/products - Registrar Productos (Historia N2026-3)', () => {
    it('Debe rechazar la creación si faltan campos obligatorios (Validación Zod)', async () => {
      const request = new NextRequest('http://localhost/api/v1/products', {
        method: 'POST',
        body: JSON.stringify({ name: 'Solución Salina', weight: 1.5 }),
      });

      const response = await inventoryController.createProduct(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it('Debe crear un producto correctamente y retornar status 201', async () => {
      const validPayload = {
        code: 'MED-001',
        name: 'Solución Salina',
        weight: 1.5,
        minStock: 50,
        unitType: 'Caja'
      };

      (inventoryService.createProduct as jest.Mock).mockResolvedValue({ id: 1, ...validPayload });

      const request = new NextRequest('http://localhost/api/v1/products', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });

      const response = await inventoryController.createProduct(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.code).toBe('MED-001');
    });
  });

  describe('GET /api/v1/inventory - Consultar Inventario (Historia N2026-5)', () => {
    it('Debe retornar la lista de productos con status 200', async () => {
      const mockInventory = [
        { id: 1, name: 'Producto A', stock: 100 },
        { id: 2, name: 'Producto B', stock: 50 }
      ];
      (inventoryService.listInventory as jest.Mock).mockResolvedValue(mockInventory);

      const request = new NextRequest('http://localhost/api/v1/inventory', { method: 'GET' });
      const response = await inventoryController.getInventory(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.length).toBe(2);
      expect(body[0].name).toBe('Producto A');
    });
  });
});
