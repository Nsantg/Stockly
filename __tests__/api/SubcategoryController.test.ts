import { NextRequest } from 'next/server';
import { subcategoryController } from '../../src/controller/SubcategoryController';
import * as subcategoryServiceModule from '../../src/service/SubcategoryService';
import * as permissionsModule from '../../src/lib/permissions';

const actualSubcategoryService = jest.requireActual('../../src/service/SubcategoryService') as typeof import('../../src/service/SubcategoryService');

jest.mock('../../src/service/SubcategoryService');
jest.mock('../../src/lib/permissions');

describe('SubcategoryController', () => {
  let mockSubcategoryService: jest.Mocked<typeof subcategoryServiceModule.subcategoryService>;
  let mockRequireSession: jest.Mock;
  let mockRequireRoles: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubcategoryService = subcategoryServiceModule.subcategoryService as jest.Mocked<typeof subcategoryServiceModule.subcategoryService>;
    mockRequireSession = permissionsModule.requireSession as jest.Mock;
    mockRequireRoles = permissionsModule.requireRoles as jest.Mock;
  });

  describe('getAll', () => {
    it('debe retornar todas las subcategorías sin filtro', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.getAllSubcategories.mockResolvedValue([
        { id: 'sub-1', name: 'Masajeadores', categoryId: '1' },
        { id: 'sub-2', name: 'Estimuladores', categoryId: '1' },
      ] as any);

      const response = await subcategoryController.getAll();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(mockSubcategoryService.getAllSubcategories).toHaveBeenCalled();
    });

    it('debe retornar subcategorías filtradas por categoría', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.getSubcategoriesByCategory.mockResolvedValue([
        { id: 'sub-1', name: 'Masajeadores', categoryId: '1' },
      ] as any);

      const response = await subcategoryController.getAll('1');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(1);
      expect(mockSubcategoryService.getSubcategoriesByCategory).toHaveBeenCalledWith('1');
    });

    it('debe retornar 401 sin sesión', async () => {
      const unauthorizedResponse = new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
      mockRequireSession.mockResolvedValue({ ok: false, response: unauthorizedResponse });

      const response = await subcategoryController.getAll();

      expect(response.status).toBe(401);
    });

    it('debe manejar error de servicio', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.getAllSubcategories.mockRejectedValue(
        new Error('Database error')
      );

      const response = await subcategoryController.getAll();

      expect(response.status).toBe(400);
    });
  });

  describe('create', () => {
    it('debe crear una subcategoría y retornar 201', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.createSubcategory.mockResolvedValue({
        id: 'sub-1',
        name: 'Masajeadores',
        categoryId: '1',
        isActive: true,
      } as any);

      const request = new NextRequest('http://localhost/api/v1/subcategories', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Masajeadores',
          categoryId: '1',
        }),
      });

      const response = await subcategoryController.create(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.name).toBe('Masajeadores');
    });

    it('debe retornar 403 sin permisos', async () => {
      const forbiddenResponse = new Response(
        JSON.stringify({ error: 'Acceso prohibido' }),
        { status: 403 }
      );
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const request = new NextRequest('http://localhost/api/v1/subcategories', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          categoryId: '1',
        }),
      });

      const response = await subcategoryController.create(request);

      expect(response.status).toBe(403);
    });

    it('debe retornar 400 si el nombre es vacío', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.createSubcategory.mockImplementation(async (body) => {
        actualSubcategoryService.createSubcategorySchema.parse(body);
        return {} as any;
      });

      const request = new NextRequest('http://localhost/api/v1/subcategories', {
        method: 'POST',
        body: JSON.stringify({
          name: '',
          categoryId: '1',
        }),
      });

      const response = await subcategoryController.create(request);

      expect(response.status).toBe(400);
    });

    it('debe retornar 400 si falta categoryId', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.createSubcategory.mockImplementation(async (body) => {
        actualSubcategoryService.createSubcategorySchema.parse(body);
        return {} as any;
      });

      const request = new NextRequest('http://localhost/api/v1/subcategories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });

      const response = await subcategoryController.create(request);

      expect(response.status).toBe(400);
    });

    it('debe manejar error de categoría no encontrada', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.createSubcategory.mockRejectedValue(
        new Error('Categoría con id')
      );

      const request = new NextRequest('http://localhost/api/v1/subcategories', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          categoryId: 'invalid-id',
        }),
      });

      const response = await subcategoryController.create(request);

      expect(response.status).toBe(400);
    });
  });

  describe('remove', () => {
    it('debe eliminar una subcategoría y retornar 200', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.deleteSubcategory.mockResolvedValue(undefined);

      const response = await subcategoryController.remove('sub-1');

      expect(response.status).toBe(200);
      expect(mockSubcategoryService.deleteSubcategory).toHaveBeenCalledWith('sub-1');
    });

    it('debe retornar 403 sin permisos', async () => {
      const forbiddenResponse = new Response(
        JSON.stringify({ error: 'Acceso prohibido' }),
        { status: 403 }
      );
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const response = await subcategoryController.remove('sub-1');

      expect(response.status).toBe(403);
    });

    it('debe retornar 404 si la subcategoría no existe', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.deleteSubcategory.mockRejectedValue(
        new Error('Subcategoría no encontrada')
      );

      const response = await subcategoryController.remove('invalid-id');

      expect(response.status).toBe(404);
    });

    it('debe retornar 400 si tiene productos', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.deleteSubcategory.mockRejectedValue(
        new Error('No se puede eliminar la subcategoría porque tiene 5 producto(s)')
      );

      const response = await subcategoryController.remove('sub-1');

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('producto');
    });

    it('debe retornar 500 ante error desconocido en remove', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.deleteSubcategory.mockRejectedValue('raw string error');

      const response = await subcategoryController.remove('sub-1');

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Error interno del servidor');
    });
  });

  describe('getById', () => {
    it('debe retornar la subcategoría si existe', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.getSubcategoryById.mockResolvedValue({
        id: 'sub-1',
        name: 'Masajeadores',
        categoryId: '1',
        isActive: true,
      } as any);

      const response = await subcategoryController.getById('sub-1');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe('sub-1');
    });

    it('debe retornar 401 sin sesión', async () => {
      const unauthorizedResponse = new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
      mockRequireSession.mockResolvedValue({ ok: false, response: unauthorizedResponse });

      const response = await subcategoryController.getById('sub-1');

      expect(response.status).toBe(401);
    });

    it('debe retornar 404 si la subcategoría no es encontrada', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.getSubcategoryById.mockRejectedValue(
        new Error('Subcategoría no encontrada')
      );

      const response = await subcategoryController.getById('invalid-id');

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Subcategoría no encontrada');
    });

    it('debe retornar 400 ante error genérico', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.getSubcategoryById.mockRejectedValue(
        new Error('Generic error')
      );

      const response = await subcategoryController.getById('sub-1');

      expect(response.status).toBe(400);
    });

    it('debe retornar 500 ante error desconocido', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.getSubcategoryById.mockRejectedValue('raw string error');

      const response = await subcategoryController.getById('sub-1');

      expect(response.status).toBe(500);
    });
  });

  describe('update', () => {
    it('debe actualizar la subcategoría y retornar 200', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.updateSubcategory.mockResolvedValue({
        id: 'sub-1',
        name: 'Masajeadores Avanzados',
        categoryId: '1',
        isActive: true,
      } as any);

      const request = new NextRequest('http://localhost/api/v1/subcategories/sub-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Masajeadores Avanzados', categoryId: '1' }),
      });
      const response = await subcategoryController.update('sub-1', request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe('Masajeadores Avanzados');
    });

    it('debe retornar 403 sin permisos', async () => {
      const forbiddenResponse = new Response(
        JSON.stringify({ error: 'Acceso prohibido' }),
        { status: 403 }
      );
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const request = new NextRequest('http://localhost/api/v1/subcategories/sub-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
      });
      const response = await subcategoryController.update('sub-1', request);

      expect(response.status).toBe(403);
    });

    it('debe retornar 404 si la subcategoría no existe', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.updateSubcategory.mockRejectedValue(
        new Error('Subcategoría no encontrada')
      );

      const request = new NextRequest('http://localhost/api/v1/subcategories/invalid', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
      });
      const response = await subcategoryController.update('invalid', request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('no encontrada');
    });

    it('debe retornar 400 ante error genérico', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.updateSubcategory.mockRejectedValue(
        new Error('Generic error')
      );

      const request = new NextRequest('http://localhost/api/v1/subcategories/sub-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
      });
      const response = await subcategoryController.update('sub-1', request);

      expect(response.status).toBe(400);
    });

    it('debe retornar 500 ante error desconocido', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.updateSubcategory.mockRejectedValue('raw string error');

      const request = new NextRequest('http://localhost/api/v1/subcategories/sub-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
      });
      const response = await subcategoryController.update('sub-1', request);

      expect(response.status).toBe(500);
    });
  });

  describe('handleError 500 branch', () => {
    it('debe retornar 500 en getAll ante tipo de error desconocido', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.getAllSubcategories.mockRejectedValue('raw string error');

      const response = await subcategoryController.getAll();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Error interno del servidor');
    });

    it('debe retornar 500 en create ante tipo de error desconocido', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockSubcategoryService.createSubcategory.mockRejectedValue('raw string error');

      const request = new NextRequest('http://localhost/api/v1/subcategories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', categoryId: '1' }),
      });
      const response = await subcategoryController.create(request);

      expect(response.status).toBe(500);
    });
  });
});
