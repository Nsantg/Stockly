import { subcategoryRepository } from '../../src/repository/SubcategoryRepository';
import { Subcategory } from '../../src/entity/Subcategory';
import * as databaseModule from '../../src/lib/database';

jest.mock('../../src/lib/database');

describe('SubcategoryRepository', () => {
  let repository: typeof subcategoryRepository;
  let mockQueryBuilder: any;
  let mockRepo: any;
  let mockDataSource: any;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = subcategoryRepository;

    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };

    mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((data) => data),
      softDelete: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (databaseModule.getDataSource as jest.Mock).mockResolvedValue(mockDataSource);
  });

  describe('findByCategoryId', () => {
    it('debe buscar subcategorías por categoryId ordenadas por nombre', async () => {
      const mockSubcategories: Subcategory[] = [
        { id: '1', name: 'Sub 1', categoryId: 'cat-1', isActive: true } as Subcategory,
      ];
      mockRepo.find.mockResolvedValue(mockSubcategories);

      const result = await repository.findByCategoryId('cat-1');

      expect(result).toEqual(mockSubcategories);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1', isActive: true },
        relations: { category: true },
        order: { name: 'ASC' },
      });
    });
  });

  describe('findAllActive', () => {
    it('debe retornar todas las subcategorías activas ordenadas por nombre', async () => {
      const mockSubcategories: Subcategory[] = [
        { id: '1', name: 'Sub 1', isActive: true } as Subcategory,
      ];
      mockRepo.find.mockResolvedValue(mockSubcategories);

      const result = await repository.findAllActive();

      expect(result).toEqual(mockSubcategories);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: { category: true },
        order: { name: 'ASC' },
      });
    });
  });

  describe('findById', () => {
    it('debe buscar una subcategoría activa por id', async () => {
      const mockSubcategory = { id: '1', name: 'Sub 1', isActive: true } as Subcategory;
      mockRepo.findOne.mockResolvedValue(mockSubcategory);

      const result = await repository.findById('1');

      expect(result).toEqual(mockSubcategory);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1', isActive: true },
        relations: { category: true },
      });
    });
  });

  describe('existsByNameInCategory', () => {
    it('debe retornar true si existe una subcategoría con el mismo nombre y categoría', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const result = await repository.existsByNameInCategory('Sub 1', 'cat-1');

      expect(result).toBe(true);
      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('sub');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('LOWER(sub.name) = LOWER(:name)', { name: 'Sub 1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('sub.categoryId = :categoryId', { categoryId: 'cat-1' });
    });

    it('debe excluir el id especificado en la validación', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);

      const result = await repository.existsByNameInCategory('Sub 1', 'cat-1', 'exclude-uuid');

      expect(result).toBe(false);
      expect(mockQueryBuilder.andWhere).toHaveBeenLastCalledWith('sub.id != :excludeId', { excludeId: 'exclude-uuid' });
    });
  });

  describe('create', () => {
    it('debe crear una subcategoría instanciándola', async () => {
      const data = { name: 'Nueva Sub' };
      const result = await repository.create(data);

      expect(result).toEqual(data);
      expect(mockRepo.create).toHaveBeenCalledWith(data);
    });
  });

  describe('save', () => {
    it('debe guardar la subcategoría', async () => {
      const subcategory = { id: '1', name: 'Sub' } as Subcategory;
      mockRepo.save.mockResolvedValue(subcategory);

      const result = await repository.save(subcategory);

      expect(result).toEqual(subcategory);
      expect(mockRepo.save).toHaveBeenCalledWith(subcategory);
    });
  });

  describe('softDelete', () => {
    it('debe realizar el soft delete por id', async () => {
      await repository.softDelete('1');
      expect(mockRepo.softDelete).toHaveBeenCalledWith('1');
    });
  });
});
