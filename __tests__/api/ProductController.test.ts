import { NextRequest } from 'next/server';
import { productController } from '../../src/controller/ProductController';
import * as productServiceModule from '../../src/service/ProductService';
import * as permissionsModule from '../../src/lib/permissions';

const actualProductService = jest.requireActual('../../src/service/ProductService') as typeof import('../../src/service/ProductService');

jest.mock('../../src/service/ProductService');
jest.mock('../../src/lib/permissions');

describe('ProductController', () => {
  let mockProductService: jest.Mocked<typeof productServiceModule.productService>;
  let mockRequireSession: jest.Mock;
  let mockRequireRoles: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProductService = productServiceModule.productService as jest.Mocked<typeof productServiceModule.productService>;
    mockRequireSession = permissionsModule.requireSession as jest.Mock;
    mockRequireRoles = permissionsModule.requireRoles as jest.Mock;
  });

  describe('getAll', () => {
    it('debe retornar lista paginada de productos', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockProductService.getAllProducts.mockResolvedValue({
        data: [
          { id: '1', code: 'PROD-001', name: 'Electroestimulador', stock: 50 },
          { id: '2', code: 'PROD-002', name: 'Masajeador', stock: 30 },
        ],
        total: 2,
        page: 1,
        limit: 20,
      } as any);

      const request = new NextRequest('http://localhost/api/v1/products?page=1&limit=20', {
        method: 'GET',
      });

      const response = await productController.getAll(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('debe filtrar por categoryId', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockProductService.getAllProducts.mockResolvedValue({
        data: [{ id: '1', code: 'PROD-001', name: 'Producto', categoryId: 'cat-1' }],
        total: 1,
        page: 1,
        limit: 20,
      } as any);

      const request = new NextRequest('http://localhost/api/v1/products?categoryId=cat-1', {
        method: 'GET',
      });

      const response = await productController.getAll(request);

      expect(response.status).toBe(200);
      expect(mockProductService.getAllProducts).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 'cat-1' })
      );
    });

    it('debe filtrar por búsqueda de texto', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockProductService.getAllProducts.mockResolvedValue({
        data: [{ id: '1', code: 'PROD-001', name: 'Electroestimulador' }],
        total: 1,
        page: 1,
        limit: 20,
      } as any);

      const request = new NextRequest('http://localhost/api/v1/products?search=electro', {
        method: 'GET',
      });

      const response = await productController.getAll(request);

      expect(response.status).toBe(200);
      expect(mockProductService.getAllProducts).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'electro' })
      );
    });

    it('debe retornar 401 sin sesión', async () => {
      const unauthorizedResponse = new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
      mockRequireSession.mockResolvedValue({ ok: false, response: unauthorizedResponse });

      const request = new NextRequest('http://localhost/api/v1/products', {
        method: 'GET',
      });

      const response = await productController.getAll(request);

      expect(response.status).toBe(401);
    });

    it('debe manejar error de servicio', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockProductService.getAllProducts.mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost/api/v1/products', {
        method: 'GET',
      });

      const response = await productController.getAll(request);

      expect(response.status).toBe(400);
    });
  });

  describe('create', () => {
    it('debe crear un producto y retornar 201', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockProductService.createProduct.mockResolvedValue({
        id: '1',
        code: 'PROD-001',
        name: 'Electroestimulador',
        subcategoryId: 'sub-1',
        stock: 0,
        isActive: true,
      } as any);

      const request = new NextRequest('http://localhost/api/v1/products', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PROD-001',
          name: 'Electroestimulador',
          subcategoryId: 'sub-1',
        }),
      });

      const response = await productController.create(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.code).toBe('PROD-001');
    });

    it('debe retornar 403 sin permisos de escritura', async () => {
      const forbiddenResponse = new Response(
        JSON.stringify({ error: 'Acceso prohibido' }),
        { status: 403 }
      );
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const request = new NextRequest('http://localhost/api/v1/products', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PROD-001',
          name: 'Test',
          subcategoryId: 'sub-1',
        }),
      });

      const response = await productController.create(request);

      expect(response.status).toBe(403);
    });

    it('debe validar que el código sea requerido', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockProductService.createProduct.mockImplementation(async (body) => {
        actualProductService.createProductSchema.parse(body);
        return {} as any;
      });

      const request = new NextRequest('http://localhost/api/v1/products', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          subcategoryId: 'sub-1',
        }),
      });

      const response = await productController.create(request);

      expect(response.status).toBe(400);
    });

    it('debe manejar error de código duplicado', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockProductService.createProduct.mockRejectedValue(
        new Error('Ya existe un producto con el código')
      );

      const request = new NextRequest('http://localhost/api/v1/products', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PROD-001',
          name: 'Test',
          subcategoryId: 'sub-1',
        }),
      });

      const response = await productController.create(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('código');
    });
  });

  describe('getById', () => {
    it('debe retornar un producto por id', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockProductService.getProductById.mockResolvedValue({
        id: '1',
        code: 'PROD-001',
        name: 'Electroestimulador',
      } as any);

      const response = await productController.getById('1');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.code).toBe('PROD-001');
    });

    it('debe retornar 401 sin sesión', async () => {
      const unauthorizedResponse = new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
      mockRequireSession.mockResolvedValue({ ok: false, response: unauthorizedResponse });

      const response = await productController.getById('1');

      expect(response.status).toBe(401);
    });

    it('debe retornar 404 si el producto no existe', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockProductService.getProductById.mockRejectedValue(
        new Error('Producto no encontrado')
      );

      const response = await productController.getById('invalid-id');

      expect(response.status).toBe(404);
    });
  });

  describe('update', () => {
    it('debe actualizar un producto y retornar 200', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockProductService.updateProduct.mockResolvedValue({
        id: '1',
        code: 'PROD-001',
        name: 'Electroestimulador Actualizado',
      } as any);

      const request = new NextRequest('http://localhost/api/v1/products/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Electroestimulador Actualizado' }),
      });

      const response = await productController.update('1', request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe('Electroestimulador Actualizado');
    });

    it('debe retornar 403 sin permisos', async () => {
      const forbiddenResponse = new Response(
        JSON.stringify({ error: 'Acceso prohibido' }),
        { status: 403 }
      );
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const request = new NextRequest('http://localhost/api/v1/products/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
      });

      const response = await productController.update('1', request);

      expect(response.status).toBe(403);
    });

    it('debe retornar 404 si el producto no existe', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockProductService.updateProduct.mockRejectedValue(
        new Error('Producto no encontrado')
      );

      const request = new NextRequest('http://localhost/api/v1/products/invalid', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
      });

      const response = await productController.update('invalid', request);

      expect(response.status).toBe(404);
    });
  });

  describe('remove', () => {
    it('debe eliminar un producto y retornar 200', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockProductService.deleteProduct.mockResolvedValue(undefined);

      const response = await productController.remove('1');

      expect(response.status).toBe(200);
      expect(mockProductService.deleteProduct).toHaveBeenCalledWith('1');
    });

    it('debe retornar 403 sin permisos', async () => {
      const forbiddenResponse = new Response(
        JSON.stringify({ error: 'Acceso prohibido' }),
        { status: 403 }
      );
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const response = await productController.remove('1');

      expect(response.status).toBe(403);
    });

    it('debe retornar 404 si el producto no existe', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockProductService.deleteProduct.mockRejectedValue(
        new Error('Producto no encontrado')
      );

      const response = await productController.remove('invalid-id');

      expect(response.status).toBe(404);
    });
  });
});
