import { inventoryController } from '../../src/controller/InventoryController';
import { inventoryService } from '../../src/service/InventoryService';
import { BusinessError } from '../../src/lib/errors';
import { NextRequest } from 'next/server';

jest.mock('../../src/service/InventoryService');
jest.mock('../../src/service/ProductService');
jest.mock('../../src/repository/ProductRepository');
jest.mock('../../src/repository/LotRepository');

function buildRequest(body: unknown, method = 'POST'): NextRequest {
  return {
    method,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

describe('InventoryController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct()', () => {
    it('líneas 18-22: retorna 201 con producto creado si datos son válidos', async () => {
      const body = { code: 'PRD-001', name: 'Electrodo TENS' };
      const created = { id: 'uuid-1', ...body, stock: 0 };
      (inventoryService.createProduct as jest.Mock).mockResolvedValue(created);

      const req = buildRequest(body);
      const res = await inventoryController.createProduct(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.id).toBe('uuid-1');
    });

    it('retorna 400 si el body no tiene campos requeridos (ZodError)', async () => {
      const req = buildRequest({ code: '' });
      const res = await inventoryController.createProduct(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Datos inválidos');
    });

    it('líneas 18-19: retorna 400 si inventoryService lanza BusinessError', async () => {
      const body = { code: 'DUP-001', name: 'Producto Duplicado' };
      (inventoryService.createProduct as jest.Mock).mockRejectedValue(
        new BusinessError('Ya existe un producto con ese código'),
      );

      const req = buildRequest(body);
      const res = await inventoryController.createProduct(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Ya existe un producto con ese código');
    });

    it('líneas 21-22: retorna 400 en error genérico inesperado', async () => {
      const body = { code: 'PRD-ERR', name: 'Producto Error' };
      (inventoryService.createProduct as jest.Mock).mockRejectedValue(new Error('DB connection lost'));

      const req = buildRequest(body);
      const res = await inventoryController.createProduct(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('DB connection lost');
    });
  });

  describe('getInventory() - línea 90', () => {
    it('retorna 200 con la lista de inventario', async () => {
      const list = [{ id: 'uuid-1', name: 'Camilla', stock: 5 }];
      (inventoryService.listInventory as jest.Mock).mockResolvedValue(list);

      const req = buildRequest(null, 'GET');
      const res = await inventoryController.getInventory(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveLength(1);
    });

    it('retorna 400 si listInventory lanza error', async () => {
      (inventoryService.listInventory as jest.Mock).mockRejectedValue(new Error('Timeout'));

      const req = buildRequest(null, 'GET');
      const res = await inventoryController.getInventory(req);
      const data = await res.json();

      expect(res.status).toBe(400);
    });
  });
});
