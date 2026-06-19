import { productRepository } from '../../src/repository/ProductRepository';
import { getDataSource } from '../../src/lib/database';
import { Product } from '../../src/entity/Product';

jest.mock('../../src/lib/database');

const mockQb = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getCount: jest.fn(),
  getMany: jest.fn(),
  getOne: jest.fn(),
  getRawOne: jest.fn(),
};

const mockRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQb),
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.values(mockQb).forEach((fn) => {
    if (typeof fn === 'function' && (fn as jest.Mock).mockReset) {
      (fn as jest.Mock).mockReset();
    }
  });
  mockQb.leftJoinAndSelect.mockReturnThis();
  mockQb.leftJoin.mockReturnThis();
  mockQb.select.mockReturnThis();
  mockQb.where.mockReturnThis();
  mockQb.andWhere.mockReturnThis();
  mockQb.orderBy.mockReturnThis();
  mockQb.skip.mockReturnThis();
  mockQb.take.mockReturnThis();
  mockQb.limit.mockReturnThis();
  mockQb.getCount.mockResolvedValue(0);
  mockQb.getMany.mockResolvedValue([]);
  mockQb.getOne.mockResolvedValue(null);
  mockQb.getRawOne.mockResolvedValue({ total: '0' });
  (getDataSource as jest.Mock).mockResolvedValue({ getRepository: jest.fn().mockReturnValue(mockRepo) });
});

const MOCK_PRODUCT: Partial<Product> = {
  id: 'prod-uuid',
  code: 'PRD-001',
  name: 'Electrodo TENS',
  stock: 50,
  isActive: true,
};

