import { categoryRepository } from '../../src/repository/CategoryRepository';
import { Category } from '../../src/entity/Category';
import * as databaseModule from '../../src/lib/database';

jest.mock('../../src/lib/database');

describe('CategoryRepository', () => {
  let repository: typeof categoryRepository;
  let mockQueryBuilder: any;
  let mockRepo: any;
  let mockDataSource: any;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = categoryRepository;

    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
      getCount: jest.fn().mockResolvedValue(0),
    };

    mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      softDelete: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (databaseModule.getDataSource as jest.Mock).mockResolvedValue(mockDataSource);
  });

  describe('findAllActive', () => {
    it('debe retornar todas las categorías activas', async () => {
      const mockCategories: Category[] = [
        { id: '1', name: 'Electroterapia', isActive: true } as Category,
        { id: '2', name: 'Masoterapia', isActive: true } as Category,
      ];
      mockRepo.find.mockResolvedValue(mockCategories);

      const result = await repository.findAllActive();

      expect(result).toEqual(mockCategories);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    });

    it('debe retornar lista vacía si no hay categorías activas', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await repository.findAllActive();

      expect(result).toEqual([]);
    });

    it('debe ordenar por nombre', async () => {
      mockRepo.find.mockResolvedValue([]);

      await repository.findAllActive();

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    });
  });

  describe('findById', () => {
    it('debe retornar una categoría por id si existe', async () => {
      const mockCategory: Category = {
        id: '1',
        name: 'Electroterapia',
        isActive: true,
      } as Category;
      mockRepo.findOne.mockResolvedValue(mockCategory);

      const result = await repository.findById('1');

      expect(result).toEqual(mockCategory);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1', isActive: true },
      });
    });

    it('debe retornar null si no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('debe retornar una categoría por nombre', async () => {
      const mockCategory: Category = {
        id: '1',
        name: 'Electroterapia',
        isActive: true,
      } as Category;
      mockRepo.findOne.mockResolvedValue(mockCategory);

      const result = await repository.findByName('Electroterapia');

      expect(result).toEqual(mockCategory);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { name: 'Electroterapia' },
      });
    });

    it('debe retornar null si el nombre no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByName('NoExiste');

      expect(result).toBeNull();
    });
  });

  describe('existsByName', () => {
    it('debe retornar true si el nombre existe', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const result = await repository.existsByName('Electroterapia');

      expect(result).toBe(true);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('LOWER(category.name) = LOWER(:name)', {
        name: 'Electroterapia',
      });
    });

    it('debe retornar false si el nombre no existe', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);

      const result = await repository.existsByName('NoExiste');

      expect(result).toBe(false);
    });

    it('debe excluir un id específico', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await repository.existsByName('Electroterapia', 'exclude-id');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('category.id != :excludeId', {
        excludeId: 'exclude-id',
      });
    });
  });

  describe('save', () => {
    it('debe guardar una categoría', async () => {
      const mockCategory: Category = {
        id: '1',
        name: 'Electroterapia',
        isActive: true,
      } as Category;
      mockRepo.save.mockResolvedValue(mockCategory);

      const result = await repository.save(mockCategory);

      expect(result).toEqual(mockCategory);
      expect(mockRepo.save).toHaveBeenCalledWith(mockCategory);
    });
  });

  describe('softDelete', () => {
    it('debe marcar una categoría como eliminada', async () => {
      mockRepo.softDelete.mockResolvedValue(undefined);

      await repository.softDelete('1');

      expect(mockRepo.softDelete).toHaveBeenCalledWith('1');
    });
  });
});
