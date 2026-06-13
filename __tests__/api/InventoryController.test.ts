import { NextRequest } from 'next/server';
import { inventoryController } from '../../src/controller/InventoryController';
import * as inventoryServiceModule from '../../src/service/InventoryService';

jest.mock('../../src/service/InventoryService');

describe('InventoryController', () => {
  let mockInventoryService: jest.Mocked<typeof inventoryServiceModule.inventoryService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInventoryService = inventoryServiceModule.inventoryService as jest.Mocked<typeof inventoryServiceModule.inventoryService>;
  });

  describe('createProduct', () => {
    it('debe crear un producto y retornar 201', async () => {
      const productData = {
        code: 'PROD-001',
        name: 'Equipo Test',
        subcategoryId: 'sub-1',
      };

      mockInventoryService.createProduct.mockResolvedValue({
        id: '1',
        ...productData,
        stockBodega: 0,
        stockVitrina: 0,
      } as any);

      const request = new NextRequest('http://localhost/api/v1/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });

      const response = await inventoryController.createProduct(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.code).toBe('PROD-001');
      expect(mockInventoryService.createProduct).toHaveBeenCalledWith(productData);
    });

    it('debe retornar 400 si faltan campos obligatorios', async () => {
      const request = new NextRequest('http://localhost/api/v1/products', {
        method: 'POST',
        body: JSON.stringify({ name: 'Equipo' }),
      });

      const response = await inventoryController.createProduct(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Datos inválidos');
    });

    it('debe retornar 400 si el servicio lanza error', async () => {
      mockInventoryService.createProduct.mockRejectedValue(
        new Error('Código duplicado')
      );

      const request = new NextRequest('http://localhost/api/v1/products', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PROD-001',
          name: 'Equipo Test',
          subcategoryId: 'sub-1',
        }),
      });

      const response = await inventoryController.createProduct(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Código duplicado');
    });

    it('debe retornar 500 si hay error inesperado', async () => {
      mockInventoryService.createProduct.mockRejectedValue(new Error('DB Error'));

      const request = new NextRequest('http://localhost/api/v1/products', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PROD-001',
          name: 'Equipo Test',
          subcategoryId: 'sub-1',
        }),
      });

      const response = await inventoryController.createProduct(request);

      expect(response.status).toBe(400);
    });

    it('debe validar código requerido', async () => {
      const request = new NextRequest('http://localhost/api/v1/products', {
        method: 'POST',
        body: JSON.stringify({
          code: '',
          name: 'Equipo Test',
          subcategoryId: 'sub-1',
        }),
      });

      const response = await inventoryController.createProduct(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Datos inválidos');
    });

    it('debe validar nombre requerido', async () => {
      const request = new NextRequest('http://localhost/api/v1/products', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PROD-001',
          name: '',
          subcategoryId: 'sub-1',
        }),
      });

      const response = await inventoryController.createProduct(request);

      expect(response.status).toBe(400);
    });
  });

  describe('getInventory', () => {
    it('debe retornar inventario con status 200', async () => {
      const mockInventory = {
        totalProducts: 10,
        totalStock: 100,
        lowStockCount: 2,
      };

      mockInventoryService.listInventory.mockResolvedValue(mockInventory as any);

      const request = new NextRequest('http://localhost/api/v1/inventory', {
        method: 'GET',
      });

      const response = await inventoryController.getInventory(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.totalProducts).toBe(10);
      expect(mockInventoryService.listInventory).toHaveBeenCalled();
    });

    it('debe manejar error de servicio', async () => {
      mockInventoryService.listInventory.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost/api/v1/inventory', {
        method: 'GET',
      });

      const response = await inventoryController.getInventory(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Database connection failed');
    });

    it('debe manejar error no identificado', async () => {
      mockInventoryService.listInventory.mockRejectedValue(
        'Unknown error'
      );

      const request = new NextRequest('http://localhost/api/v1/inventory', {
        method: 'GET',
      });

      const response = await inventoryController.getInventory(request);

      expect(response.status).toBe(500);
    });
  });
});
