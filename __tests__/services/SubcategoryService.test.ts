import { subcategoryService } from '../../src/service/SubcategoryService';
import * as subcategoryRepoModule from '../../src/repository/SubcategoryRepository';
import * as categoryRepoModule from '../../src/repository/CategoryRepository';
import * as productRepoModule from '../../src/repository/ProductRepository';

jest.mock('../../src/repository/SubcategoryRepository');
jest.mock('../../src/repository/CategoryRepository');
jest.mock('../../src/repository/ProductRepository');

const CATEGORY_ID = '550e8400-e29b-41d4-a716-446655440000';
const CATEGORY_ID_2 = '550e8400-e29b-41d4-a716-446655440001';
const MISSING_CATEGORY_ID = '550e8400-e29b-41d4-a716-446655440099';
const SUBCATEGORY_ID = '550e8400-e29b-41d4-a716-446655440010';

describe('SubcategoryService', () => {
  let service: typeof subcategoryService;
  let mockSubcategoryRepo: jest.Mocked<typeof subcategoryRepoModule.subcategoryRepository>;
  let mockCategoryRepo: jest.Mocked<typeof categoryRepoModule.categoryRepository>;
  let mockProductRepo: jest.Mocked<typeof productRepoModule.productRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubcategoryRepo = subcategoryRepoModule.subcategoryRepository as jest.Mocked<typeof subcategoryRepoModule.subcategoryRepository>;
    mockCategoryRepo = categoryRepoModule.categoryRepository as jest.Mocked<typeof categoryRepoModule.categoryRepository>;
    mockProductRepo = productRepoModule.productRepository as jest.Mocked<typeof productRepoModule.productRepository>;
    service = subcategoryService;
  });

  describe('createSubcategory', () => {
    it('debe crear una subcategoría válida', async () => {
      const categoryId = CATEGORY_ID;
      const dto = { name: 'Masajeadores', categoryId };

      mockCategoryRepo.findById.mockResolvedValue({
        id: categoryId,
        name: 'Masoterapia',
        isActive: true,
      } as any);
      mockSubcategoryRepo.existsByNameInCategory.mockResolvedValue(false);
      mockSubcategoryRepo.create.mockReturnValue({
        name: 'Masajeadores',
        categoryId,
      } as any);
      mockSubcategoryRepo.save.mockResolvedValue({
        id: SUBCATEGORY_ID,
        name: 'Masajeadores',
        categoryId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      const result = await service.createSubcategory(dto);

      expect(result.name).toBe('Masajeadores');
      expect(mockSubcategoryRepo.create).toHaveBeenCalled();
      expect(mockSubcategoryRepo.save).toHaveBeenCalled();
    });

    it('debe rechazar si la categoría no existe', async () => {
      mockCategoryRepo.findById.mockResolvedValue(null);

      await expect(
        service.createSubcategory({
          name: 'Masajeadores',
          categoryId: MISSING_CATEGORY_ID,
        })
      ).rejects.toThrow('Categoría con id');
    });

    it('debe rechazar si el nombre ya existe en la categoría', async () => {
      const categoryId = CATEGORY_ID;
      mockCategoryRepo.findById.mockResolvedValue({ id: categoryId, name: 'Masoterapia' } as any);
      mockSubcategoryRepo.existsByNameInCategory.mockResolvedValue(true);

      await expect(
        service.createSubcategory({ name: 'Masajeadores', categoryId })
      ).rejects.toThrow('Ya existe una subcategoría con el nombre');
    });

    it('debe validar que el nombre sea requerido', async () => {
      await expect(
        service.createSubcategory({ name: '', categoryId: CATEGORY_ID })
      ).rejects.toThrow();
    });

    it('debe validar que categoryId sea UUID válido', async () => {
      await expect(
        service.createSubcategory({ name: 'Test', categoryId: 'invalid-uuid' })
      ).rejects.toThrow();
    });
  });

  describe('getSubcategoriesByCategory', () => {
    it('debe retornar subcategorías de una categoría', async () => {
      const categoryId = CATEGORY_ID;
      const mockSubcategories = [
        { id: SUBCATEGORY_ID, name: 'Masajeadores', categoryId: CATEGORY_ID },
        { id: '550e8400-e29b-41d4-a716-446655440011', name: 'Estimuladores', categoryId: CATEGORY_ID },
      ];

      mockSubcategoryRepo.findByCategoryId.mockResolvedValue(mockSubcategories as any);

      const result = await service.getSubcategoriesByCategory(categoryId);

      expect(result).toEqual(mockSubcategories);
      expect(mockSubcategoryRepo.findByCategoryId).toHaveBeenCalledWith(categoryId);
    });
  });

  describe('getAllSubcategories', () => {
    it('debe retornar todas las subcategorías activas', async () => {
      const mockSubcategories = [
        { id: SUBCATEGORY_ID, name: 'Masajeadores', categoryId: CATEGORY_ID, isActive: true },
        { id: '550e8400-e29b-41d4-a716-446655440011', name: 'Estimuladores', categoryId: CATEGORY_ID, isActive: true },
      ];

      mockSubcategoryRepo.findAllActive.mockResolvedValue(mockSubcategories as any);

      const result = await service.getAllSubcategories();

      expect(result).toEqual(mockSubcategories);
    });
  });

  describe('getSubcategoryById', () => {
    it('debe retornar una subcategoría por id', async () => {
      const subcategoryId = SUBCATEGORY_ID;
      const mockSubcategory = {
        id: subcategoryId,
        name: 'Masajeadores',
        categoryId: CATEGORY_ID,
        isActive: true,
      };

      mockSubcategoryRepo.findById.mockResolvedValue(mockSubcategory as any);

      const result = await service.getSubcategoryById(subcategoryId);

      expect(result).toEqual(mockSubcategory);
      expect(mockSubcategoryRepo.findById).toHaveBeenCalledWith(subcategoryId);
    });

    it('debe lanzar error si la subcategoría no existe', async () => {
      mockSubcategoryRepo.findById.mockResolvedValue(null);

      await expect(service.getSubcategoryById('invalid-id')).rejects.toThrow(
        'Subcategoría con id'
      );
    });
  });

  describe('updateSubcategory', () => {
    it('debe actualizar una subcategoría existente', async () => {
      const subcategoryId = SUBCATEGORY_ID;
      const categoryId = CATEGORY_ID;
      const existingSubcategory = {
        id: subcategoryId,
        name: 'Masajeadores Original',
        categoryId,
        isActive: true,
      };

      mockSubcategoryRepo.findById.mockResolvedValue(existingSubcategory as any);
      mockSubcategoryRepo.existsByNameInCategory.mockResolvedValue(false);
      mockSubcategoryRepo.save.mockResolvedValue({
        ...existingSubcategory,
        name: 'Masajeadores Actualizado',
      } as any);

      const result = await service.updateSubcategory(subcategoryId, {
        name: 'Masajeadores Actualizado',
      });

      expect(result.name).toBe('Masajeadores Actualizado');
      expect(mockSubcategoryRepo.save).toHaveBeenCalled();
    });

    it('debe cambiar categoría si existe', async () => {
      const subcategoryId = SUBCATEGORY_ID;
      const oldCategoryId = CATEGORY_ID;
      const newCategoryId = CATEGORY_ID_2;

      mockSubcategoryRepo.findById.mockResolvedValue({
        id: subcategoryId,
        name: 'Masajeadores',
        categoryId: oldCategoryId,
        isActive: true,
      } as any);
      mockCategoryRepo.findById.mockResolvedValue({
        id: newCategoryId,
        name: 'Fisioterapia',
        isActive: true,
      } as any);
      mockSubcategoryRepo.existsByNameInCategory.mockResolvedValue(false);
      mockSubcategoryRepo.save.mockResolvedValue({
        id: subcategoryId,
        name: 'Masajeadores',
        categoryId: newCategoryId,
        isActive: true,
      } as any);

      await service.updateSubcategory(subcategoryId, { categoryId: newCategoryId });

      expect(mockCategoryRepo.findById).toHaveBeenCalledWith(newCategoryId);
      expect(mockSubcategoryRepo.save).toHaveBeenCalled();
    });

    it('debe rechazar cambio de categoría a una no existente', async () => {
      const subcategoryId = SUBCATEGORY_ID;
      mockSubcategoryRepo.findById.mockResolvedValue({
        id: subcategoryId,
        name: 'Masajeadores',
        categoryId: CATEGORY_ID,
        isActive: true,
      } as any);
      mockCategoryRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateSubcategory(subcategoryId, {
          categoryId: MISSING_CATEGORY_ID,
        })
      ).rejects.toThrow('Categoría con id');
    });

    it('debe validar que el nombre no sea duplicado en la categoría', async () => {
      const subcategoryId = SUBCATEGORY_ID;
      const categoryId = CATEGORY_ID;
      mockSubcategoryRepo.findById.mockResolvedValue({
        id: subcategoryId,
        name: 'Masajeadores',
        categoryId,
        isActive: true,
      } as any);
      mockSubcategoryRepo.existsByNameInCategory.mockResolvedValue(true);

      await expect(
        service.updateSubcategory(subcategoryId, { name: 'Estimuladores' })
      ).rejects.toThrow('Ya existe una subcategoría con el nombre');
    });

    it('debe lanzar error si intenta actualizar subcategoría inexistente', async () => {
      mockSubcategoryRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateSubcategory('invalid-id', { name: 'Nuevo' })
      ).rejects.toThrow('Subcategoría con id');
    });
  });

  describe('deleteSubcategory', () => {
    it('debe eliminar una subcategoría sin productos', async () => {
      const subcategoryId = SUBCATEGORY_ID;
      mockSubcategoryRepo.findById.mockResolvedValue({
        id: subcategoryId,
        name: 'Masajeadores',
        isActive: true,
      } as any);
      mockProductRepo.findBySubcategoryId.mockResolvedValue([]);
      mockSubcategoryRepo.softDelete.mockResolvedValue(undefined);

      await service.deleteSubcategory(subcategoryId);

      expect(mockSubcategoryRepo.softDelete).toHaveBeenCalledWith(subcategoryId);
    });

    it('debe rechazar eliminar una subcategoría con productos', async () => {
      const subcategoryId = SUBCATEGORY_ID;
      mockSubcategoryRepo.findById.mockResolvedValue({
        id: subcategoryId,
        name: 'Masajeadores',
        isActive: true,
      } as any);
      mockProductRepo.findBySubcategoryId.mockResolvedValue([
        { id: 'prod-1', name: 'Masajeador 1' },
        { id: 'prod-2', name: 'Masajeador 2' },
      ] as any);

      await expect(service.deleteSubcategory(subcategoryId)).rejects.toThrow(
        'No se puede eliminar la subcategoría porque tiene 2 producto(s) activo(s)'
      );

      expect(mockSubcategoryRepo.softDelete).not.toHaveBeenCalled();
    });

    it('debe lanzar error si intenta eliminar subcategoría inexistente', async () => {
      mockSubcategoryRepo.findById.mockResolvedValue(null);

      await expect(service.deleteSubcategory('invalid-id')).rejects.toThrow(
        'Subcategoría con id'
      );
    });
  });
});
