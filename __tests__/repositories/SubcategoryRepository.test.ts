import { subcategoryRepository } from '../../src/repository/SubcategoryRepository';
import { getDataSource } from '../../src/lib/database';
import { Subcategory } from '../../src/entity/Subcategory';

jest.mock('../../src/lib/database');

const mockQb = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getCount: jest.fn(),
};

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQb),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getDataSource as jest.Mock).mockResolvedValue({ getRepository: jest.fn().mockReturnValue(mockRepo) });
});

const RELATIONS = { category: true };
const ORDER = { name: 'ASC' };

describe('SubcategoryRepository - líneas 6-67', () => {
  describe('findByCategoryId()', () => {
    it('líneas 9-15: encuentra subcategorías activas por categoryId', async () => {
      const subs = [{ id: 'sub-1', name: 'Electroterapia', categoryId: 'cat-1', isActive: true }];
      mockRepo.find.mockResolvedValue(subs);

      const result = await subcategoryRepository.findByCategoryId('cat-1');

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1', isActive: true },
        relations: RELATIONS,
        order: ORDER,
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findAllActive()', () => {
    it('líneas 18-24: retorna todas las subcategorías activas', async () => {
      mockRepo.find.mockResolvedValue([{ id: 'sub-1' }, { id: 'sub-2' }]);

      const result = await subcategoryRepository.findAllActive();

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: RELATIONS,
        order: ORDER,
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findById()', () => {
    it('líneas 27-33: encuentra una subcategoría por id', async () => {
      const sub = { id: 'sub-1', name: 'Masoterapia', isActive: true };
      mockRepo.findOne.mockResolvedValue(sub);

      const result = await subcategoryRepository.findById('sub-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'sub-1', isActive: true },
        relations: RELATIONS,
      });
      expect(result?.id).toBe('sub-1');
    });

    it('retorna null si no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await subcategoryRepository.findById('no-existe');
      expect(result).toBeNull();
    });
  });

  describe('existsByNameInCategory()', () => {
    it('líneas 36-48: retorna true si el nombre ya existe en la categoría', async () => {
      mockQb.getCount.mockResolvedValue(1);

      const exists = await subcategoryRepository.existsByNameInCategory('Electroterapia', 'cat-1');

      expect(mockQb.where).toHaveBeenCalledWith('LOWER(sub.name) = LOWER(:name)', { name: 'Electroterapia' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('sub.categoryId = :categoryId', { categoryId: 'cat-1' });
      expect(exists).toBe(true);
    });

    it('con excludeId: agrega cláusula adicional', async () => {
      mockQb.getCount.mockResolvedValue(0);

      await subcategoryRepository.existsByNameInCategory('Electro', 'cat-1', 'sub-1');

      expect(mockQb.andWhere).toHaveBeenCalledWith('sub.id != :excludeId', { excludeId: 'sub-1' });
    });
  });

  describe('create()', () => {
    it('línea 51: crea instancia de Subcategory', async () => {
      const data: Partial<Subcategory> = { name: 'Nueva Sub', categoryId: 'cat-1' };
      mockRepo.create.mockReturnValue({ ...data, id: 'sub-new' });

      const result = await subcategoryRepository.create(data);

      expect(mockRepo.create).toHaveBeenCalledWith(data);
      expect(result.id).toBe('sub-new');
    });
  });

  describe('save()', () => {
    it('línea 55: persiste la subcategoría', async () => {
      const sub = { id: 'sub-1', name: 'Electro' } as Subcategory;
      mockRepo.save.mockResolvedValue(sub);

      const result = await subcategoryRepository.save(sub);

      expect(mockRepo.save).toHaveBeenCalledWith(sub);
      expect(result.id).toBe('sub-1');
    });
  });

  describe('softDelete()', () => {
    it('líneas 59-62: soft-elimina por id', async () => {
      mockRepo.softDelete.mockResolvedValue(undefined);

      await subcategoryRepository.softDelete('sub-1');

      expect(mockRepo.softDelete).toHaveBeenCalledWith('sub-1');
    });
  });
});
