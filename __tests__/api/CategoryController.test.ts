import { NextRequest } from 'next/server';
import { categoryController } from '../../src/controller/CategoryController';
import * as categoryServiceModule from '../../src/service/CategoryService';
import * as permissionsModule from '../../src/lib/permissions';

const actualCategoryService = jest.requireActual('../../src/service/CategoryService') as typeof import('../../src/service/CategoryService');

jest.mock('../../src/service/CategoryService');
jest.mock('../../src/lib/permissions');

describe('CategoryController', () => {
  let mockCategoryService: jest.Mocked<typeof categoryServiceModule.categoryService>;
  let mockRequireSession: jest.Mock;
  let mockRequireRoles: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryService = categoryServiceModule.categoryService as jest.Mocked<typeof categoryServiceModule.categoryService>;
    mockRequireSession = permissionsModule.requireSession as jest.Mock;
    mockRequireRoles = permissionsModule.requireRoles as jest.Mock;
  });

  describe('getAll', () => {
    it('debe retornar todas las categorías con status 200', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockCategoryService.getAllCategories.mockResolvedValue([
        { id: '1', name: 'Electroterapia', isActive: true },
        { id: '2', name: 'Masoterapia', isActive: true },
      ] as any);

      const response = await categoryController.getAll();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe('Electroterapia');
      expect(mockRequireSession).toHaveBeenCalled();
    });

    it('debe retornar 401 si no hay sesión', async () => {
      const unauthorizedResponse = new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
      mockRequireSession.mockResolvedValue({ ok: false, response: unauthorizedResponse });

      const response = await categoryController.getAll();

      expect(response.status).toBe(401);
    });

    it('debe manejar error de servicio', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockCategoryService.getAllCategories.mockRejectedValue(
        new Error('Database error')
      );

      const response = await categoryController.getAll();

      expect(response.status).toBe(400);
    });

    it('debe retornar lista vacía si no hay categorías', async () => {
      mockRequireSession.mockResolvedValue({ ok: true, response: null });
      mockCategoryService.getAllCategories.mockResolvedValue([]);

      const response = await categoryController.getAll();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });
  });

  describe('create', () => {
    it('debe crear una categoría y retornar 201', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockCategoryService.createCategory.mockResolvedValue({
        id: '1',
        name: 'Electroterapia',
        isActive: true,
      } as any);

      const request = new NextRequest('http://localhost/api/v1/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Electroterapia' }),
      });

      const response = await categoryController.create(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.name).toBe('Electroterapia');
      expect(mockRequireRoles).toHaveBeenCalled();
    });

    it('debe retornar 403 si el usuario no tiene permisos', async () => {
      const forbiddenResponse = new Response(
        JSON.stringify({ error: 'Acceso prohibido' }),
        { status: 403 }
      );
      mockRequireRoles.mockResolvedValue({ ok: false, response: forbiddenResponse });

      const request = new NextRequest('http://localhost/api/v1/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });

      const response = await categoryController.create(request);

      expect(response.status).toBe(403);
    });

    it('debe retornar 400 si los datos son inválidos', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockCategoryService.createCategory.mockImplementation(async (body) => {
        actualCategoryService.createCategorySchema.parse(body);
        return {} as any;
      });

      const request = new NextRequest('http://localhost/api/v1/categories', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      });

      const response = await categoryController.create(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Datos inválidos');
    });

    it('debe manejar error de nombre duplicado', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockCategoryService.createCategory.mockRejectedValue(
        new Error('Ya existe una categoría con el nombre')
      );

      const request = new NextRequest('http://localhost/api/v1/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Electroterapia' }),
      });

      const response = await categoryController.create(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Ya existe');
    });

    it('debe permitir campos opcionales', async () => {
      mockRequireRoles.mockResolvedValue({ ok: true, response: null });
      mockCategoryService.createCategory.mockResolvedValue({
        id: '1',
        name: 'Nueva',
        requiresRefrigeration: true,
        allowsSerialNumber: false,
        isActive: true,
      } as any);

      const request = new NextRequest('http://localhost/api/v1/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Nueva',
          requiresRefrigeration: true,
          allowsSerialNumber: false,
        }),
      });

      const response = await categoryController.create(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.requiresRefrigeration).toBe(true);
    });
  });
});
