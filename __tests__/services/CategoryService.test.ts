import { categoryService } from '../../src/service/CategoryService';
import * as categoryRepoModule from '../../src/repository/CategoryRepository';
import * as subcategoryRepoModule from '../../src/repository/SubcategoryRepository';

jest.mock('../../src/repository/CategoryRepository');
jest.mock('../../src/repository/SubcategoryRepository');

describe('CategoryService', () => {
  let service: typeof categoryService;
  let mockCategoryRepo: jest.Mocked<typeof categoryRepoModule.categoryRepository>;
  let mockSubcategoryRepo: jest.Mocked<typeof subcategoryRepoModule.subcategoryRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryRepo = categoryRepoModule.categoryRepository as jest.Mocked<typeof categoryRepoModule.categoryRepository>;
    mockSubcategoryRepo = subcategoryRepoModule.subcategoryRepository as jest.Mocked<typeof subcategoryRepoModule.subcategoryRepository>;
    service = categoryService;
  });

  describe('createCategory', () => {
    it('debe crear una categoría válida', async () => {
      mockCategoryRepo.existsByName.mockResolvedValue(false);
      mockCategoryRepo.create.mockReturnValue({
        name: 'Electroterapia',
        requiresRefrigeration: false,
        allowsSerialNumber: true,
      } as any);
      mockCategoryRepo.save.mockResolvedValue({
        id: '1',
        name: 'Electroterapia',
        requiresRefrigeration: false,
        allowsSerialNumber: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      const result = await service.createCategory({
        name: 'Electroterapia',
        requiresRefrigeration: false,
        allowsSerialNumber: true,
      });

      expect(result.name).toBe('Electroterapia');
      expect(result.allowsSerialNumber).toBe(true);
      expect(mockCategoryRepo.create).toHaveBeenCalled();
      expect(mockCategoryRepo.save).toHaveBeenCalled();
    });

    it('debe rechazar si el nombre ya existe', async () => {
      mockCategoryRepo.existsByName.mockResolvedValue(true);

      await expect(
        service.createCategory({ name: 'Electroterapia' })
      ).rejects.toThrow('Ya existe una categoría con el nombre');
    });

    it('debe validar que el nombre sea requerido', async () => {
      await expect(service.createCategory({ name: '' })).rejects.toThrow();
    });

    it('debe usar valores por defecto para requiresRefrigeration y allowsSerialNumber', async () => {
      mockCategoryRepo.existsByName.mockResolvedValue(false);
      mockCategoryRepo.create.mockReturnValue({
        name: 'Nueva',
        requiresRefrigeration: false,
        allowsSerialNumber: false,
      } as any);
      mockCategoryRepo.save.mockResolvedValue({
        id: '1',
        name: 'Nueva',
        requiresRefrigeration: false,
        allowsSerialNumber: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      await service.createCategory({ name: 'Nueva' });

      const createCall = mockCategoryRepo.create.mock.calls[0][0];
      expect(createCall.requiresRefrigeration).toBe(false);
      expect(createCall.allowsSerialNumber).toBe(false);
    });
  });

  describe('getAllCategories', () => {
    it('debe retornar todas las categorías activas', async () => {
      const mockCategories = [
        { id: '1', name: 'Electroterapia', isActive: true },
        { id: '2', name: 'Masoterapia', isActive: true },
      ];

      mockCategoryRepo.findAllActive.mockResolvedValue(mockCategories as any);

      const result = await service.getAllCategories();

      expect(result).toEqual(mockCategories);
      expect(mockCategoryRepo.findAllActive).toHaveBeenCalled();
    });

    it('debe retornar lista vacía si no hay categorías', async () => {
      mockCategoryRepo.findAllActive.mockResolvedValue([]);

      const result = await service.getAllCategories();

      expect(result).toEqual([]);
    });
  });

  describe('getCategoryById', () => {
    it('debe retornar una categoría por id', async () => {
      const categoryId = '1';
      const mockCategory = {
        id: categoryId,
        name: 'Electroterapia',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockCategoryRepo.findById.mockResolvedValue(mockCategory as any);

      const result = await service.getCategoryById(categoryId);

      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepo.findById).toHaveBeenCalledWith(categoryId);
    });

    it('debe lanzar error si la categoría no existe', async () => {
      mockCategoryRepo.findById.mockResolvedValue(null);

      await expect(service.getCategoryById('invalid-id')).rejects.toThrow('Categoría con id');
    });
  });

  describe('updateCategory', () => {
    it('debe actualizar una categoría existente', async () => {
      const categoryId = '1';
      const existingCategory = {
        id: categoryId,
        name: 'Electroterapia',
        requiresRefrigeration: false,
        allowsSerialNumber: true,
        isActive: true,
      };

      mockCategoryRepo.findById.mockResolvedValue(existingCategory as any);
      mockCategoryRepo.save.mockResolvedValue({
        ...existingCategory,
        name: 'Electroterapia Plus',
      } as any);

      const result = await service.updateCategory(categoryId, { name: 'Electroterapia Plus' });

      expect(result.name).toBe('Electroterapia Plus');
      expect(mockCategoryRepo.save).toHaveBeenCalled();
    });

    it('debe validar que el nuevo nombre no sea duplicado', async () => {
      const categoryId = '1';
      mockCategoryRepo.findById.mockResolvedValue({
        id: categoryId,
        name: 'Electroterapia',
        isActive: true,
      } as any);
      mockCategoryRepo.existsByName.mockResolvedValue(true);

      await expect(
        service.updateCategory(categoryId, { name: 'Masoterapia' })
      ).rejects.toThrow('Ya existe una categoría con el nombre');
    });

    it('debe permitir actualizar sin cambiar el nombre', async () => {
      const categoryId = '1';
      const existingCategory = {
        id: categoryId,
        name: 'Electroterapia',
        requiresRefrigeration: false,
        allowsSerialNumber: true,
        isActive: true,
      };

      mockCategoryRepo.findById.mockResolvedValue(existingCategory as any);
      mockCategoryRepo.save.mockResolvedValue({
        ...existingCategory,
        requiresRefrigeration: true,
      } as any);

      await service.updateCategory(categoryId, { requiresRefrigeration: true });

      expect(mockCategoryRepo.save).toHaveBeenCalled();
    });

    it('debe lanzar error si intenta actualizar categoría inexistente', async () => {
      mockCategoryRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateCategory('invalid-id', { name: 'Nuevo' })
      ).rejects.toThrow('Categoría con id');
    });
  });

  describe('deleteCategory', () => {
    it('debe eliminar una categoría sin subcategorías', async () => {
      const categoryId = '1';
      mockCategoryRepo.findById.mockResolvedValue({
        id: categoryId,
        name: 'Electroterapia',
        isActive: true,
      } as any);
      mockSubcategoryRepo.findByCategoryId.mockResolvedValue([]);
      mockCategoryRepo.softDelete.mockResolvedValue(undefined);

      await service.deleteCategory(categoryId);

      expect(mockCategoryRepo.softDelete).toHaveBeenCalledWith(categoryId);
    });

    it('debe rechazar eliminar una categoría con subcategorías', async () => {
      const categoryId = '1';
      mockCategoryRepo.findById.mockResolvedValue({
        id: categoryId,
        name: 'Electroterapia',
        isActive: true,
      } as any);
      mockSubcategoryRepo.findByCategoryId.mockResolvedValue([
        { id: 'sub-1', name: 'Masajeador' },
        { id: 'sub-2', name: 'Estimulador' },
      ] as any);

      await expect(service.deleteCategory(categoryId)).rejects.toThrow(
        'No se puede eliminar la categoría porque tiene 2 subcategoría(s) activa(s)'
      );

      expect(mockCategoryRepo.softDelete).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la categoría no existe', async () => {
      mockCategoryRepo.findById.mockResolvedValue(null);

      await expect(service.deleteCategory('invalid-id')).rejects.toThrow('Categoría con id');
    });
  });
});