describe('ProductRepository - líneas 22-176', () => {
  describe('findAllActive()', () => {
    it('líneas 22-56: retorna página de productos activos', async () => {
      mockQb.getCount.mockResolvedValue(5);
      mockQb.getMany.mockResolvedValue([MOCK_PRODUCT]);

      const result = await productRepository.findAllActive({ page: 1, limit: 20 });

      expect(result.total).toBe(5);
      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('aplica filtro de subcategoryId', async () => {
      mockQb.getCount.mockResolvedValue(1);
      mockQb.getMany.mockResolvedValue([MOCK_PRODUCT]);

      await productRepository.findAllActive({ subcategoryId: 'sub-1' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'product.subcategoryId = :subcategoryId',
        { subcategoryId: 'sub-1' },
      );
    });

    it('aplica filtro de categoryId cuando no hay subcategoryId', async () => {
      mockQb.getCount.mockResolvedValue(1);
      mockQb.getMany.mockResolvedValue([MOCK_PRODUCT]);

      await productRepository.findAllActive({ categoryId: 'cat-1' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'category.id = :categoryId',
        { categoryId: 'cat-1' },
      );
    });

    it('aplica filtro de búsqueda por texto', async () => {
      mockQb.getCount.mockResolvedValue(1);
      mockQb.getMany.mockResolvedValue([MOCK_PRODUCT]);

      await productRepository.findAllActive({ search: 'electro' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(product.code)'),
        { search: '%electro%' },
      );
    });
  });

  describe('findById()', () => {
    it('líneas 58-68: encuentra producto por id activo', async () => {
      mockQb.getOne.mockResolvedValue(MOCK_PRODUCT);

      const result = await productRepository.findById('prod-uuid');

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('product');
      expect(result?.code).toBe('PRD-001');
    });

    it('retorna null si no existe', async () => {
      mockQb.getOne.mockResolvedValue(null);
      const result = await productRepository.findById('no-existe');
      expect(result).toBeNull();
    });
  });

  describe('findByCode()', () => {
    it('líneas 70-72: encuentra producto por code exacto', async () => {
      mockRepo.findOne.mockResolvedValue(MOCK_PRODUCT);

      const result = await productRepository.findByCode('PRD-001');

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { code: 'PRD-001' } });
      expect(result?.name).toBe('Electrodo TENS');
    });
  });

  describe('existsByCode()', () => {
    it('líneas 74-83: retorna true si el código existe', async () => {
      mockQb.getCount.mockResolvedValue(1);

      const exists = await productRepository.existsByCode('PRD-001');

      expect(exists).toBe(true);
    });

    it('con excludeId: agrega cláusula andWhere', async () => {
      mockQb.getCount.mockResolvedValue(0);

      await productRepository.existsByCode('PRD-001', 'prod-uuid');

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'product.id != :excludeId',
        { excludeId: 'prod-uuid' },
      );
    });
  });

  describe('findForAutocomplete()', () => {
    it('líneas 85-115: busca productos para autocompletado con query', async () => {
      mockQb.getMany.mockResolvedValue([MOCK_PRODUCT]);

      const result = await productRepository.findForAutocomplete('elec');

      expect(result).toHaveLength(1);
      expect(mockQb.limit).toHaveBeenCalledWith(20);
    });

    it('sin query: usa limit 200', async () => {
      mockQb.getMany.mockResolvedValue([]);

      await productRepository.findForAutocomplete('');

      expect(mockQb.limit).toHaveBeenCalledWith(200);
    });

    it('con allowsSerialNumber filtra por categoría', async () => {
      mockQb.getMany.mockResolvedValue([MOCK_PRODUCT]);

      await productRepository.findForAutocomplete('', true);

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'category.allowsSerialNumber = :allowsSerialNumber',
        { allowsSerialNumber: true },
      );
    });

    it('con onlyWithVentas filtra por existencia de ventas', async () => {
      mockQb.getMany.mockResolvedValue([MOCK_PRODUCT]);

      await productRepository.findForAutocomplete('', undefined, true);

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('EXISTS'),
      );
    });
  });

  describe('getTotalStock()', () => {
    it('líneas 117-125: suma el stock total de productos activos', async () => {
      mockQb.getRawOne.mockResolvedValue({ total: '150' });

      const total = await productRepository.getTotalStock();

      expect(total).toBe(150);
    });

    it('retorna 0 si el resultado es null', async () => {
      mockQb.getRawOne.mockResolvedValue(null);

      const total = await productRepository.getTotalStock();

      expect(total).toBe(0);
    });
  });

  describe('countActive()', () => {
    it('líneas 127-130: cuenta productos activos', async () => {
      mockRepo.count.mockResolvedValue(42);

      const count = await productRepository.countActive();

      expect(mockRepo.count).toHaveBeenCalledWith({ where: { isActive: true } });
      expect(count).toBe(42);
    });
  });

  describe('findBelowMinStock()', () => {
    it('líneas 132-141: encuentra productos con stock <= minStock', async () => {
      mockQb.getMany.mockResolvedValue([MOCK_PRODUCT]);

      const result = await productRepository.findBelowMinStock();

      expect(result).toHaveLength(1);
    });
  });

  describe('findBySubcategoryId()', () => {
    it('líneas 143-147: encuentra productos activos por subcategoría', async () => {
      mockRepo.find.mockResolvedValue([MOCK_PRODUCT]);

      const result = await productRepository.findBySubcategoryId('sub-1');

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { subcategoryId: 'sub-1', isActive: true },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('insert()', () => {
    it('líneas 149-153: inserta producto y retorna entidad completa', async () => {
      mockRepo.insert.mockResolvedValue({ identifiers: [{ id: 'prod-uuid' }] });
      mockQb.getOne.mockResolvedValue(MOCK_PRODUCT);

      const result = await productRepository.insert({ code: 'PRD-001', name: 'Electrodo' } as Partial<Product>);

      expect(mockRepo.insert).toHaveBeenCalled();
      expect(result?.code).toBe('PRD-001');
    });
  });

  describe('update()', () => {
    it('líneas 155-159: actualiza producto y retorna entidad', async () => {
      mockRepo.update.mockResolvedValue(undefined);
      mockQb.getOne.mockResolvedValue({ ...MOCK_PRODUCT, name: 'Actualizado' });

      const result = await productRepository.update('prod-uuid', { name: 'Actualizado' } as Partial<Product>);

      expect(mockRepo.update).toHaveBeenCalledWith('prod-uuid', { name: 'Actualizado' });
      expect(result?.name).toBe('Actualizado');
    });
  });

  describe('softDelete()', () => {
    it('líneas 161-164: soft-elimina el producto', async () => {
      mockRepo.softDelete.mockResolvedValue(undefined);

      await productRepository.softDelete('prod-uuid');

      expect(mockRepo.softDelete).toHaveBeenCalledWith('prod-uuid');
    });
  });
});
